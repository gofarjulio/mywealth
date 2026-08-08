(function () {
  'use strict';
  var Store = window.MW.Store;
  var Fmt = window.MW.Format;
  var quickChart = null;

  function renderStatCard(valueId, deltaId, value, prevValue, goodWhenUp) {
    document.getElementById(valueId).textContent = Fmt.formatRupiah(value);
    var deltaEl = document.getElementById(deltaId);
    if (!deltaEl) return;
    if (prevValue == null) { deltaEl.innerHTML = ''; return; }
    var diff = value - prevValue;
    var pct = prevValue !== 0 ? (diff / Math.abs(prevValue) * 100) : (value === 0 ? 0 : 100);
    var isUp = diff > 0;
    var isFlat = diff === 0;
    var goodDirection = isFlat ? 'flat' : ((isUp === goodWhenUp) ? 'up' : 'down');
    var arrow = isFlat ? 'bi-dash' : (isUp ? 'bi-arrow-up-short' : 'bi-arrow-down-short');
    deltaEl.className = 'stat-delta ' + goodDirection;
    deltaEl.innerHTML = '<i class="bi ' + arrow + '"></i>' + Math.abs(pct).toFixed(1) + '% vs periode lalu';
  }

  function renderRecentTransactions() {
    var list = Store.recentTransactions(8);
    var body = document.getElementById('recentTxBody');
    var empty = document.getElementById('recentTxEmpty');
    if (!list.length) { body.innerHTML = ''; empty.classList.remove('d-none'); return; }
    empty.classList.add('d-none');
    body.innerHTML = list.map(function (t) {
      var cat = Store.findCategory(t.category);
      var acc = Store.getAccount(t.account_id);
      var label = cat ? cat.name : (t.type === 'transfer' ? 'Transfer' : 'Penyesuaian');
      var icon = cat ? cat.icon : (t.type === 'transfer' ? 'bi-arrow-left-right' : 'bi-sliders');
      var slot = cat ? cat.colorSlot : (t.type === 'transfer' ? 1 : 8);
      var sign = t.type === 'income' ? '+' : (t.type === 'expense' ? '-' : (t.amount < 0 ? '-' : '+'));
      var cls = t.type === 'income' ? 'up' : (t.type === 'expense' ? 'down' : 'neutral');
      return '<tr>' +
        '<td class="text-secondary-mw" style="white-space:nowrap;">' + Fmt.formatDateShort(t.date) + '</td>' +
        '<td><span class="cat-chip"><span class="cat-icon-circle" style="background:var(--series-' + slot + ')"><i class="bi ' + icon + '"></i></span>' + Fmt.escapeHTML(label) + '</span></td>' +
        '<td class="text-secondary-mw">' + (acc ? Fmt.escapeHTML(acc.name) : '-') + '</td>' +
        '<td class="text-end amount-text ' + cls + '">' + sign + Fmt.formatRupiah(Math.abs(t.amount)) + '</td>' +
        '</tr>';
    }).join('');
  }

  function renderQuickChart(range) {
    var rows = Store.categoryBreakdown(range.start, range.end, 'expense');
    var canvas = document.getElementById('quickChartCanvas');
    var legend = document.getElementById('quickChartLegend');
    var empty = document.getElementById('quickChartEmpty');

    if (!rows.length) {
      empty.classList.remove('d-none');
      legend.innerHTML = '';
      if (quickChart) { quickChart.destroy(); quickChart = null; }
      return;
    }
    empty.classList.add('d-none');

    var colors = rows.map(function (r) { return Fmt.seriesColor(r.colorSlot); });
    var data = {
      labels: rows.map(function (r) { return r.name; }),
      datasets: [{
        data: rows.map(function (r) { return r.total; }),
        backgroundColor: colors,
        borderColor: Fmt.cssVar('--surface-1'),
        borderWidth: 2,
        hoverOffset: 6
      }]
    };
    if (quickChart) quickChart.destroy();
    quickChart = new Chart(canvas, {
      type: 'doughnut',
      data: data,
      options: {
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ' ' + ctx.label + ': ' + Fmt.formatRupiah(ctx.parsed); }
            }
          }
        }
      }
    });

    legend.innerHTML = rows.slice(0, 6).map(function (r) {
      return '<li><span class="legend-left"><span class="cat-dot" style="background:var(--series-' + r.colorSlot + ')"></span>' + Fmt.escapeHTML(r.name) + '</span>' +
        '<span><span class="legend-value">' + Fmt.formatRupiah(r.total) + '</span><span class="legend-pct">' + r.pct.toFixed(0) + '%</span></span></li>';
    }).join('');
  }

  function renderAccountsStrip() {
    var accounts = Store.getAccounts();
    var host = document.getElementById('accountsStrip');
    host.innerHTML = accounts.map(function (a) {
      var cls = a.kind === 'liability' ? 'down' : 'neutral';
      return '<div class="account-mini">' +
        '<div class="d-flex align-items-center gap-2"><i class="bi ' + a.icon + '" style="color:var(--text-muted);"></i><span class="acc-name">' + Fmt.escapeHTML(a.name) + '</span></div>' +
        '<div class="acc-balance amount-text ' + cls + '">' + Fmt.formatRupiah(a.balance) + '</div>' +
        '<div class="text-muted-mw" style="font-size:11px;">' + a.group + '</div>' +
        '</div>';
    }).join('');
  }

  function renderAll() {
    var key = window.MW.Layout.getStoredPeriodKey();
    var range = Store.periodRange(key);
    var prevRange = Store.previousPeriodRange(key);

    var t = Store.totals(range.start, range.end);
    var prevT = prevRange ? Store.totals(prevRange.start, prevRange.end) : null;

    renderStatCard('statIncome', 'statIncomeDelta', t.income, prevT ? prevT.income : null, true);
    renderStatCard('statExpense', 'statExpenseDelta', t.expense, prevT ? prevT.expense : null, false);
    renderStatCard('statBalance', 'statBalanceDelta', t.balance, prevT ? prevT.balance : null, true);
    document.getElementById('statAssets').textContent = Fmt.formatRupiah(Store.netWorth());

    document.getElementById('quickChartSubtitle').textContent = range.label;

    renderRecentTransactions();
    renderQuickChart(range);
    renderAccountsStrip();
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var ready = await Store.init();
    if (!ready) return;
    window.MW.Layout.init('dashboard', true);
    renderAll();
  });
  window.addEventListener('mw:period-changed', renderAll);
  window.addEventListener('mw:data-changed', renderAll);
  window.addEventListener('mw:theme-changed', renderAll);
})();
