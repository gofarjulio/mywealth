(function () {
  'use strict';
  var Store = window.MW.Store;
  var Fmt = window.MW.Format;

  var activeTab = 'progress';
  var netWorthChart = null;
  var breakdownChart = null;
  var historyPeriodYear = new Date().getFullYear();
  var historyPeriodMonth = new Date().getMonth();

  var CATEGORY_LABELS = {
    cash: 'Cash & Equivalents',
    investment: 'Investments',
    fixed: 'Fixed Assets',
    debt_short: 'Short-term Debt',
    debt_long: 'Long-term Debt'
  };
  var CATEGORY_ORDER = ['cash', 'investment', 'fixed', 'debt_short', 'debt_long'];
  var CATEGORY_SLOT = { cash: 1, investment: 3, fixed: 4, debt_short: 8, debt_long: 5 };

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function toISO(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

  function formatAmountInput(el) {
    el.addEventListener('input', function () {
      var digits = el.value.replace(/\D/g, '');
      el.value = digits ? Number(digits).toLocaleString('id-ID') : '';
    });
  }

  function valueAsOf(accountId, cutoffISO) {
    var snaps = Store.getAssetSnapshots().filter(function (s) {
      return s.accountId === accountId && s.createdAt.slice(0, 10) <= cutoffISO;
    });
    if (!snaps.length) return null;
    return snaps[snaps.length - 1].amount;
  }

  function monthEndISO(year, month) { return toISO(new Date(year, month + 1, 0)); }

  function getMonthRange() {
    var snaps = Store.getAssetSnapshots();
    if (!snaps.length) return [];
    var earliest = new Date(snaps[0].createdAt.slice(0, 10));
    var start = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    var now = new Date();
    var end = new Date(now.getFullYear(), now.getMonth(), 1);
    var months = [];
    var cur = new Date(start);
    while (cur <= end) {
      months.push({ year: cur.getFullYear(), month: cur.getMonth() });
      cur.setMonth(cur.getMonth() + 1);
    }
    return months;
  }

  function computeMonthlyData() {
    var months = getMonthRange();
    var accounts = Store.getAssetAccounts();
    return months.map(function (m) {
      var cutoff = monthEndISO(m.year, m.month);
      var byCategory = { cash: 0, investment: 0, fixed: 0, debt_short: 0, debt_long: 0 };
      accounts.forEach(function (a) {
        var v = valueAsOf(a.id, cutoff);
        if (v != null) byCategory[a.category] += v;
      });
      var totalAssets = byCategory.cash + byCategory.investment + byCategory.fixed;
      var totalDebt = byCategory.debt_short + byCategory.debt_long;
      return {
        label: Fmt.formatMonthAbbr(cutoff) + ' ' + m.year,
        byCategory: byCategory,
        totalAssets: totalAssets,
        totalDebt: totalDebt,
        netWorth: totalAssets - totalDebt
      };
    });
  }

  // ---------------- Progress tab ----------------
  function renderProgress() {
    var data = computeMonthlyData();
    var target = Store.getSettings().netWorthTarget || 0;
    var latest = data.length ? data[data.length - 1] : null;
    var netWorthNow = latest ? latest.netWorth : 0;
    var pct = target > 0 ? Math.round(netWorthNow / target * 100) : 0;

    document.getElementById('pgNetWorthVal').textContent = Fmt.formatRupiah(netWorthNow);
    document.getElementById('pgTargetVal').textContent = Fmt.formatRupiah(target);
    document.getElementById('pgPctVal').textContent = pct + '%';

    var netWorthEmpty = document.getElementById('netWorthEmpty');
    if (!data.length) {
      netWorthEmpty.classList.remove('d-none');
      document.getElementById('netWorthChart').classList.add('d-none');
      if (netWorthChart) { netWorthChart.destroy(); netWorthChart = null; }
      if (breakdownChart) { breakdownChart.destroy(); breakdownChart = null; }
      document.getElementById('assetSummaryHead').innerHTML = '';
      document.getElementById('assetSummaryBody').innerHTML = '';
      return;
    }
    netWorthEmpty.classList.add('d-none');
    document.getElementById('netWorthChart').classList.remove('d-none');

    var labels = data.map(function (d) { return d.label; });

    if (netWorthChart) netWorthChart.destroy();
    netWorthChart = new Chart(document.getElementById('netWorthChart'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ data: data.map(function (d) { return d.netWorth; }), backgroundColor: Fmt.seriesColor(1), borderRadius: 4, maxBarThickness: 28 }]
      },
      options: {
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (ctx) { return ' ' + Fmt.formatRupiah(ctx.parsed.y); } } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: Fmt.cssVar('--text-muted') } },
          y: { grid: { color: Fmt.cssVar('--gridline') }, ticks: { color: Fmt.cssVar('--text-muted'), callback: function (v) { return Fmt.formatCompact(v); } } }
        }
      }
    });

    if (breakdownChart) breakdownChart.destroy();
    breakdownChart = new Chart(document.getElementById('breakdownChart'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: CATEGORY_ORDER.map(function (cat) {
          return {
            label: CATEGORY_LABELS[cat],
            data: data.map(function (d) { return d.byCategory[cat]; }),
            backgroundColor: Fmt.seriesColor(CATEGORY_SLOT[cat]),
            stack: 'total',
            maxBarThickness: 28
          };
        })
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (ctx) { return ' ' + ctx.dataset.label + ': ' + Fmt.formatRupiah(ctx.parsed.y); } } }
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: Fmt.cssVar('--text-muted') } },
          y: { stacked: true, grid: { color: Fmt.cssVar('--gridline') }, ticks: { color: Fmt.cssVar('--text-muted'), callback: function (v) { return Fmt.formatCompact(v); } } }
        }
      }
    });

    renderSummaryTable(data);
  }

  function summaryRow(label, values, opts) {
    opts = opts || {};
    var cls = opts.bold ? ' style="font-weight:700;"' : '';
    return '<tr' + cls + '><td class="text-secondary-mw">' + label + '</td>' +
      values.map(function (v) { return '<td class="text-end">' + Fmt.formatRupiah(v) + '</td>'; }).join('') + '</tr>';
  }

  function renderSummaryTable(data) {
    var head = '<th>Category</th>' + data.map(function (d) { return '<th class="text-end">' + d.label + '</th>'; }).join('');
    document.getElementById('assetSummaryHead').innerHTML = head;

    var rows = '';
    CATEGORY_ORDER.forEach(function (cat) {
      rows += summaryRow(CATEGORY_LABELS[cat], data.map(function (d) { return d.byCategory[cat]; }));
    });
    rows += summaryRow('NET WORTH', data.map(function (d) { return d.netWorth; }), { bold: true });

    var growthCells = data.map(function (d, i) {
      if (i === 0) return '<td class="text-end text-muted-mw">-</td>';
      var prev = data[i - 1].netWorth;
      var growth = prev !== 0 ? ((d.netWorth - prev) / Math.abs(prev) * 100) : (d.netWorth === 0 ? 0 : 100);
      var cls = growth >= 0 ? 'up' : 'down';
      return '<td class="text-end amount-text ' + cls + '">' + growth.toFixed(1) + '%</td>';
    }).join('');
    rows += '<tr><td class="text-secondary-mw" style="font-weight:700;">GROWTH</td>' + growthCells + '</tr>';

    document.getElementById('assetSummaryBody').innerHTML = rows;
  }

  // ---------------- Update tab ----------------
  function renderUpdateTab() {
    var target = Store.getSettings().netWorthTarget || 0;
    document.getElementById('targetInput').value = target ? Number(target).toLocaleString('id-ID') : '';
    var dateInput = document.getElementById('updateDateInput');
    if (!dateInput.value) dateInput.value = Store.todayISO();

    var accounts = Store.getAssetAccounts();
    var today = Store.todayISO();
    var host = document.getElementById('assetUpdateList');
    if (!accounts.length) {
      host.innerHTML = '<div class="empty-state"><i class="bi bi-piggy-bank"></i>No accounts yet. Add one below.</div>';
      return;
    }

    var byCat = {};
    accounts.forEach(function (a) { (byCat[a.category] = byCat[a.category] || []).push(a); });

    var html = '';
    CATEGORY_ORDER.forEach(function (cat) {
      if (!byCat[cat]) return;
      html += '<div class="asset-cat-label">' + CATEGORY_LABELS[cat] + '</div>';
      byCat[cat].forEach(function (a) {
        var last = valueAsOf(a.id, today);
        html += '<div class="asset-update-row" data-id="' + a.id + '">' +
          '<div class="asset-update-name">' + Fmt.escapeHTML(a.name) +
          '<span class="asset-update-last">Last: ' + (last == null ? '-' : Fmt.formatRupiah(last)) + '</span></div>' +
          '<div class="rp-input-group asset-update-input-wrap"><span class="rp-prefix">Rp</span>' +
          '<input type="text" inputmode="numeric" class="form-control form-control-sm asset-update-input" placeholder="' + (last == null ? '0' : Number(last).toLocaleString('id-ID')) + '"></div>' +
          '<button class="btn btn-sm asset-edit-btn" data-edit-id="' + a.id + '" title="Edit"><i class="bi bi-pencil"></i></button>' +
          '<button class="btn btn-sm asset-del-btn" data-del-id="' + a.id + '" title="Remove"><i class="bi bi-trash3"></i></button>' +
          '</div>';
      });
    });
    host.innerHTML = html;

    host.querySelectorAll('.asset-update-input').forEach(function (el) { formatAmountInput(el); });
    host.querySelectorAll('.asset-edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-edit-id');
        var account = Store.getAssetAccounts().find(function (a) { return a.id === id; });
        if (!account) return;
        document.getElementById('editAssetId').value = account.id;
        document.getElementById('editAssetName').value = account.name;
        document.getElementById('editAssetCategory').value = account.category;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('editAssetAccountModal')).show();
      });
    });
    host.querySelectorAll('.asset-del-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!confirm('Remove this account? Its update history will be deleted too.')) return;
        try {
          await Store.deleteAssetAccount(btn.getAttribute('data-del-id'));
        } catch (err) {
          alert('Failed to remove account: ' + (err.message || err));
        }
      });
    });
  }

  // ---------------- History tab ----------------
  function renderHistoryPeriodNav() {
    document.getElementById('historyPeriodLabel').textContent =
      Fmt.formatMonthYear(toISO(new Date(historyPeriodYear, historyPeriodMonth, 1)));
  }

  function renderHistory() {
    var start = historyPeriodYear + '-' + pad2(historyPeriodMonth + 1) + '-01';
    var end = toISO(new Date(historyPeriodYear, historyPeriodMonth + 1, 0));
    var snaps = Store.getAssetSnapshots().filter(function (s) {
      var d = s.createdAt.slice(0, 10);
      return d >= start && d <= end;
    });

    var headHost = document.getElementById('historyTableHead');
    var bodyHost = document.getElementById('historyTableBody');
    var empty = document.getElementById('assetHistoryEmpty');
    var table = document.getElementById('historyTable');

    if (!snaps.length) {
      headHost.innerHTML = '';
      bodyHost.innerHTML = '';
      table.classList.add('d-none');
      empty.classList.remove('d-none');
      return;
    }
    empty.classList.add('d-none');
    table.classList.remove('d-none');

    var dateSet = {};
    snaps.forEach(function (s) { dateSet[s.createdAt.slice(0, 10)] = true; });
    var dates = Object.keys(dateSet).sort();

    var byAccountDate = {};
    snaps.forEach(function (s) {
      var d = s.createdAt.slice(0, 10);
      byAccountDate[s.accountId] = byAccountDate[s.accountId] || {};
      var existing = byAccountDate[s.accountId][d];
      if (!existing || s.createdAt > existing.createdAt) byAccountDate[s.accountId][d] = s;
    });

    var rowsAccounts = Store.getAssetAccounts().filter(function (a) { return !!byAccountDate[a.id]; });

    headHost.innerHTML = '<th>Account</th>' + dates.map(function (d) {
      return '<th class="text-end">' + Fmt.dayOfMonth(d) + ' ' + Fmt.formatMonthAbbr(d) + '</th>';
    }).join('');

    bodyHost.innerHTML = rowsAccounts.map(function (a) {
      var cells = dates.map(function (d) {
        var snap = byAccountDate[a.id][d];
        if (!snap) return '<td class="text-end text-muted-mw">-</td>';
        return '<td class="text-end asset-history-cell" data-snap-id="' + snap.id + '" title="Click to delete">' + Fmt.formatRupiah(snap.amount) + '</td>';
      }).join('');
      return '<tr><td class="text-secondary-mw">' + Fmt.escapeHTML(a.name) + '</td>' + cells + '</tr>';
    }).join('');

    bodyHost.querySelectorAll('.asset-history-cell').forEach(function (td) {
      td.addEventListener('click', async function () {
        if (!confirm('Delete this entry?')) return;
        try {
          await Store.deleteAssetSnapshot(td.getAttribute('data-snap-id'));
        } catch (err) {
          alert('Failed to delete: ' + (err.message || err));
        }
      });
    });
  }

  // ---------------- Tab switching ----------------
  function renderActiveTab() {
    if (activeTab === 'progress') renderProgress();
    else if (activeTab === 'update') renderUpdateTab();
    else if (activeTab === 'history') renderHistory();
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tx-tab').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
    document.getElementById('tabProgress').classList.toggle('d-none', tab !== 'progress');
    document.getElementById('tabUpdate').classList.toggle('d-none', tab !== 'update');
    document.getElementById('tabHistory').classList.toggle('d-none', tab !== 'history');
    renderActiveTab();
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var ready = await Store.init();
    if (!ready) return;
    window.MW.Layout.init('asset', false);
    await Store.fetchAssetData();
    formatAmountInput(document.getElementById('targetInput'));
    renderHistoryPeriodNav();
    switchTab('progress');

    document.querySelectorAll('.tx-tab').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.getAttribute('data-tab')); });
    });

    document.getElementById('historyPrevBtn').addEventListener('click', function () {
      historyPeriodMonth -= 1;
      if (historyPeriodMonth < 0) { historyPeriodMonth = 11; historyPeriodYear -= 1; }
      renderHistoryPeriodNav();
      if (activeTab === 'history') renderHistory();
    });
    document.getElementById('historyNextBtn').addEventListener('click', function () {
      historyPeriodMonth += 1;
      if (historyPeriodMonth > 11) { historyPeriodMonth = 0; historyPeriodYear += 1; }
      renderHistoryPeriodNav();
      if (activeTab === 'history') renderHistory();
    });

    document.getElementById('saveTargetBtn').addEventListener('click', async function () {
      var raw = document.getElementById('targetInput').value.replace(/\D/g, '');
      try {
        await Store.setNetWorthTarget(Number(raw) || 0);
      } catch (err) {
        alert('Failed to save target: ' + (err.message || err));
      }
    });

    document.getElementById('saveUpdatesBtn').addEventListener('click', async function () {
      var rows = document.querySelectorAll('.asset-update-row');
      var dateVal = document.getElementById('updateDateInput').value || Store.todayISO();
      var now = new Date();
      var timeStr = pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds());
      var createdAt = dateVal + 'T' + timeStr;
      var entries = [];
      rows.forEach(function (row) {
        var input = row.querySelector('.asset-update-input');
        var raw = input.value.replace(/\D/g, '');
        if (raw === '') return;
        entries.push({ accountId: row.getAttribute('data-id'), amount: Number(raw), createdAt: createdAt });
      });
      if (!entries.length) { alert('No values entered.'); return; }
      var btn = this;
      btn.disabled = true;
      try {
        await Store.addAssetSnapshots(entries);
      } catch (err) {
        alert('Failed to save updates: ' + (err.message || err));
      } finally {
        btn.disabled = false;
      }
    });

    document.getElementById('addAssetAccountForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = document.getElementById('newAssetName').value.trim();
      var category = document.getElementById('newAssetCategory').value;
      if (!name) return;
      try {
        await Store.addAssetAccount(name, category);
        this.reset();
      } catch (err) {
        alert('Failed to add account: ' + (err.message || err));
      }
    });

    document.getElementById('saveEditAssetBtn').addEventListener('click', async function () {
      var id = document.getElementById('editAssetId').value;
      var name = document.getElementById('editAssetName').value.trim();
      var category = document.getElementById('editAssetCategory').value;
      if (!name) return;
      try {
        await Store.updateAssetAccount(id, { name: name, category: category });
        bootstrap.Modal.getInstance(document.getElementById('editAssetAccountModal')).hide();
      } catch (err) {
        alert('Failed to save changes: ' + (err.message || err));
      }
    });
  });

  window.addEventListener('mw:data-changed', renderActiveTab);
  window.addEventListener('mw:theme-changed', function () { if (activeTab === 'progress') renderProgress(); });
})();
