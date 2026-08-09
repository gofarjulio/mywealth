(function () {
  'use strict';
  var Store = window.MW.Store;
  var Fmt = window.MW.Format;

  var ICON_CHOICES = [
    { value: 'bi-tag', label: 'General' },
    { value: 'bi-cup-hot', label: 'Food' },
    { value: 'bi-train-front', label: 'Transportation' },
    { value: 'bi-lightning-charge', label: 'Bills' },
    { value: 'bi-bag', label: 'Shopping' },
    { value: 'bi-heart-pulse', label: 'Health' },
    { value: 'bi-film', label: 'Entertainment' },
    { value: 'bi-mortarboard', label: 'Education' },
    { value: 'bi-house', label: 'Home' },
    { value: 'bi-briefcase', label: 'Salary' },
    { value: 'bi-gift', label: 'Bonus' },
    { value: 'bi-graph-up-arrow', label: 'Investment' }
  ];

  function populateIconSelects() {
    var html = ICON_CHOICES.map(function (i) { return '<option value="' + i.value + '">' + i.label + '</option>'; }).join('');
    document.getElementById('expenseCatIcon').innerHTML = html;
    document.getElementById('incomeCatIcon').innerHTML = html;
  }

  function renderCategoryList(type, hostId) {
    var cats = Store.getCategories(type);
    var host = document.getElementById(hostId);
    if (!cats.length) { host.innerHTML = '<li class="text-muted-mw">No categories yet.</li>'; return; }
    host.innerHTML = cats.map(function (c) {
      return '<li><span class="legend-left"><span class="cat-icon-circle" style="width:26px;height:26px;font-size:11px;background:var(--series-' + c.colorSlot + ')"><i class="bi ' + c.icon + '"></i></span>' + Fmt.escapeHTML(c.name) + '</span>' +
        '<button class="btn btn-sm" data-type="' + type + '" data-id="' + c.id + '" style="border:none;color:var(--text-muted);"><i class="bi bi-trash3"></i></button></li>';
    }).join('');
    host.querySelectorAll('button[data-id]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!confirm('Delete this category?')) return;
        var res = await Store.deleteCategory(btn.getAttribute('data-type'), btn.getAttribute('data-id'));
        if (!res.ok) alert('This category cannot be deleted because it is still used by transactions.');
      });
    });
  }

  function renderMembers() {
    var members = Store.getMembers();
    var activeId = Store.getSettings().activeMemberId;
    var host = document.getElementById('memberList');
    if (!members.length) { host.innerHTML = '<li class="text-muted-mw">No members yet.</li>'; return; }
    host.innerHTML = members.map(function (m) {
      return '<li><span class="legend-left"><span class="avatar-circle" style="width:26px;height:26px;font-size:10px;">' + m.initials + '</span>' +
        Fmt.escapeHTML(m.name) + ' <span class="text-muted-mw" style="font-size:12px;">(' + m.role + ')</span>' +
        (m.id === activeId ? ' <span class="type-badge income" style="margin-left:6px;">Active</span>' : '') + '</span>' +
        '<span>' +
        '<button class="btn btn-sm" data-edit-id="' + m.id + '" style="border:none;color:var(--text-muted);"><i class="bi bi-pencil"></i></button>' +
        '<button class="btn btn-sm" data-id="' + m.id + '" style="border:none;color:var(--text-muted);"><i class="bi bi-trash3"></i></button>' +
        '</span></li>';
    }).join('');
    host.querySelectorAll('button[data-edit-id]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var m = members.find(function (x) { return x.id === btn.getAttribute('data-edit-id'); });
        if (!m) return;
        var newName = prompt('Member name:', m.name);
        if (newName === null) return;
        newName = newName.trim();
        if (!newName) return;
        var newRole = prompt('Role (e.g. Husband/Wife/Child):', m.role);
        if (newRole === null) return;
        newRole = newRole.trim() || m.role;
        try {
          await Store.updateMember(m.id, { name: newName, role: newRole });
        } catch (err) {
          alert('Failed to update member: ' + (err.message || err));
        }
      });
    });
    host.querySelectorAll('button[data-id]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!confirm('Delete this member?')) return;
        var res = await Store.deleteMember(btn.getAttribute('data-id'));
        if (!res.ok) {
          if (res.reason === 'self') alert('You cannot delete your own account while signed in.');
          else if (res.reason === 'linked') alert('This member still has active login access. Delete their user via Supabase Authentication first before deleting this member record here.');
          else alert('Failed to delete member.');
        }
      });
    });
  }

  function renderAll() {
    renderCategoryList('expense', 'expenseCatList');
    renderCategoryList('income', 'incomeCatList');
    renderMembers();
  }

  function updateEditPinHint() {
    var hasPin = !!Store.getSettings().editPin;
    document.getElementById('editPinHint').textContent = hasPin
      ? 'A PIN is set. Enter it as Current PIN above to change or remove it.'
      : 'No PIN set yet. Enter a New PIN below to require it for editing/deleting entries in Asset > Update History.';
  }

  function populateMonthStartDayOptions() {
    var html = '';
    for (var d = 1; d <= 28; d++) html += '<option value="' + d + '">' + d + '</option>';
    document.getElementById('monthStartDayInput').innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var ready = await Store.init();
    if (!ready) return;
    window.MW.Layout.init('pengaturan', false);
    populateIconSelects();
    renderAll();

    document.getElementById('familyNameInput').value = Store.getSettings().familyName;
    document.getElementById('darkModeSwitch').checked = document.documentElement.getAttribute('data-theme') === 'dark';
    updateEditPinHint();

    populateMonthStartDayOptions();
    document.getElementById('monthStartDayInput').value = Store.getSettings().monthStartDay;
    document.getElementById('weekStartDayInput').value = Store.getSettings().weekStartDay;

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
      await Store.updateSettings({ familyName: this.value.trim() || 'Family' });
    });

    document.getElementById('editPinForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var form = this;
      var currentPin = document.getElementById('currentPinInput').value;
      var newPin = document.getElementById('newPinInput').value;
      var confirmPin = document.getElementById('confirmPinInput').value;
      var existingPin = Store.getSettings().editPin;

      if (existingPin && currentPin !== existingPin) {
        alert('Current PIN is incorrect.');
        return;
      }
      if (newPin !== confirmPin) {
        alert('New PIN and confirmation do not match.');
        return;
      }
      try {
        await Store.setEditPin(newPin);
        form.reset();
        updateEditPinHint();
        alert(newPin.trim() ? 'Edit PIN saved.' : 'Edit PIN disabled.');
      } catch (err) {
        alert('Failed to save Edit PIN: ' + (err.message || err));
      }
    });

    document.getElementById('darkModeSwitch').addEventListener('change', function () {
      var theme = this.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('mw_theme', theme);
      window.dispatchEvent(new CustomEvent('mw:theme-changed', { detail: { theme: theme } }));
      var icon = document.getElementById('themeIcon');
      if (icon) icon.className = 'bi ' + (theme === 'dark' ? 'bi-sun' : 'bi-moon-stars');
    });

    document.getElementById('periodSettingsForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var monthStartDay = document.getElementById('monthStartDayInput').value;
      var weekStartDay = document.getElementById('weekStartDayInput').value;
      try {
        await Store.setPeriodSettings(monthStartDay, weekStartDay);
        alert('Period settings saved.');
      } catch (err) {
        alert('Failed to save period settings: ' + (err.message || err));
      }
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
