(function () {
  'use strict';
  var Store = window.MW.Store;
  var Fmt = window.MW.Format;

  var activeTab = 'daily';
  var now = new Date();
  var calSelectedDate = null;
  var periodYear = now.getFullYear();
  var periodMonth = now.getMonth();

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function toISO(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

  function renderPeriodNav() {
    document.getElementById('periodLabel').textContent = Fmt.formatMonthYear(toISO(new Date(periodYear, periodMonth, 1)));
  }

  function applyPeriodToFilters() {
    document.getElementById('filterStart').value = toISO(new Date(periodYear, periodMonth, 1));
    document.getElementById('filterEnd').value = toISO(new Date(periodYear, periodMonth + 1, 0));
  }

  function populateFilterOptions() {
    var catSelect = document.getElementById('filterCategory');
    var prevCat = catSelect.value;
    var allCats = Store.getCategories('expense').concat(Store.getCategories('income'));
    catSelect.innerHTML = '<option value="">All</option>' + allCats.map(function (c) {
      return '<option value="' + c.id + '">' + c.name + '</option>';
    }).join('');
    catSelect.value = prevCat;

    var accSelect = document.getElementById('filterAccount');
    var prevAcc = accSelect.value;
    accSelect.innerHTML = '<option value="">All</option>' + Store.getAccounts().map(function (a) {
      return '<option value="' + a.id + '">' + a.name + '</option>';
    }).join('');
    accSelect.value = prevAcc;
  }

  function currentFilters() {
    return {
      type: document.getElementById('filterType').value,
      category: document.getElementById('filterCategory').value,
      account: document.getElementById('filterAccount').value,
      start: document.getElementById('filterStart').value,
      end: document.getElementById('filterEnd').value,
      q: document.getElementById('filterSearch').value
    };
  }

  function rowHTML(t) {
    var cat = Store.findCategory(t.category);
    var acc = Store.getAccount(t.account_id);
    var toAcc = t.to_account_id ? Store.getAccount(t.to_account_id) : null;
    var accountLabel = toAcc
      ? Fmt.escapeHTML(acc ? acc.name : '-') + ' <i class="bi bi-arrow-right mx-1 text-muted-mw"></i> ' + Fmt.escapeHTML(toAcc.name)
      : Fmt.escapeHTML(acc ? acc.name : '-');
    var catLabel = cat ? cat.name : (t.type === 'transfer' ? 'Transfer Between Accounts' : 'Balance Adjustment');
    var author = Store.findMember(t.created_by);
    var subParts = [accountLabel];
    if (t.note) subParts.push(Fmt.escapeHTML(t.note));
    if (author) subParts.push(Fmt.escapeHTML(author.name));
    var sign = t.type === 'income' ? '+' : (t.type === 'expense' ? '-' : (t.amount < 0 ? '-' : '+'));
    var cls = t.type === 'income' ? 'up' : (t.type === 'expense' ? 'down' : 'neutral');
    return '<div class="tx-row" data-id="' + t.id + '">' +
      '<div class="tx-row-main">' +
      '<div class="tx-row-cat">' + Fmt.escapeHTML(catLabel) + '</div>' +
      '<div class="tx-row-sub">' + subParts.join(' &middot; ') + '</div>' +
      '</div>' +
      '<div class="tx-row-amount amount-text ' + cls + '">' + sign + Fmt.formatRupiah(Math.abs(t.amount)) + '</div>' +
      '</div>';
  }

  function wireRowClicks(host) {
    host.querySelectorAll('.tx-row').forEach(function (row) {
      row.addEventListener('click', function () {
        window.MW.TransactionForm.open(row.getAttribute('data-id'));
      });
    });
  }

  // ---------------- Daily tab ----------------
  function groupByDay(list) {
    var groups = [];
    var byDate = {};
    list.forEach(function (t) {
      if (!byDate[t.date]) {
        byDate[t.date] = { date: t.date, items: [], income: 0, expense: 0 };
        groups.push(byDate[t.date]);
      }
      byDate[t.date].items.push(t);
      if (t.type === 'income') byDate[t.date].income += t.amount;
      else if (t.type === 'expense') byDate[t.date].expense += t.amount;
    });
    return groups;
  }

  function dayGroupHTML(g) {
    return '<div class="tx-day">' +
      '<div class="tx-day-head">' +
      '<div class="tx-day-datebox"><span class="tx-day-dom">' + Fmt.dayOfMonth(g.date) + '</span><span class="tx-day-dow">' + Fmt.formatDayAbbr(g.date) + '</span></div>' +
      '<div class="tx-day-label">' + Fmt.formatMonthYear(g.date) + '</div>' +
      '<div class="tx-day-sums">' +
      '<span class="amount-text up">+' + Fmt.formatRupiah(g.income) + '</span>' +
      '<span class="amount-text down">-' + Fmt.formatRupiah(g.expense) + '</span>' +
      '</div></div>' +
      '<div class="tx-day-items">' + g.items.map(rowHTML).join('') + '</div>' +
      '</div>';
  }

  function computeTotals(list) {
    var income = 0, expense = 0;
    list.forEach(function (t) {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return { income: income, expense: expense, balance: income - expense };
  }

  function typeLabel(type) {
    return { income: 'Income', expense: 'Expense', transfer: 'Transfer', adjustment: 'Adjustment' }[type] || type;
  }

  function exportExcel() {
    var list = Store.getTransactions(currentFilters());
    if (!list.length) {
      alert('No transactions to export for the current filters.');
      return;
    }
    var rows = list.map(function (t) {
      var cat = Store.findCategory(t.category);
      var acc = Store.getAccount(t.account_id);
      var toAcc = t.to_account_id ? Store.getAccount(t.to_account_id) : null;
      var author = Store.findMember(t.created_by);
      var catLabel = cat ? cat.name : (t.type === 'transfer' ? 'Transfer Between Accounts' : 'Balance Adjustment');
      return {
        Date: t.date,
        Time: t.time || '',
        Type: typeLabel(t.type),
        Category: catLabel,
        Account: acc ? acc.name : '',
        'To Account': toAcc ? toAcc.name : '',
        Note: t.note || '',
        'Recorded By': author ? author.name : '',
        Amount: t.amount
      };
    });
    var ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 11 }, { wch: 7 }, { wch: 11 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 28 }, { wch: 14 }, { wch: 14 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'mywealth-transactions-' + Store.todayISO() + '.xlsx');
  }

  function renderDaily() {
    var list = Store.getTransactions(currentFilters());
    var host = document.getElementById('txList');
    var empty = document.getElementById('txEmpty');
    document.getElementById('txCountLabel').textContent = list.length + ' transactions';

    var t = computeTotals(list);
    document.getElementById('dailyIncomeVal').textContent = Fmt.formatRupiah(t.income);
    document.getElementById('dailyExpenseVal').textContent = Fmt.formatRupiah(t.expense);
    document.getElementById('dailyTotalVal').textContent = Fmt.formatRupiah(t.balance);

    if (!list.length) {
      host.innerHTML = '';
      empty.classList.remove('d-none');
      return;
    }
    empty.classList.add('d-none');
    host.innerHTML = groupByDay(list).map(dayGroupHTML).join('');
    wireRowClicks(host);
  }

  // ---------------- Monthly tab ----------------
  function groupByMonth(list) {
    var groups = [];
    var byMonth = {};
    list.forEach(function (t) {
      var key = t.date.slice(0, 7);
      if (!byMonth[key]) {
        byMonth[key] = { key: key, date: t.date, items: [], income: 0, expense: 0 };
        groups.push(byMonth[key]);
      }
      byMonth[key].items.push(t);
      if (t.type === 'income') byMonth[key].income += t.amount;
      else if (t.type === 'expense') byMonth[key].expense += t.amount;
    });
    return groups;
  }

  function monthGroupHTML(g) {
    return '<div class="tx-day">' +
      '<div class="tx-day-head">' +
      '<div class="tx-day-label" style="font-size:15px;">' + Fmt.formatMonthYear(g.date) + '</div>' +
      '<div class="tx-day-sums">' +
      '<span class="amount-text up">+' + Fmt.formatRupiah(g.income) + '</span>' +
      '<span class="amount-text down">-' + Fmt.formatRupiah(g.expense) + '</span>' +
      '</div></div>' +
      '<div class="tx-day-items">' + g.items.map(rowHTML).join('') + '</div>' +
      '</div>';
  }

  function renderMonthly() {
    var list = Store.getTransactions(currentFilters());
    var host = document.getElementById('monthlyList');
    var empty = document.getElementById('monthlyEmpty');
    if (!list.length) {
      host.innerHTML = '';
      empty.classList.remove('d-none');
      return;
    }
    empty.classList.add('d-none');
    host.innerHTML = groupByMonth(list).map(monthGroupHTML).join('');
    wireRowClicks(host);
  }

  // ---------------- Total tab ----------------
  function renderTotal() {
    var t = computeTotals(Store.getTransactions(currentFilters()));
    document.getElementById('totIncomeVal').textContent = Fmt.formatRupiah(t.income);
    document.getElementById('totExpenseVal').textContent = Fmt.formatRupiah(t.expense);
    document.getElementById('totBalanceVal').textContent = Fmt.formatRupiah(t.balance);
  }

  // ---------------- Calendar tab ----------------
  function calendarFilters() {
    var f = currentFilters();
    f.start = toISO(new Date(periodYear, periodMonth, 1));
    f.end = toISO(new Date(periodYear, periodMonth + 1, 0));
    return f;
  }

  function renderCalDayDetail() {
    var card = document.getElementById('calDayCard');
    if (!calSelectedDate) { card.classList.add('d-none'); return; }
    var list = Store.getTransactions(calendarFilters()).filter(function (t) { return t.date === calSelectedDate; });
    document.getElementById('calDayTitle').textContent = Fmt.formatDateLong(calSelectedDate);
    var listHost = document.getElementById('calDayList');
    if (!list.length) {
      listHost.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i>No transactions on this date.</div>';
    } else {
      listHost.innerHTML = list.map(rowHTML).join('');
      wireRowClicks(listHost);
    }
    card.classList.remove('d-none');
  }

  function renderCalendar() {
    var list = Store.getTransactions(calendarFilters());
    var byDate = {};
    list.forEach(function (t) {
      if (!byDate[t.date]) byDate[t.date] = { income: 0, expense: 0 };
      if (t.type === 'income') byDate[t.date].income += t.amount;
      else if (t.type === 'expense') byDate[t.date].expense += t.amount;
    });

    var daysInMonth = new Date(periodYear, periodMonth + 1, 0).getDate();
    var jsStartDay = new Date(periodYear, periodMonth, 1).getDay();
    var startOffset = (jsStartDay + 6) % 7; // 0=Monday ... 6=Sunday
    var todayIso = Store.todayISO();

    var cells = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (d) {
      return '<div class="cal-dow">' + d + '</div>';
    }).join('');
    for (var i = 0; i < startOffset; i++) cells += '<div class="cal-cell empty"></div>';
    for (var day = 1; day <= daysInMonth; day++) {
      var iso = toISO(new Date(periodYear, periodMonth, day));
      var sums = byDate[iso];
      var cls = 'cal-cell' + (iso === todayIso ? ' today' : '') + (iso === calSelectedDate ? ' selected' : '');
      var amtHtml = sums ? '<div class="cal-cell-amt">' +
        (sums.income ? '<span class="in">+' + Fmt.formatCompact(sums.income) + '</span>' : '') +
        (sums.expense ? '<span class="out">-' + Fmt.formatCompact(sums.expense) + '</span>' : '') +
        '</div>' : '';
      cells += '<div class="' + cls + '" data-date="' + iso + '"><div class="cal-daynum">' + day + '</div>' + amtHtml + '</div>';
    }
    var totalCells = startOffset + daysInMonth;
    var trailing = (7 - (totalCells % 7)) % 7;
    for (var j = 0; j < trailing; j++) cells += '<div class="cal-cell empty"></div>';
    var grid = document.getElementById('calGrid');
    grid.innerHTML = cells;
    grid.querySelectorAll('.cal-cell[data-date]').forEach(function (cell) {
      cell.addEventListener('click', function () {
        calSelectedDate = cell.getAttribute('data-date');
        renderCalendar();
      });
    });

    renderCalDayDetail();
  }

  // ---------------- Note tab ----------------
  function renderNotes() {
    var notes = Store.getNotes();
    var host = document.getElementById('noteList');
    var empty = document.getElementById('noteEmpty');
    if (!notes.length) {
      host.innerHTML = '';
      empty.classList.remove('d-none');
      return;
    }
    empty.classList.add('d-none');
    host.innerHTML = notes.map(function (n) {
      var author = Store.findMember(n.createdBy);
      var d = new Date(n.createdAt);
      var whenLabel = Fmt.formatDateShort(n.createdAt.slice(0, 10)) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
      return '<li style="align-items:flex-start;">' +
        '<span class="legend-left" style="flex-direction:column;align-items:flex-start;gap:2px;">' +
        '<span>' + Fmt.escapeHTML(n.content).replace(/\n/g, '<br>') + '</span>' +
        '<span class="text-muted-mw" style="font-size:11px;">' + whenLabel + (author ? ' &middot; ' + Fmt.escapeHTML(author.name) : '') + '</span>' +
        '</span>' +
        '<button class="btn btn-sm" data-id="' + n.id + '" style="border:none;color:var(--text-muted);"><i class="bi bi-trash3"></i></button>' +
        '</li>';
    }).join('');
    host.querySelectorAll('button[data-id]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!confirm('Delete this note?')) return;
        try {
          await Store.deleteNote(btn.getAttribute('data-id'));
        } catch (err) {
          alert('Failed to delete note: ' + (err.message || err));
        }
      });
    });
  }

  // ---------------- Tab switching ----------------
  function renderActiveTab() {
    if (activeTab === 'daily') renderDaily();
    else if (activeTab === 'calendar') renderCalendar();
    else if (activeTab === 'monthly') renderMonthly();
    else if (activeTab === 'total') renderTotal();
    else if (activeTab === 'note') renderNotes();
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tx-tab').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
    ['daily', 'calendar', 'monthly', 'total', 'note'].forEach(function (t) {
      document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1)).classList.toggle('d-none', t !== tab);
    });
    document.getElementById('filterPanel').classList.toggle('d-none', tab === 'note');
    renderActiveTab();
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var ready = await Store.init();
    if (!ready) return;
    window.MW.Layout.init('transaksi', false);
    populateFilterOptions();
    applyPeriodToFilters();
    renderPeriodNav();
    switchTab('daily');

    document.querySelectorAll('.tx-tab').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.getAttribute('data-tab')); });
    });

    document.getElementById('periodPrevBtn').addEventListener('click', function () {
      periodMonth -= 1;
      if (periodMonth < 0) { periodMonth = 11; periodYear -= 1; }
      calSelectedDate = null;
      applyPeriodToFilters();
      renderPeriodNav();
      renderActiveTab();
    });
    document.getElementById('periodNextBtn').addEventListener('click', function () {
      periodMonth += 1;
      if (periodMonth > 11) { periodMonth = 0; periodYear += 1; }
      calSelectedDate = null;
      applyPeriodToFilters();
      renderPeriodNav();
      renderActiveTab();
    });

    ['filterType', 'filterCategory', 'filterAccount', 'filterStart', 'filterEnd'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', renderActiveTab);
    });
    document.getElementById('filterSearch').addEventListener('input', Fmt.debounce(renderActiveTab, 200));
    document.getElementById('exportExcelBtn').addEventListener('click', exportExcel);
    document.getElementById('clearFiltersBtn').addEventListener('click', function () {
      document.getElementById('filterType').value = 'all';
      document.getElementById('filterCategory').value = '';
      document.getElementById('filterAccount').value = '';
      document.getElementById('filterStart').value = '';
      document.getElementById('filterEnd').value = '';
      document.getElementById('filterSearch').value = '';
      renderActiveTab();
    });

    document.getElementById('noteAddBtn').addEventListener('click', async function () {
      var input = document.getElementById('noteInput');
      var val = input.value.trim();
      if (!val) return;
      try {
        await Store.addNote(val);
        input.value = '';
      } catch (err) {
        alert('Failed to save note: ' + (err.message || err));
      }
    });
  });

  window.addEventListener('mw:data-changed', function () { populateFilterOptions(); renderActiveTab(); });
})();
