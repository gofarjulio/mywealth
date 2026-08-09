/* Shared formatting helpers used across every page. */
(function (global) {
  'use strict';

  function formatRupiah(n) {
    var num = Math.round(Number(n) || 0);
    var sign = num < 0 ? '-' : '';
    return sign + 'Rp' + Math.abs(num).toLocaleString('id-ID');
  }

  function formatCompact(n) {
    var num = Number(n) || 0;
    var sign = num < 0 ? '-' : '';
    var abs = Math.abs(num);
    if (abs >= 1e9) return sign + 'Rp' + (abs / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (abs >= 1e6) return sign + 'Rp' + (abs / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (abs >= 1e3) return sign + 'Rp' + (abs / 1e3).toFixed(0) + 'K';
    return formatRupiah(num);
  }

  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function parseISODate(iso) {
    var parts = (iso || '').split('-').map(Number);
    return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  }

  function formatDateLong(iso) {
    var d = parseISODate(iso);
    return DAY_NAMES[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
  }

  function formatDateShort(iso) {
    var d = parseISODate(iso);
    return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear();
  }

  function formatDayAbbr(iso) {
    return DAY_NAMES[parseISODate(iso).getDay()].slice(0, 3);
  }

  function dayOfMonth(iso) {
    return parseISODate(iso).getDate();
  }

  function formatMonthYear(iso) {
    var d = parseISODate(iso);
    return MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
  }

  function debounce(fn, wait) {
    var t = null;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 250);
    };
  }

  function escapeHTML(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function seriesColor(slot) { return cssVar('--series-' + slot); }

  global.MW = global.MW || {};
  global.MW.Format = {
    formatRupiah: formatRupiah,
    formatCompact: formatCompact,
    formatDateLong: formatDateLong,
    formatDateShort: formatDateShort,
    formatDayAbbr: formatDayAbbr,
    dayOfMonth: dayOfMonth,
    formatMonthYear: formatMonthYear,
    debounce: debounce,
    escapeHTML: escapeHTML,
    cssVar: cssVar,
    seriesColor: seriesColor
  };
})(window);
