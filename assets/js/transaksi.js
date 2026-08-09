(function () {
  'use strict';
  var Store = window.MW.Store;
  var Fmt = window.MW.Format;

  function populateFilterOptions() {
    var catSelect = document.getElementById('filterCategory');
    var prevCat = catSelect.value;
    var allCats = Store.getCategories('expense').concat(Store.getCategories('income'));
    catSelect.innerHTML = '<option value="">Semua</option>' + allCats.map(function (c) {
      return '<option value="' + c.id + '">' + c.name + '</option>';
    }).join('');
    catSelect.value = prevCat;

    var accSelect = document.getElementById('filterAccount');
    var prevAcc = accSelect.value;
    accSelect.innerHTML = '<option value="">Semua</option>' + Store.getAccounts().map(function (a) {
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

  function rowHTML(t) {
    var cat = Store.findCategory(t.category);
    var acc = Store.getAccount(t.account_id);
    var toAcc = t.to_account_id ? Store.getAccount(t.to_account_id) : null;
    var accountLabel = toAcc
      ? Fmt.escapeHTML(acc ? acc.name : '-') + ' <i class="bi bi-arrow-right mx-1 text-muted-mw"></i> ' + Fmt.escapeHTML(toAcc.name)
      : Fmt.escapeHTML(acc ? acc.name : '-');
    var catLabel = cat ? cat.name : (t.type === 'transfer' ? 'Transfer Antar Akun' : 'Penyesuaian Saldo');
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
      '<button class="tx-row-del" data-action="delete" data-id="' + t.id + '" title="Hapus"><i class="bi bi-trash3"></i></button>' +
      '</div>';
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

  function renderTable() {
    var list = Store.getTransactions(currentFilters());
    var host = document.getElementById('txList');
    var empty = document.getElementById('txEmpty');
    document.getElementById('txCountLabel').textContent = list.length + ' transaksi';

    if (!list.length) {
      host.innerHTML = '';
      empty.classList.remove('d-none');
      return;
    }
    empty.classList.add('d-none');

    host.innerHTML = groupByDay(list).map(dayGroupHTML).join('');

    host.querySelectorAll('.tx-row').forEach(function (row) {
      row.addEventListener('click', function () {
        window.MW.TransactionForm.open(row.getAttribute('data-id'));
      });
    });
    host.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
      btn.addEventListener('click', async function (e) {
        e.stopPropagation();
        if (!confirm('Hapus transaksi ini? Saldo akun akan disesuaikan kembali.')) return;
        try {
          await Store.deleteTransaction(btn.getAttribute('data-id'));
        } catch (err) {
          alert('Gagal menghapus transaksi: ' + (err.message || err));
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var ready = await Store.init();
    if (!ready) return;
    window.MW.Layout.init('transaksi', false);
    populateFilterOptions();
    renderTable();

    ['filterType', 'filterCategory', 'filterAccount', 'filterStart', 'filterEnd'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', renderTable);
    });
    document.getElementById('filterSearch').addEventListener('input', Fmt.debounce(renderTable, 200));
    document.getElementById('clearFiltersBtn').addEventListener('click', function () {
      document.getElementById('filterType').value = 'all';
      document.getElementById('filterCategory').value = '';
      document.getElementById('filterAccount').value = '';
      document.getElementById('filterStart').value = '';
      document.getElementById('filterEnd').value = '';
      document.getElementById('filterSearch').value = '';
      renderTable();
    });
  });
  window.addEventListener('mw:data-changed', function () { populateFilterOptions(); renderTable(); });
})();
