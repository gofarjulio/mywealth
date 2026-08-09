(function () {
  'use strict';
  var Store = window.MW.Store;
  var Fmt = window.MW.Format;
  var pieChart = null, trendChart = null;

  function hexToRgba(hex, alpha) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function renderPie(range) {
    var rows = Store.categoryBreakdown(range.start, range.end, 'expense');
    document.getElementById('pieSubtitle').textContent = range.label;
    var empty = document.getElementById('pieEmpty');
    var wrap = document.getElementById('pieChartWrap');
    var legend = document.getElementById('pieLegend');
    var tableBody = document.getElementById('pieTableBody');

    if (!rows.length) {
      empty.classList.remove('d-none');
      wrap.classList.add('d-none');
      legend.innerHTML = '';
      tableBody.innerHTML = '';
      if (pieChart) { pieChart.destroy(); pieChart = null; }
      return;
    }
    empty.classList.add('d-none');
    wrap.classList.remove('d-none');

    var colors = rows.map(function (r) { return Fmt.seriesColor(r.colorSlot); });
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(document.getElementById('pieChart'), {
      type: 'doughnut',
      data: {
        labels: rows.map(function (r) { return r.name; }),
        datasets: [{ data: rows.map(function (r) { return r.total; }), backgroundColor: colors, borderColor: Fmt.cssVar('--surface-1'), borderWidth: 2, hoverOffset: 6 }]
      },
      options: {
        cutout: '66%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (ctx) { return ' ' + ctx.label + ': ' + Fmt.formatRupiah(ctx.parsed); } } }
        }
      }
    });

    legend.innerHTML = rows.map(function (r) {
      return '<li><span class="legend-left"><span class="cat-dot" style="background:var(--series-' + r.colorSlot + ')"></span>' + Fmt.escapeHTML(r.name) + '</span>' +
        '<span><span class="legend-value">' + Fmt.formatRupiah(r.total) + '</span><span class="legend-pct">' + r.pct.toFixed(0) + '%</span></span></li>';
    }).join('');

    tableBody.innerHTML = rows.map(function (r) {
      return '<tr><td><span class="cat-chip"><span class="cat-dot" style="background:var(--series-' + r.colorSlot + ')"></span>' + Fmt.escapeHTML(r.name) + '</span></td>' +
        '<td class="text-end">' + Fmt.formatRupiah(r.total) + '</td><td class="text-end text-muted-mw">' + r.pct.toFixed(1) + '%</td></tr>';
    }).join('');
  }

  function renderTrend(monthsBack) {
    var rows = Store.monthlyTrend(monthsBack);
    var incomeColor = Fmt.seriesColor(6);
    var expenseColor = Fmt.seriesColor(8);

    if (trendChart) trendChart.destroy();
    trendChart = new Chart(document.getElementById('trendChart'), {
      type: 'line',
      data: {
        labels: rows.map(function (r) { return r.label; }),
        datasets: [
          {
            label: 'Income', data: rows.map(function (r) { return r.income; }),
            borderColor: incomeColor, backgroundColor: hexToRgba(incomeColor, 0.1),
            borderWidth: 2, pointRadius: 4, pointHoverRadius: 5, pointBackgroundColor: incomeColor,
            pointBorderColor: Fmt.cssVar('--surface-1'), pointBorderWidth: 2, tension: 0.25, fill: true
          },
          {
            label: 'Expenses', data: rows.map(function (r) { return r.expense; }),
            borderColor: expenseColor, backgroundColor: hexToRgba(expenseColor, 0.1),
            borderWidth: 2, pointRadius: 4, pointHoverRadius: 5, pointBackgroundColor: expenseColor,
            pointBorderColor: Fmt.cssVar('--surface-1'), pointBorderWidth: 2, tension: 0.25, fill: true
          }
        ]
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (ctx) { return ' ' + ctx.dataset.label + ': ' + Fmt.formatRupiah(ctx.parsed.y); } } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: Fmt.cssVar('--text-muted') } },
          y: {
            grid: { color: Fmt.cssVar('--gridline') },
            ticks: { color: Fmt.cssVar('--text-muted'), callback: function (v) { return Fmt.formatCompact(v); } }
          }
        }
      }
    });

    var body = document.getElementById('recapTableBody');
    body.innerHTML = rows.map(function (r) {
      var selisih = r.income - r.expense;
      var cls = selisih >= 0 ? 'up' : 'down';
      return '<tr><td>' + r.label + '</td>' +
        '<td class="text-end">' + Fmt.formatRupiah(r.income) + '</td>' +
        '<td class="text-end">' + Fmt.formatRupiah(r.expense) + '</td>' +
        '<td class="text-end amount-text ' + cls + '">' + Fmt.formatRupiah(selisih) + '</td></tr>';
    }).join('');
  }

  function exportCSV() {
    var monthsBack = Number(document.getElementById('trendMonths').value);
    var rows = Store.monthlyTrend(monthsBack);
    var lines = ['Month,Income,Expenses,Difference'];
    rows.forEach(function (r) {
      lines.push([r.label, r.income, r.expense, r.income - r.expense].join(','));
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'mywealth-report-' + Store.todayISO() + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function renderAll() {
    var key = window.MW.Layout.getStoredPeriodKey();
    var range = Store.periodRange(key);
    renderPie(range);
    renderTrend(Number(document.getElementById('trendMonths').value));
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var ready = await Store.init();
    if (!ready) return;
    window.MW.Layout.init('statistik', true);
    renderAll();

    document.getElementById('trendMonths').addEventListener('change', function () {
      renderTrend(Number(this.value));
    });
    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
    document.getElementById('pieTableToggle').addEventListener('click', function () {
      var chartWrap = document.getElementById('pieChartWrap');
      var tableWrap = document.getElementById('pieTableWrap');
      var showingTable = !tableWrap.classList.contains('d-none');
      if (showingTable) {
        tableWrap.classList.add('d-none');
        chartWrap.classList.remove('d-none');
        this.textContent = 'Table View';
      } else {
        tableWrap.classList.remove('d-none');
        chartWrap.classList.add('d-none');
        this.textContent = 'Chart View';
      }
    });
  });
  window.addEventListener('mw:period-changed', renderAll);
  window.addEventListener('mw:data-changed', renderAll);
  window.addEventListener('mw:theme-changed', renderAll);
})();
