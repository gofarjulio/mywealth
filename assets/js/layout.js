/* Shared chrome: sidebar, topnav, quick-add transaction modal. Injected into every page. */
(function (global) {
  'use strict';

  var NAV_ITEMS = [
    { key: 'dashboard', href: 'index.html', icon: 'bi-speedometer2', label: 'Dashboard' },
    { key: 'transaksi', href: 'transaksi.html', icon: 'bi-arrow-left-right', label: 'Transactions' },
    { key: 'akun', href: 'akun.html', icon: 'bi-wallet2', label: 'Accounts' },
    { key: 'statistik', href: 'statistik.html', icon: 'bi-bar-chart-line', label: 'Statistics' },
    { key: 'asset', href: 'asset.html', icon: 'bi-piggy-bank', label: 'Asset' },
    { key: 'pengaturan', href: 'pengaturan.html', icon: 'bi-gear', label: 'Settings' }
  ];

  var PAGE_TITLES = {
    dashboard: 'Dashboard',
    transaksi: 'Transactions',
    akun: 'Accounts & Assets',
    statistik: 'Statistics & Analytics',
    asset: 'Asset',
    pengaturan: 'Settings'
  };

  function navHTML(active) {
    return '<ul class="sidebar-nav">' + NAV_ITEMS.map(function (item) {
      return '<li><a class="nav-link' + (item.key === active ? ' active' : '') + '" href="' + item.href + '" data-label="' + item.label + '">' +
        '<i class="bi ' + item.icon + '"></i><span class="nav-label">' + item.label + '</span></a></li>';
    }).join('') + '</ul>';
  }

  function brandHTML(collapsible) {
    return '<div class="sidebar-brand" id="sidebarBrand">' +
      '<img class="brand-mark" src="assets/icons/icon-192.png" alt="MyWealth">' +
      '<div class="brand-text-wrap"><div class="brand-text">MyWealth</div><div class="brand-sub">Family Finance Portal</div></div>' +
      (collapsible ? '<button type="button" class="sidebar-toggle" id="sidebarToggleBtn" title="Close sidebar" aria-label="Close sidebar"><i class="bi bi-chevron-left"></i></button>' : '') +
      '</div>';
  }

  function isSidebarCollapsed() { return localStorage.getItem('mw_sidebar') === 'collapsed'; }

  function wireSidebarCollapse(sidebarEl) {
    var toggleBtn = sidebarEl.querySelector('#sidebarToggleBtn');
    var brand = sidebarEl.querySelector('#sidebarBrand');
    function collapse() { sidebarEl.classList.add('collapsed'); localStorage.setItem('mw_sidebar', 'collapsed'); }
    function expand() { sidebarEl.classList.remove('collapsed'); localStorage.setItem('mw_sidebar', ''); }
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        collapse();
      });
    }
    if (brand) {
      brand.addEventListener('click', function () {
        if (sidebarEl.classList.contains('collapsed')) expand();
      });
    }
  }

  function renderSidebar(active) {
    var desktop = document.getElementById('sidebarDesktop');
    if (desktop) {
      desktop.innerHTML = brandHTML(true) + '<div class="nav-section-label">Main Menu</div>' + navHTML(active);
      desktop.classList.toggle('collapsed', isSidebarCollapsed());
      wireSidebarCollapse(desktop);
    }
    var offcanvasBody = document.getElementById('offcanvasSidebarBody');
    if (offcanvasBody) offcanvasBody.innerHTML = navHTML(active);
  }

  function periodOptions() {
    return [
      { key: 'this-week', label: 'This Week' },
      { key: 'this-month', label: 'This Month' },
      { key: 'last-month', label: 'Last Month' },
      { key: 'this-year', label: 'This Year' },
      { key: 'all', label: 'All Time' }
    ];
  }

  function getStoredPeriodKey() {
    return localStorage.getItem('mw_period') || 'this-month';
  }

  function setPeriod(key) {
    localStorage.setItem('mw_period', key);
    var range = global.MW.Store.periodRange(key);
    global.dispatchEvent(new CustomEvent('mw:period-changed', { detail: { key: key, range: range } }));
    var label = document.getElementById('periodLabel');
    if (label) label.textContent = range.label;
  }

  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mw_theme', theme);
    var icon = document.getElementById('themeIcon');
    if (icon) icon.className = 'bi ' + (theme === 'dark' ? 'bi-sun' : 'bi-moon-stars');
    global.dispatchEvent(new CustomEvent('mw:theme-changed', { detail: { theme: theme } }));
  }

  function renderTopnav(page, showPeriod) {
    var host = document.getElementById('topnav');
    if (!host) return;
    var settings = global.MW.Store.getSettings();
    var active = { initials: (settings.activeMemberName || '?').trim().slice(0, 2).toUpperCase(), name: settings.activeMemberName || 'Member' };

    var periodBlock = '';
    if (showPeriod) {
      var opts = periodOptions();
      var currentKey = getStoredPeriodKey();
      var current = opts.find(function (o) { return o.key === currentKey; }) || opts[1];
      periodBlock = '' +
        '<div class="dropdown">' +
        '<button class="btn btn-sm d-flex align-items-center gap-2" style="border:1px solid var(--border);background:var(--surface-2);color:var(--text-primary);border-radius:10px;" type="button" data-bs-toggle="dropdown">' +
        '<i class="bi bi-calendar3"></i><span id="periodLabel">' + current.label + '</span></button>' +
        '<ul class="dropdown-menu dropdown-menu-end">' +
        opts.map(function (o) { return '<li><a class="dropdown-item period-opt" href="#" data-key="' + o.key + '">' + o.label + '</a></li>'; }).join('') +
        '</ul></div>';
    }

    host.innerHTML = '' +
      '<button class="btn-icon d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasSidebar" aria-label="Menu">' +
      '<i class="bi bi-list"></i></button>' +
      '<h1 class="page-title d-none d-sm-block">' + (PAGE_TITLES[page] || '') + '</h1>' +
      '<div class="spacer"></div>' +
      periodBlock +
      '<button class="btn-icon" id="themeToggleBtn" type="button" aria-label="Toggle theme"><i class="bi bi-moon-stars" id="themeIcon"></i></button>' +
      '<button class="btn btn-primary d-flex align-items-center gap-2" id="quickAddBtn" style="border-radius:10px;">' +
      '<i class="bi bi-plus-lg"></i><span class="d-none d-sm-inline">Add Transaction</span></button>' +
      '<div class="dropdown">' +
      '<button class="family-chip" type="button" data-bs-toggle="dropdown">' +
      '<span class="avatar-circle">' + active.initials + '</span>' +
      '<span class="d-none d-md-flex flex-column text-start" style="line-height:1.1;">' +
      '<span style="font-size:13px;font-weight:600;">' + active.name + '</span>' +
      '<span style="font-size:11px;color:var(--text-muted);">' + settings.familyName + '</span></span>' +
      '<i class="bi bi-chevron-down" style="font-size:11px;color:var(--text-muted);"></i>' +
      '</button>' +
      '<ul class="dropdown-menu dropdown-menu-end">' +
      '<li><h6 class="dropdown-header">Signed in as ' + active.name + '</h6></li>' +
      '<li><a class="dropdown-item" href="pengaturan.html"><i class="bi bi-people me-2"></i>Manage Members</a></li>' +
      '<li><hr class="dropdown-divider"></li>' +
      '<li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Log Out</a></li>' +
      '</ul></div>';

    if (showPeriod) {
      host.querySelectorAll('.period-opt').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          setPeriod(el.getAttribute('data-key'));
          var label = host.querySelector('#periodLabel');
          if (label) label.textContent = el.textContent;
        });
      });
    }
    host.querySelector('#themeToggleBtn').addEventListener('click', function () {
      setTheme(isDark() ? 'light' : 'dark');
    });
    host.querySelector('#quickAddBtn').addEventListener('click', function () {
      global.MW.TransactionForm.open();
    });
    host.querySelector('#logoutBtn').addEventListener('click', function (e) {
      e.preventDefault();
      if (confirm('Log out of MyWealth?')) global.MW.Store.logout();
    });

    var icon = document.getElementById('themeIcon');
    if (icon) icon.className = 'bi ' + (isDark() ? 'bi-sun' : 'bi-moon-stars');
  }

  function renderOffcanvasShell() {
    var host = document.getElementById('offcanvasHost');
    if (!host) return;
    host.innerHTML = '' +
      '<div class="offcanvas offcanvas-start sidebar-offcanvas" tabindex="-1" id="offcanvasSidebar">' +
      '<div class="offcanvas-header">' + brandHTML() +
      '<button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>' +
      '</div>' +
      '<div class="offcanvas-body" id="offcanvasSidebarBody"></div>' +
      '</div>';
  }

  // -------------------- Quick add / edit transaction modal --------------------
  function accountOptionsHTML(selectedId) {
    var groups = {};
    global.MW.Store.getAccounts().forEach(function (a) {
      groups[a.group] = groups[a.group] || [];
      groups[a.group].push(a);
    });
    return Object.keys(groups).map(function (g) {
      return '<optgroup label="' + g + '">' + groups[g].map(function (a) {
        return '<option value="' + a.id + '"' + (a.id === selectedId ? ' selected' : '') + '>' + a.name + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
  }

  function categoryOptionsHTML(type, selectedId) {
    var cats = global.MW.Store.getCategories(type === 'income' ? 'income' : 'expense');
    return cats.map(function (c) {
      return '<option value="' + c.id + '"' + (c.id === selectedId ? ' selected' : '') + '>' + c.name + '</option>';
    }).join('');
  }

  function modalHTML() {
    return '' +
      '<div class="modal fade" id="txModal" tabindex="-1" aria-hidden="true">' +
      '<div class="modal-dialog modal-dialog-centered">' +
      '<div class="modal-content">' +
      '<div class="modal-header">' +
      '<h5 class="modal-title" id="txModalTitle">Add Transaction</h5>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal"></button>' +
      '</div>' +
      '<form id="txForm">' +
      '<div class="modal-body d-flex flex-column gap-3">' +
      '<input type="hidden" id="txId">' +
      '<div class="type-toggle">' +
      '<input type="radio" name="txType" id="typeExpense" value="expense" checked><label class="for-expense" for="typeExpense"><i class="bi bi-arrow-down-circle me-1"></i>Expense</label>' +
      '<input type="radio" name="txType" id="typeIncome" value="income"><label class="for-income" for="typeIncome"><i class="bi bi-arrow-up-circle me-1"></i>Income</label>' +
      '<input type="radio" name="txType" id="typeTransfer" value="transfer"><label class="for-transfer" for="typeTransfer"><i class="bi bi-arrow-left-right me-1"></i>Transfer</label>' +
      '</div>' +
      '<div class="row g-2">' +
      '<div class="col-7"><label class="form-label">Date</label><input type="date" class="form-control" id="txDate" required></div>' +
      '<div class="col-5"><label class="form-label">Time</label><input type="time" class="form-control" id="txTime"></div>' +
      '</div>' +
      '<div><label class="form-label">Amount</label>' +
      '<div class="rp-input-group"><span class="rp-prefix">Rp</span><input type="text" inputmode="numeric" class="form-control" id="txAmount" placeholder="0" required></div>' +
      '</div>' +
      '<div id="accountFieldWrap"><label class="form-label" id="accountLabel">Account</label><select class="form-select" id="txAccount"></select></div>' +
      '<div id="toAccountFieldWrap" class="d-none"><label class="form-label">To Account</label><select class="form-select" id="txToAccount"></select></div>' +
      '<div id="categoryFieldWrap"><label class="form-label">Category</label><select class="form-select" id="txCategory"></select></div>' +
      '<div><label class="form-label">Note (optional)</label><textarea class="form-control" id="txNote" rows="2" placeholder="Short description..."></textarea></div>' +
      '</div>' +
      '<div class="modal-footer">' +
      '<button type="button" class="btn btn-outline-danger me-auto d-none" id="txDeleteBtn"><i class="bi bi-trash3 me-1"></i>Delete</button>' +
      '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>' +
      '<button type="submit" class="btn btn-primary">Save</button>' +
      '</div>' +
      '</form></div></div></div>';
  }

  var txModalEl, txModalInstance;

  function updateFieldsForType(type, keepValues) {
    var accountLabel = document.getElementById('accountLabel');
    var toWrap = document.getElementById('toAccountFieldWrap');
    var catWrap = document.getElementById('categoryFieldWrap');
    var catSelect = document.getElementById('txCategory');
    if (type === 'transfer') {
      accountLabel.textContent = 'From Account';
      toWrap.classList.remove('d-none');
      catWrap.classList.add('d-none');
    } else {
      accountLabel.textContent = 'Account';
      toWrap.classList.add('d-none');
      catWrap.classList.remove('d-none');
      var prev = keepValues ? catSelect.value : null;
      catSelect.innerHTML = categoryOptionsHTML(type, prev);
    }
  }

  function formatAmountInput(el) {
    el.addEventListener('input', function () {
      var digits = el.value.replace(/\D/g, '');
      el.value = digits ? Number(digits).toLocaleString('id-ID') : '';
    });
  }

  function initTransactionForm() {
    var host = document.getElementById('quickAddModalHost');
    if (!host) return;
    host.innerHTML = modalHTML();
    txModalEl = document.getElementById('txModal');
    txModalInstance = new bootstrap.Modal(txModalEl);

    document.getElementById('txAccount').innerHTML = accountOptionsHTML();
    document.getElementById('txToAccount').innerHTML = accountOptionsHTML();
    updateFieldsForType('expense');
    formatAmountInput(document.getElementById('txAmount'));

    txModalEl.querySelectorAll('input[name="txType"]').forEach(function (r) {
      r.addEventListener('change', function () { updateFieldsForType(r.value, true); });
    });

    document.getElementById('txForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var type = txModalEl.querySelector('input[name="txType"]:checked').value;
      var amountRaw = document.getElementById('txAmount').value.replace(/\D/g, '');
      var payload = {
        type: type,
        date: document.getElementById('txDate').value,
        time: document.getElementById('txTime').value || '00:00',
        account_id: document.getElementById('txAccount').value,
        amount: Number(amountRaw) || 0,
        note: document.getElementById('txNote').value.trim()
      };
      if (type === 'transfer') {
        payload.to_account_id = document.getElementById('txToAccount').value;
        if (payload.to_account_id === payload.account_id) {
          alert('Source and destination accounts cannot be the same.');
          return;
        }
      } else {
        payload.category = document.getElementById('txCategory').value;
      }
      var id = document.getElementById('txId').value;
      var submitBtn = txModalEl.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
      try {
        if (id) await global.MW.Store.updateTransaction(id, payload);
        else await global.MW.Store.addTransaction(payload);
        txModalInstance.hide();
      } catch (err) {
        alert('Failed to save transaction: ' + (err.message || err));
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save';
      }
    });

    document.getElementById('txDeleteBtn').addEventListener('click', async function () {
      var id = document.getElementById('txId').value;
      if (!id || !confirm('Delete this transaction?')) return;
      try {
        await global.MW.Store.deleteTransaction(id);
        txModalInstance.hide();
      } catch (err) {
        alert('Failed to delete transaction: ' + (err.message || err));
      }
    });
  }

  function openTransactionForm(txId) {
    var title = document.getElementById('txModalTitle');
    var deleteBtn = document.getElementById('txDeleteBtn');
    document.getElementById('txAccount').innerHTML = accountOptionsHTML();
    document.getElementById('txToAccount').innerHTML = accountOptionsHTML();

    if (txId) {
      var t = global.MW.Store.getTransaction(txId);
      if (!t) return;
      title.textContent = 'Edit Transaction';
      deleteBtn.classList.remove('d-none');
      var formType = (t.type === 'income' || t.type === 'expense' || t.type === 'transfer') ? t.type : 'expense';
      document.getElementById('txId').value = t.id;
      txModalEl.querySelector('#type' + formType.charAt(0).toUpperCase() + formType.slice(1)).checked = true;
      updateFieldsForType(formType);
      document.getElementById('txDate').value = t.date;
      document.getElementById('txTime').value = t.time || '00:00';
      document.getElementById('txAccount').value = t.account_id;
      if (formType === 'transfer') document.getElementById('txToAccount').value = t.to_account_id;
      else if (t.category) document.getElementById('txCategory').value = t.category;
      document.getElementById('txAmount').value = Math.abs(t.amount).toLocaleString('id-ID');
      document.getElementById('txNote').value = t.note || '';
    } else {
      title.textContent = 'Add Transaction';
      deleteBtn.classList.add('d-none');
      document.getElementById('txId').value = '';
      document.getElementById('txForm').reset();
      document.getElementById('typeExpense').checked = true;
      updateFieldsForType('expense');
      document.getElementById('txDate').value = global.MW.Store.todayISO();
      document.getElementById('txTime').value = new Date().toTimeString().slice(0, 5);
    }
    txModalInstance.show();
  }

  // -------------------- Auto-logout on inactivity --------------------
  var IDLE_TIMEOUT_MS = 5 * 60 * 1000;
  var IDLE_WARNING_MS = 30 * 1000;
  var idleTimer = null;
  var countdownInterval = null;
  var warningModalInstance = null;

  function ensureIdleWarningModal() {
    if (warningModalInstance) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = '' +
      '<div class="modal fade" id="idleWarningModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">' +
      '<div class="modal-dialog modal-dialog-centered">' +
      '<div class="modal-content">' +
      '<div class="modal-body text-center py-4">' +
      '<i class="bi bi-hourglass-split" style="font-size:28px;color:var(--status-warning);"></i>' +
      '<h5 class="mt-3 mb-2">Session about to expire</h5>' +
      '<p class="text-muted-mw mb-3">No activity detected. You will be signed out automatically in <strong id="idleCountdown">30</strong> seconds.</p>' +
      '<button type="button" class="btn btn-primary" id="idleStayBtn">Stay Signed In</button>' +
      '</div></div></div></div>';
    document.body.appendChild(wrap.firstElementChild);
    warningModalInstance = new bootstrap.Modal(document.getElementById('idleWarningModal'));
    document.getElementById('idleStayBtn').addEventListener('click', function () { resetIdleTimer(); });
  }

  function hideIdleWarning() {
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    if (warningModalInstance) warningModalInstance.hide();
  }

  function showIdleWarning() {
    ensureIdleWarningModal();
    var remaining = Math.round(IDLE_WARNING_MS / 1000);
    var el = document.getElementById('idleCountdown');
    if (el) el.textContent = remaining;
    warningModalInstance.show();
    countdownInterval = setInterval(function () {
      remaining -= 1;
      var countEl = document.getElementById('idleCountdown');
      if (countEl) countEl.textContent = Math.max(remaining, 0);
      if (remaining <= 0 && countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    }, 1000);
  }

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    hideIdleWarning();
    idleTimer = setTimeout(function () {
      showIdleWarning();
      idleTimer = setTimeout(function () {
        global.MW.Store.logout();
      }, IDLE_WARNING_MS);
    }, IDLE_TIMEOUT_MS - IDLE_WARNING_MS);
  }

  function initIdleLogout() {
    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(function (evt) {
      document.addEventListener(evt, resetIdleTimer, { passive: true });
    });
    resetIdleTimer();
  }

  global.MW = global.MW || {};
  global.MW.Layout = {
    init: function (page, showPeriod) {
      renderOffcanvasShell();
      renderSidebar(page);
      renderTopnav(page, !!showPeriod);
      initTransactionForm();
      initIdleLogout();
    },
    accountOptionsHTML: accountOptionsHTML,
    categoryOptionsHTML: categoryOptionsHTML,
    getStoredPeriodKey: getStoredPeriodKey
  };
  global.MW.TransactionForm = {
    open: openTransactionForm
  };

  (function bootTheme() {
    var saved = localStorage.getItem('mw_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  })();
})(window);
