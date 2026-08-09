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

  function typeBadge(t) {
    var map = {
      income: ['income', 'bi-arrow-down-circle', 'Pemasukan'],
      expense: ['expense', 'bi-arrow-up-circle', 'Pengeluaran'],
      transfer: ['transfer', 'bi-arrow-left-right', 'Transfer'],
      adjustment: ['adjustment', 'bi-sliders', 'Penyesuaian']
    };
    var m = map[t] || map.adjustment;
    return '<span class="type-badge ' + m[0] + '"><i class="bi ' + m[1] + '"></i>' + m[2] + '</span>';
  }

  function renderTable() {
    var list = Store.getTransactions(currentFilters());
    var body = document.getElementById('txTableBody');
    var empty = document.getElementById('txEmpty');
    document.getElementById('txCountLabel').textContent = list.length + ' transaksi';

    if (!list.length) {
      body.innerHTML = '';
      empty.classList.remove('d-none');
      return;
    }
    empty.classList.add('d-none');

    body.innerHTML = list.map(function (t) {
      var cat = Store.findCategory(t.category);
      var acc = Store.getAccount(t.account_id);
      var toAcc = t.to_account_id ? Store.getAccount(t.to_account_id) : null;
      var accountLabel = toAcc ? (acc ? acc.name : '-') + ' <i class="bi bi-arrow-right mx-1 text-muted-mw"></i> ' + toAcc.name : (acc ? acc.name : '-');
      var catLabel = cat ? cat.name : (t.type === 'transfer' ? 'Transfer Antar Akun' : 'Penyesuaian Saldo');
      var author = Store.findMember(t.created_by);
      var sign = t.type === 'income' ? '+' : (t.type === 'expense' ? '-' : (t.amount < 0 ? '-' : '+'));
      var cls = t.type === 'income' ? 'up' : (t.type === 'expense' ? 'down' : 'neutral');
      return '<tr>' +
        '<td class="text-secondary-mw" style="white-space:nowrap;">' + Fmt.formatDateShort(t.date) + '<div class="text-muted-mw" style="font-size:11px;">' + (t.time || '') + '</div></td>' +
        '<td>' + typeBadge(t.type) + '</td>' +
        '<td>' + Fmt.escapeHTML(catLabel) + '</td>' +
        '<td class="text-secondary-mw">' + accountLabel + '</td>' +
        '<td class="text-muted-mw">' + Fmt.escapeHTML(t.note || '-') + '</td>' +
        '<td class="text-secondary-mw">' + (author ? Fmt.escapeHTML(author.name) : '-') + '</td>' +
        '<td class="text-end amount-text ' + cls + '" style="white-space:nowrap;">' + sign + Fmt.formatRupiah(Math.abs(t.amount)) + '</td>' +
        '<td><div class="row-actions">' +
        '<button data-action="edit" data-id="' + t.id + '" title="Edit"><i class="bi bi-pencil"></i></button>' +
        '<button data-action="delete" data-id="' + t.id + '" title="Hapus"><i class="bi bi-trash3"></i></button>' +
        '</div></td>' +
        '</tr>';
    }).join('');

    body.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
      btn.addEventListener('click', function () { window.MW.TransactionForm.open(btn.getAttribute('data-id')); });
    });
    body.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
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
