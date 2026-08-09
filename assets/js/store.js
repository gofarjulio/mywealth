/* MyWealth data layer — Supabase-backed. Mutating calls (add/update/delete)
   are async and hit the database; everything derived (totals, charts,
   filtered lists) reads a local cache that's refreshed after every write,
   so page code can keep calling those synchronously. */
(function (global) {
  'use strict';

  var sb = null;
  var cache = null;

  function todayISO() {
    var d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function notify(kind) {
    global.dispatchEvent(new CustomEvent('mw:data-changed', { detail: { kind: kind } }));
  }

  function mapCategoryRow(row) {
    return { id: row.id, name: row.name, icon: row.icon, colorSlot: row.color_slot };
  }
  function mapAccountRow(row, balanceMap) {
    return {
      id: row.id, name: row.name, group: row.account_group, kind: row.kind, icon: row.icon,
      balance: balanceMap[row.id] != null ? balanceMap[row.id] : Number(row.opening_balance)
    };
  }
  function mapTransactionRow(row) {
    return {
      id: row.id, date: row.tx_date, time: (row.tx_time || '00:00').slice(0, 5),
      type: row.type, amount: Number(row.amount), category: row.category_id,
      account_id: row.account_id, to_account_id: row.to_account_id || undefined,
      note: row.note || '', created_by: row.created_by || null
    };
  }

  // ---------- Auth + initial load ----------
  async function currentFamilyMember() {
    var sessionRes = await sb.auth.getSession();
    var session = sessionRes.data.session;
    if (!session) {
      global.location.href = 'login.html';
      return null;
    }
    var res = await sb.from('family_members').select('*').eq('auth_user_id', session.user.id).maybeSingle();
    if (res.error || !res.data) {
      alert('Akun ini sudah login tapi belum terhubung ke data keluarga manapun. Hubungi admin untuk menautkan akun.');
      await sb.auth.signOut();
      global.location.href = 'login.html';
      return null;
    }
    return res.data;
  }

  async function fetchAll() {
    var member = await currentFamilyMember();
    if (!member) return null;
    var familyId = member.family_id;

    var results = await Promise.all([
      sb.from('family_members').select('*').eq('family_id', familyId).order('created_at'),
      sb.from('categories').select('*').eq('family_id', familyId).order('created_at'),
      sb.from('accounts').select('*').eq('family_id', familyId).order('created_at'),
      sb.from('account_balances').select('*'),
      sb.from('transactions').select('*').eq('family_id', familyId).order('tx_date', { ascending: false }),
      sb.from('families').select('*').eq('id', familyId).maybeSingle(),
      sb.from('notes').select('*').eq('family_id', familyId).order('created_at', { ascending: false })
    ]);
    var membersRes = results[0], catRes = results[1], accRes = results[2], balRes = results[3], txRes = results[4], famRes = results[5], notesRes = results[6];

    var firstError = [membersRes, catRes, accRes, balRes, txRes, famRes, notesRes].find(function (r) { return r.error; });
    if (firstError) throw firstError.error;

    var balanceMap = {};
    (balRes.data || []).forEach(function (b) { balanceMap[b.account_id] = Number(b.balance); });

    cache = {
      familyId: familyId,
      memberId: member.id,
      settings: {
        familyName: (famRes.data && famRes.data.name) || 'Keluarga',
        activeMemberId: member.id,
        activeMemberName: member.name
      },
      members: (membersRes.data || []).map(function (m) { return { id: m.id, name: m.name, role: m.role, initials: m.initials, hasLogin: !!m.auth_user_id }; }),
      categories: {
        expense: (catRes.data || []).filter(function (c) { return c.type === 'expense'; }).map(mapCategoryRow),
        income: (catRes.data || []).filter(function (c) { return c.type === 'income'; }).map(mapCategoryRow)
      },
      accounts: (accRes.data || []).map(function (a) { return mapAccountRow(a, balanceMap); }),
      transactions: (txRes.data || []).map(mapTransactionRow),
      notes: (notesRes.data || []).map(function (n) {
        return { id: n.id, content: n.content, createdBy: n.created_by, createdAt: n.created_at };
      })
    };
    return cache;
  }

  async function init() {
    sb = global.MW.supabase;
    var result = await fetchAll();
    return result;
  }

  function getState() { return cache; }

  async function logout() {
    await sb.auth.signOut();
    global.location.href = 'login.html';
  }

  // ---------- Settings ----------
  function getSettings() { return cache.settings; }
  async function updateSettings(patch) {
    if (patch.familyName) {
      var res = await sb.from('families').update({ name: patch.familyName }).eq('id', cache.familyId);
      if (res.error) throw res.error;
    }
    await fetchAll();
    notify('settings-updated');
  }

  // ---------- Members ----------
  function getMembers() { return cache.members; }
  async function addMember(m) {
    var initials = (m.name || '?').trim().slice(0, 2).toUpperCase();
    var payload = { family_id: cache.familyId, name: m.name, role: m.role || 'Anggota', initials: initials, email: m.email || null };
    var res = await sb.from('family_members').insert(payload);
    if (res.error) throw res.error;
    await fetchAll();
    notify('member-added');
  }
  async function updateMember(id, patch) {
    var payload = {};
    if (patch.name) { payload.name = patch.name; payload.initials = patch.name.trim().slice(0, 2).toUpperCase(); }
    if (patch.role) payload.role = patch.role;
    var res = await sb.from('family_members').update(payload).eq('id', id);
    if (res.error) throw res.error;
    await fetchAll();
    notify('member-updated');
  }
  async function deleteMember(id) {
    if (id === cache.memberId) return { ok: false, reason: 'self' };
    var target = cache.members.find(function (m) { return m.id === id; });
    if (target && target.hasLogin) return { ok: false, reason: 'linked' };
    var res = await sb.from('family_members').delete().eq('id', id);
    if (res.error) return { ok: false, reason: res.error.message };
    await fetchAll();
    notify('member-deleted');
    return { ok: true };
  }

  // ---------- Categories ----------
  function getCategories(type) { return cache.categories[type] || []; }
  async function addCategory(type, cat) {
    var slot = ((cache.categories[type] || []).length % 8) + 1;
    var payload = { family_id: cache.familyId, type: type, name: cat.name, icon: cat.icon || 'bi-tag', color_slot: slot };
    var res = await sb.from('categories').insert(payload);
    if (res.error) throw res.error;
    await fetchAll();
    notify('category-added');
  }
  async function updateCategory(type, id, patch) {
    var payload = {};
    if (patch.name) payload.name = patch.name;
    if (patch.icon) payload.icon = patch.icon;
    var res = await sb.from('categories').update(payload).eq('id', id);
    if (res.error) throw res.error;
    await fetchAll();
    notify('category-updated');
  }
  async function deleteCategory(type, id) {
    var inUse = cache.transactions.some(function (t) { return t.category === id; });
    if (inUse) return { ok: false, reason: 'in-use' };
    var res = await sb.from('categories').delete().eq('id', id);
    if (res.error) return { ok: false, reason: res.error.message };
    await fetchAll();
    notify('category-deleted');
    return { ok: true };
  }
  function findCategory(id) {
    if (!id) return null;
    return cache.categories.expense.concat(cache.categories.income).find(function (c) { return c.id === id; }) || null;
  }
  function findMember(id) {
    if (!id) return null;
    return cache.members.find(function (m) { return m.id === id; }) || null;
  }

  // ---------- Accounts ----------
  function getAccounts() { return cache.accounts; }
  function getAccount(id) { return cache.accounts.find(function (a) { return a.id === id; }) || null; }
  async function addAccount(acc) {
    var payload = {
      family_id: cache.familyId, name: acc.name, account_group: acc.group, kind: acc.kind || 'asset',
      icon: acc.icon || (acc.kind === 'liability' ? 'bi-credit-card' : 'bi-wallet2'),
      opening_balance: Number(acc.balance) || 0
    };
    var res = await sb.from('accounts').insert(payload);
    if (res.error) throw res.error;
    await fetchAll();
    notify('account-added');
  }
  async function updateAccount(id, patch) {
    var payload = {};
    if (patch.name) payload.name = patch.name;
    if (patch.group) payload.account_group = patch.group;
    if (patch.kind) payload.kind = patch.kind;
    if (patch.icon) payload.icon = patch.icon;
    var res = await sb.from('accounts').update(payload).eq('id', id);
    if (res.error) throw res.error;
    await fetchAll();
    notify('account-updated');
  }
  async function deleteAccount(id) {
    var inUse = cache.transactions.some(function (t) { return t.account_id === id || t.to_account_id === id; });
    if (inUse) return { ok: false, reason: 'in-use' };
    var res = await sb.from('accounts').delete().eq('id', id);
    if (res.error) return { ok: false, reason: res.error.message };
    await fetchAll();
    notify('account-deleted');
    return { ok: true };
  }
  async function adjustBalance(id, newBalance, note) {
    var acc = getAccount(id);
    if (!acc) return;
    var diff = Number(newBalance) - acc.balance;
    if (diff === 0) return;
    var payload = {
      family_id: cache.familyId, tx_date: todayISO(), tx_time: '00:00', type: 'adjustment',
      amount: diff, category_id: null, account_id: id, to_account_id: null,
      note: note || 'Penyesuaian saldo', created_by: cache.memberId
    };
    var res = await sb.from('transactions').insert(payload);
    if (res.error) throw res.error;
    await fetchAll();
    notify('balance-adjusted');
  }

  // ---------- Transactions ----------
  function getTransactions(filters) {
    filters = filters || {};
    var list = cache.transactions.slice().sort(function (a, b) {
      var da = a.date + ' ' + (a.time || '00:00');
      var db = b.date + ' ' + (b.time || '00:00');
      return db.localeCompare(da);
    });
    if (filters.type && filters.type !== 'all') list = list.filter(function (t) { return t.type === filters.type; });
    if (filters.category) list = list.filter(function (t) { return t.category === filters.category; });
    if (filters.account) list = list.filter(function (t) { return t.account_id === filters.account || t.to_account_id === filters.account; });
    if (filters.start) list = list.filter(function (t) { return t.date >= filters.start; });
    if (filters.end) list = list.filter(function (t) { return t.date <= filters.end; });
    if (filters.q) {
      var q = filters.q.toLowerCase();
      list = list.filter(function (t) { return (t.note || '').toLowerCase().indexOf(q) !== -1; });
    }
    return list;
  }
  function getTransaction(id) { return cache.transactions.find(function (t) { return t.id === id; }) || null; }
  async function addTransaction(tx) {
    var payload = {
      family_id: cache.familyId, tx_date: tx.date || todayISO(), tx_time: tx.time || '00:00', type: tx.type,
      amount: Number(tx.amount) || 0, category_id: tx.type === 'transfer' ? null : (tx.category || null),
      account_id: tx.account_id, to_account_id: tx.type === 'transfer' ? tx.to_account_id : null,
      note: tx.note || '', created_by: cache.memberId
    };
    var res = await sb.from('transactions').insert(payload);
    if (res.error) throw res.error;
    await fetchAll();
    notify('transaction-added');
  }
  async function updateTransaction(id, patch) {
    var payload = {
      tx_date: patch.date, tx_time: patch.time || '00:00', type: patch.type,
      amount: Number(patch.amount) || 0, account_id: patch.account_id, note: patch.note || '',
      category_id: patch.type === 'transfer' ? null : (patch.category || null),
      to_account_id: patch.type === 'transfer' ? patch.to_account_id : null
    };
    var res = await sb.from('transactions').update(payload).eq('id', id);
    if (res.error) throw res.error;
    await fetchAll();
    notify('transaction-updated');
  }
  async function deleteTransaction(id) {
    var res = await sb.from('transactions').delete().eq('id', id);
    if (res.error) throw res.error;
    await fetchAll();
    notify('transaction-deleted');
  }
  function recentTransactions(limit) { return getTransactions({}).slice(0, limit || 8); }

  // ---------- Computed ----------
  function totalAssets() {
    return cache.accounts.filter(function (a) { return a.kind === 'asset'; }).reduce(function (s, a) { return s + a.balance; }, 0);
  }
  function totalLiabilities() {
    return cache.accounts.filter(function (a) { return a.kind === 'liability'; }).reduce(function (s, a) { return s + a.balance; }, 0);
  }
  function netWorth() { return totalAssets() - totalLiabilities(); }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function toISO(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

  function periodRange(key) {
    var now = new Date();
    var start, end, label;
    if (key === 'this-week') {
      var day = (now.getDay() + 6) % 7;
      start = new Date(now); start.setDate(now.getDate() - day);
      end = new Date(start); end.setDate(start.getDate() + 6);
      label = 'Minggu Ini';
    } else if (key === 'last-month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      label = 'Bulan Lalu';
    } else if (key === 'this-year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      label = 'Tahun Ini';
    } else if (key === 'all') {
      start = new Date(2000, 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      label = 'Semua Waktu';
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      label = 'Bulan Ini';
    }
    return { start: toISO(start), end: toISO(end), label: label };
  }

  function previousPeriodRange(key) {
    var now = new Date();
    var start, end;
    if (key === 'this-week') {
      var day = (now.getDay() + 6) % 7;
      var curStart = new Date(now); curStart.setDate(now.getDate() - day);
      start = new Date(curStart); start.setDate(curStart.getDate() - 7);
      end = new Date(curStart); end.setDate(curStart.getDate() - 1);
    } else if (key === 'last-month') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = new Date(now.getFullYear(), now.getMonth() - 1, 0);
    } else if (key === 'this-year') {
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31);
    } else if (key === 'all') {
      return null;
    } else {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    }
    return { start: toISO(start), end: toISO(end) };
  }

  function totals(start, end) {
    var list = getTransactions({ start: start, end: end });
    var income = 0, expense = 0;
    list.forEach(function (t) {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return { income: income, expense: expense, balance: income - expense };
  }

  function categoryBreakdown(start, end, type) {
    type = type || 'expense';
    var list = getTransactions({ start: start, end: end, type: type });
    var map = {};
    list.forEach(function (t) {
      if (!t.category) return;
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    var total = Object.keys(map).reduce(function (s, k) { return s + map[k]; }, 0);
    var rows = Object.keys(map).map(function (catId) {
      var cat = findCategory(catId) || { id: catId, name: catId, icon: 'bi-tag', colorSlot: 8 };
      var amt = map[catId];
      return { categoryId: cat.id, name: cat.name, icon: cat.icon, colorSlot: cat.colorSlot, total: amt, pct: total ? (amt / total * 100) : 0 };
    });
    rows.sort(function (a, b) { return b.total - a.total; });
    return rows;
  }

  function monthLabel(y, m) {
    var names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return names[m] + ' ' + y;
  }

  function monthlyTrend(monthsBack) {
    monthsBack = monthsBack || 6;
    var now = new Date();
    var out = [];
    for (var i = monthsBack - 1; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var start = toISO(new Date(d.getFullYear(), d.getMonth(), 1));
      var end = toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      var t = totals(start, end);
      out.push({ label: monthLabel(d.getFullYear(), d.getMonth()), income: t.income, expense: t.expense });
    }
    return out;
  }

  function exportJSON() { return JSON.stringify(cache, null, 2); }

  // ---------- Notes ----------
  function getNotes() { return cache.notes; }
  async function addNote(content) {
    var payload = { family_id: cache.familyId, content: content, created_by: cache.memberId };
    var res = await sb.from('notes').insert(payload);
    if (res.error) throw res.error;
    await fetchAll();
    notify('note-added');
  }
  async function deleteNote(id) {
    var res = await sb.from('notes').delete().eq('id', id);
    if (res.error) throw res.error;
    await fetchAll();
    notify('note-deleted');
  }

  global.MW = global.MW || {};
  global.MW.Store = {
    init: init, getState: getState, logout: logout,
    getSettings: getSettings, updateSettings: updateSettings,
    getMembers: getMembers, addMember: addMember, updateMember: updateMember, deleteMember: deleteMember, findMember: findMember,
    getCategories: getCategories, addCategory: addCategory, updateCategory: updateCategory, deleteCategory: deleteCategory, findCategory: findCategory,
    getAccounts: getAccounts, getAccount: getAccount, addAccount: addAccount, updateAccount: updateAccount, deleteAccount: deleteAccount, adjustBalance: adjustBalance,
    getTransactions: getTransactions, getTransaction: getTransaction, addTransaction: addTransaction, updateTransaction: updateTransaction, deleteTransaction: deleteTransaction, recentTransactions: recentTransactions,
    totalAssets: totalAssets, totalLiabilities: totalLiabilities, netWorth: netWorth,
    periodRange: periodRange, previousPeriodRange: previousPeriodRange, totals: totals, categoryBreakdown: categoryBreakdown, monthlyTrend: monthlyTrend,
    getNotes: getNotes, addNote: addNote, deleteNote: deleteNote,
    exportJSON: exportJSON, todayISO: todayISO
  };
})(window);
