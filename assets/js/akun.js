(function () {
  'use strict';
  var Store = window.MW.Store;
  var Fmt = window.MW.Format;
  var GROUP_ORDER = ['Kas & Bank', 'Dompet Digital', 'Aset & Investasi', 'Kartu Kredit/Hutang'];

  var accountModal, adjustModal;

  function formatAmountInput(el) {
    el.addEventListener('input', function () {
      var digits = el.value.replace(/\D/g, '');
      el.value = digits ? Number(digits).toLocaleString('id-ID') : '';
    });
  }

  function renderSummary() {
    document.getElementById('totalAssetsVal').textContent = Fmt.formatRupiah(Store.totalAssets());
    document.getElementById('totalLiabilitiesVal').textContent = Fmt.formatRupiah(Store.totalLiabilities());
    document.getElementById('netWorthVal').textContent = Fmt.formatRupiah(Store.netWorth());
  }

  function groupIcon(g) {
    return { 'Kas & Bank': 'bi-bank', 'Dompet Digital': 'bi-wallet2', 'Aset & Investasi': 'bi-gem', 'Kartu Kredit/Hutang': 'bi-credit-card' }[g] || 'bi-folder2';
  }

  function renderGroups() {
    var accounts = Store.getAccounts();
    var groups = {};
    accounts.forEach(function (a) { (groups[a.group] = groups[a.group] || []).push(a); });
    var orderedKeys = GROUP_ORDER.filter(function (g) { return groups[g]; }).concat(Object.keys(groups).filter(function (g) { return GROUP_ORDER.indexOf(g) === -1; }));

    var host = document.getElementById('accountGroups');
    if (!accounts.length) {
      host.innerHTML = '<div class="mw-card"><div class="empty-state"><i class="bi bi-wallet2"></i>Belum ada akun. Tambahkan akun pertama Anda.</div></div>';
      return;
    }

    host.innerHTML = orderedKeys.map(function (g) {
      var list = groups[g];
      var groupTotal = list.reduce(function (s, a) { return s + a.balance; }, 0);
      return '<div class="mw-card mb-3">' +
        '<div class="mw-card-header"><div><h3><i class="bi ' + groupIcon(g) + ' me-2 text-muted-mw"></i>' + g + '</h3></div>' +
        '<span class="group-total">' + list.length + ' akun &middot; ' + Fmt.formatRupiah(groupTotal) + '</span></div>' +
        '<div class="row g-3">' + list.map(function (a) { return accountCardHTML(a); }).join('') + '</div>' +
        '</div>';
    }).join('');

    host.querySelectorAll('[data-action="edit-acc"]').forEach(function (btn) {
      btn.addEventListener('click', function () { openAccountModal(btn.getAttribute('data-id')); });
    });
    host.querySelectorAll('[data-action="delete-acc"]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!confirm('Hapus akun ini?')) return;
        var res = await Store.deleteAccount(btn.getAttribute('data-id'));
        if (!res.ok) alert('Akun tidak dapat dihapus karena masih memiliki riwayat transaksi. Hapus atau pindahkan transaksinya terlebih dahulu.');
      });
    });
    host.querySelectorAll('[data-action="adjust"]').forEach(function (btn) {
      btn.addEventListener('click', function () { openAdjustModal(btn.getAttribute('data-id')); });
    });
  }

  function accountCardHTML(a) {
    var cls = a.kind === 'liability' ? 'down' : 'neutral';
    return '<div class="col-md-6 col-xl-4"><div class="account-card">' +
      '<div class="acc-top"><span class="cat-icon-circle" style="background:' + (a.kind === 'liability' ? 'var(--status-critical)' : 'var(--series-1)') + '"><i class="bi ' + a.icon + '"></i></span>' +
      '<div><div style="font-weight:600;">' + Fmt.escapeHTML(a.name) + '</div><div class="text-muted-mw" style="font-size:12px;">' + (a.kind === 'liability' ? 'Liabilitas' : 'Aset') + '</div></div></div>' +
      '<div class="amount-text ' + cls + '" style="font-size:20px;">' + Fmt.formatRupiah(a.balance) + '</div>' +
      '<div class="acc-actions">' +
      '<button class="btn btn-sm btn-outline-secondary" data-action="adjust" data-id="' + a.id + '"><i class="bi bi-sliders me-1"></i>Sesuaikan</button>' +
      '<button class="btn btn-sm btn-outline-secondary" data-action="edit-acc" data-id="' + a.id + '"><i class="bi bi-pencil"></i></button>' +
      '<button class="btn btn-sm btn-outline-secondary" data-action="delete-acc" data-id="' + a.id + '"><i class="bi bi-trash3"></i></button>' +
      '</div></div></div>';
  }

  function openAccountModal(id) {
    var title = document.getElementById('accountModalTitle');
    var deleteBtn = document.getElementById('accDeleteBtn');
    var balanceWrap = document.getElementById('accBalanceWrap');
    document.getElementById('accountForm').reset();
    if (id) {
      var a = Store.getAccount(id);
      if (!a) return;
      title.textContent = 'Edit Akun';
      deleteBtn.classList.remove('d-none');
      document.getElementById('accId').value = a.id;
      document.getElementById('accName').value = a.name;
      document.getElementById('accGroup').value = a.group;
      document.getElementById('accBalance').value = Number(a.balance).toLocaleString('id-ID');
      document.getElementById('accBalance').disabled = true;
      document.getElementById('accBalanceHint').textContent = "Gunakan tombol 'Sesuaikan' pada kartu akun untuk mengubah saldo.";
    } else {
      title.textContent = 'Tambah Akun';
      deleteBtn.classList.add('d-none');
      document.getElementById('accId').value = '';
      document.getElementById('accBalance').disabled = false;
      document.getElementById('accBalanceHint').textContent = '';
    }
    accountModal.show();
  }

  function openAdjustModal(id) {
    var a = Store.getAccount(id);
    if (!a) return;
    document.getElementById('adjAccId').value = a.id;
    document.getElementById('adjAccName').textContent = a.name;
    document.getElementById('adjCurrentBalance').textContent = Fmt.formatRupiah(a.balance);
    document.getElementById('adjNewBalance').value = Number(a.balance).toLocaleString('id-ID');
    document.getElementById('adjNote').value = '';
    adjustModal.show();
  }

  function kindForGroup(g) { return g === 'Kartu Kredit/Hutang' ? 'liability' : 'asset'; }

  document.addEventListener('DOMContentLoaded', async function () {
    var ready = await Store.init();
    if (!ready) return;
    window.MW.Layout.init('akun', false);
    accountModal = new bootstrap.Modal(document.getElementById('accountModal'));
    adjustModal = new bootstrap.Modal(document.getElementById('adjustModal'));

    formatAmountInput(document.getElementById('accBalance'));
    formatAmountInput(document.getElementById('adjNewBalance'));

    renderSummary();
    renderGroups();

    document.getElementById('addAccountBtn').addEventListener('click', function () { openAccountModal(); });

    document.getElementById('accountForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var id = document.getElementById('accId').value;
      var group = document.getElementById('accGroup').value;
      var name = document.getElementById('accName').value.trim();
      try {
        if (id) {
          await Store.updateAccount(id, { name: name, group: group, kind: kindForGroup(group) });
        } else {
          var balance = Number(document.getElementById('accBalance').value.replace(/\D/g, '')) || 0;
          await Store.addAccount({ name: name, group: group, kind: kindForGroup(group), balance: balance });
        }
        accountModal.hide();
      } catch (err) {
        alert('Gagal menyimpan akun: ' + (err.message || err));
      }
    });

    document.getElementById('accDeleteBtn').addEventListener('click', async function () {
      var id = document.getElementById('accId').value;
      if (!id || !confirm('Hapus akun ini?')) return;
      var res = await Store.deleteAccount(id);
      if (!res.ok) alert('Akun tidak dapat dihapus karena masih memiliki riwayat transaksi.');
      else accountModal.hide();
    });

    document.getElementById('adjustForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var id = document.getElementById('adjAccId').value;
      var newBalance = Number(document.getElementById('adjNewBalance').value.replace(/\D/g, '')) || 0;
      var note = document.getElementById('adjNote').value.trim();
      try {
        await Store.adjustBalance(id, newBalance, note);
        adjustModal.hide();
      } catch (err) {
        alert('Gagal menyesuaikan saldo: ' + (err.message || err));
      }
    });
  });

  window.addEventListener('mw:data-changed', function () { renderSummary(); renderGroups(); });
})();
