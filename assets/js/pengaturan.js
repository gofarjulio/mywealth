(function () {
  'use strict';
  var Store = window.MW.Store;
  var Fmt = window.MW.Format;

  var ICON_CHOICES = [
    { value: 'bi-tag', label: 'Umum' },
    { value: 'bi-cup-hot', label: 'Makanan' },
    { value: 'bi-train-front', label: 'Transportasi' },
    { value: 'bi-lightning-charge', label: 'Tagihan' },
    { value: 'bi-bag', label: 'Belanja' },
    { value: 'bi-heart-pulse', label: 'Kesehatan' },
    { value: 'bi-film', label: 'Hiburan' },
    { value: 'bi-mortarboard', label: 'Pendidikan' },
    { value: 'bi-house', label: 'Rumah' },
    { value: 'bi-briefcase', label: 'Gaji' },
    { value: 'bi-gift', label: 'Bonus' },
    { value: 'bi-graph-up-arrow', label: 'Investasi' }
  ];

  function populateIconSelects() {
    var html = ICON_CHOICES.map(function (i) { return '<option value="' + i.value + '">' + i.label + '</option>'; }).join('');
    document.getElementById('expenseCatIcon').innerHTML = html;
    document.getElementById('incomeCatIcon').innerHTML = html;
  }

  function renderCategoryList(type, hostId) {
    var cats = Store.getCategories(type);
    var host = document.getElementById(hostId);
    if (!cats.length) { host.innerHTML = '<li class="text-muted-mw">Belum ada kategori.</li>'; return; }
    host.innerHTML = cats.map(function (c) {
      return '<li><span class="legend-left"><span class="cat-icon-circle" style="width:26px;height:26px;font-size:11px;background:var(--series-' + c.colorSlot + ')"><i class="bi ' + c.icon + '"></i></span>' + Fmt.escapeHTML(c.name) + '</span>' +
        '<button class="btn btn-sm" data-type="' + type + '" data-id="' + c.id + '" style="border:none;color:var(--text-muted);"><i class="bi bi-trash3"></i></button></li>';
    }).join('');
    host.querySelectorAll('button[data-id]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!confirm('Hapus kategori ini?')) return;
        var res = await Store.deleteCategory(btn.getAttribute('data-type'), btn.getAttribute('data-id'));
        if (!res.ok) alert('Kategori tidak dapat dihapus karena masih dipakai pada transaksi.');
      });
    });
  }

  function renderMembers() {
    var members = Store.getMembers();
    var activeId = Store.getSettings().activeMemberId;
    var host = document.getElementById('memberList');
    if (!members.length) { host.innerHTML = '<li class="text-muted-mw">Belum ada anggota.</li>'; return; }
    host.innerHTML = members.map(function (m) {
      return '<li><span class="legend-left"><span class="avatar-circle" style="width:26px;height:26px;font-size:10px;">' + m.initials + '</span>' +
        Fmt.escapeHTML(m.name) + ' <span class="text-muted-mw" style="font-size:12px;">(' + m.role + ')</span>' +
        (m.id === activeId ? ' <span class="type-badge income" style="margin-left:6px;">Aktif</span>' : '') + '</span>' +
        '<span>' +
        '<button class="btn btn-sm" data-edit-id="' + m.id + '" style="border:none;color:var(--text-muted);"><i class="bi bi-pencil"></i></button>' +
        '<button class="btn btn-sm" data-id="' + m.id + '" style="border:none;color:var(--text-muted);"><i class="bi bi-trash3"></i></button>' +
        '</span></li>';
    }).join('');
    host.querySelectorAll('button[data-edit-id]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var m = members.find(function (x) { return x.id === btn.getAttribute('data-edit-id'); });
        if (!m) return;
        var newName = prompt('Nama anggota:', m.name);
        if (newName === null) return;
        newName = newName.trim();
        if (!newName) return;
        var newRole = prompt('Peran (mis. Suami/Istri/Anak):', m.role);
        if (newRole === null) return;
        newRole = newRole.trim() || m.role;
        try {
          await Store.updateMember(m.id, { name: newName, role: newRole });
        } catch (err) {
          alert('Gagal mengubah anggota: ' + (err.message || err));
        }
      });
    });
    host.querySelectorAll('button[data-id]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!confirm('Hapus anggota ini?')) return;
        var res = await Store.deleteMember(btn.getAttribute('data-id'));
        if (!res.ok) {
          if (res.reason === 'self') alert('Anda tidak bisa menghapus akun Anda sendiri yang sedang login.');
          else if (res.reason === 'linked') alert('Anggota ini masih punya akses login aktif. Hapus dulu user-nya lewat Supabase Authentication sebelum menghapus data anggota ini di sini.');
          else alert('Gagal menghapus anggota.');
        }
      });
    });
  }

  function renderAll() {
    renderCategoryList('expense', 'expenseCatList');
    renderCategoryList('income', 'incomeCatList');
    renderMembers();
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var ready = await Store.init();
    if (!ready) return;
    window.MW.Layout.init('pengaturan', false);
    populateIconSelects();
    renderAll();

    document.getElementById('familyNameInput').value = Store.getSettings().familyName;
    document.getElementById('darkModeSwitch').checked = document.documentElement.getAttribute('data-theme') === 'dark';

    document.getElementById('expenseCatForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = document.getElementById('expenseCatName').value.trim();
      var icon = document.getElementById('expenseCatIcon').value;
      if (!name) return;
      await Store.addCategory('expense', { name: name, icon: icon });
      this.reset();
    });
    document.getElementById('incomeCatForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = document.getElementById('incomeCatName').value.trim();
      var icon = document.getElementById('incomeCatIcon').value;
      if (!name) return;
      await Store.addCategory('income', { name: name, icon: icon });
      this.reset();
    });
    document.getElementById('memberForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = document.getElementById('memberName').value.trim();
      var role = document.getElementById('memberRole').value;
      if (!name) return;
      await Store.addMember({ name: name, role: role });
      this.reset();
    });

    document.getElementById('familyNameInput').addEventListener('change', async function () {
      await Store.updateSettings({ familyName: this.value.trim() || 'Keluarga' });
    });

    document.getElementById('darkModeSwitch').addEventListener('change', function () {
      var theme = this.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('mw_theme', theme);
      window.dispatchEvent(new CustomEvent('mw:theme-changed', { detail: { theme: theme } }));
      var icon = document.getElementById('themeIcon');
      if (icon) icon.className = 'bi ' + (theme === 'dark' ? 'bi-sun' : 'bi-moon-stars');
    });

    document.getElementById('exportJsonBtn').addEventListener('click', function () {
      var blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'mywealth-backup-' + Store.todayISO() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });

  window.addEventListener('mw:data-changed', renderAll);
})();
