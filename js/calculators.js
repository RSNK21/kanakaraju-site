/* Investment and loan planners (all figures in Indian rupees) */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  if (!$('#invest')) return;
  var t = function (k, vars) { var s = window.DK_t ? window.DK_t(k) : k; if (vars) Object.keys(vars).forEach(function (v) { s = s.split('{' + v + '}').join(vars[v]); }); return s; };
  var isKn = function () { return document.documentElement.lang === 'kn'; };
  var inr = function (v) { return '₹' + Math.round(v).toLocaleString('en-IN'); };
  function words(v) {
    if (v >= 1e7) return (v / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' ' + t('crore');
    if (v >= 1e5) return (v / 1e5).toFixed(2).replace(/\.?0+$/, '') + ' ' + t('lakh');
    return '';
  }
  function segVal(id) { var b = document.querySelector('#' + id + ' [aria-pressed="true"]'); return b ? b.dataset.v : null; }
  function bindSeg(id, cb) {
    $$('#' + id + ' button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#' + id + ' button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true'); cb(b);
      });
    });
  }

  /* ---------------- exchange rate, kept behind the scenes ---------------- */
  var USD_INR = 88.0, fxLive = false, fxDate = '';
  try { var c = JSON.parse(localStorage.getItem('dk_fx') || 'null'); if (c && Date.now() - c.ts < 6 * 3600e3) { USD_INR = c.rate; fxLive = true; fxDate = c.date; } } catch (e) {}
  if (!fxLive) {
    fetch('https://open.er-api.com/v6/latest/USD').then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.rates && j.rates.INR) {
        USD_INR = j.rates.INR; fxLive = true; fxDate = (j.time_last_update_utc || '').slice(5, 16);
        try { localStorage.setItem('dk_fx', JSON.stringify({ rate: USD_INR, ts: Date.now(), date: fxDate })); } catch (e) {}
        calcInvest();
      }
    }).catch(function () {});
  }

  /* ---------------- 1. investment ---------------- */
  var invAmt = $('#invAmt'), invCur = $('#invCur'), invYears = $('#invYears'), invRate = $('#invRate');
  bindSeg('invMode', function () {
    if (segVal('invMode') === 'sip' && +invAmt.value > 200000 && invCur.value === 'INR') invAmt.value = 10000;
    if (segVal('invMode') === 'lump' && +invAmt.value < 50000 && invCur.value === 'INR') invAmt.value = 500000;
    calcInvest();
  });
  bindSeg('invFreq', calcInvest);
  $$('#invType .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('#invType .chip').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true'); invRate.value = b.dataset.r; calcInvest();
    });
  });
  [invAmt, invCur, invYears, invRate].forEach(function (el) { el.addEventListener('input', calcInvest); });
  invRate.addEventListener('input', function () { $$('#invType .chip').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.r === invRate.value ? 'true' : 'false'); }); });

  function calcInvest() {
    var raw = Math.max(0, +invAmt.value || 0);
    var amt = invCur.value === 'USD' ? raw * USD_INR : raw;
    var n = +invYears.value, r = +invRate.value / 100, f = +segVal('invFreq'), sip = segVal('invMode') === 'sip';
    var i = Math.pow(1 + r, 1 / 12) - 1;
    $('#invYearsOut').textContent = n; $('#rYears').textContent = n;
    $('#invRateOut').textContent = (+invRate.value).toFixed(2).replace(/\.?0+$/, '') + '%';
    var fxN = $('#fxNote');
    if (invCur.value === 'USD') {
      fxN.textContent = t(fxLive ? 'fxLive' : 'fxApprox', { rate: USD_INR.toFixed(2), date: fxDate }) + ' ' + t('approxInr', { v: inr(amt) });
    } else fxN.textContent = '';

    function fvAt(years) {
      var m = years * 12;
      if (sip) return i === 0 ? amt * m : amt * ((Math.pow(1 + i, m) - 1) / i) * (1 + i);
      return amt * Math.pow(1 + r, years);
    }
    var fv = fvAt(n), paid = sip ? amt * n * 12 : amt;
    var perRate = Math.pow(1 + r, 1 / f) - 1;
    var income = (sip ? fv : amt) * perRate;
    $('#rFuture').textContent = inr(fv);
    $('#rWords').textContent = words(fv) ? '(' + words(fv) + ')' : '';
    $('#rPaid').textContent = inr(paid);
    $('#rGain').textContent = inr(fv - paid);
    $('#rIncome').textContent = inr(income);
    var key = { 12: 'M', 4: 'Q', 1: 'Y' }[f];
    var lbl = $('#rIncomeLbl');
    lbl.removeAttribute('data-i18n');
    lbl.textContent = t((sip ? 'incSip' : 'inc') + key, { n: n });
    $('#rReal').textContent = inr(fv / Math.pow(1.06, n));
    drawChart(n, fvAt, sip ? function (y) { return amt * 12 * y; } : function () { return amt; });

    var mode = sip ? t('waSip', { a: inr(amt) }) : t('waLump', { a: inr(amt) });
    window.DK_setWa && window.DK_setWa('invest', t('waInvest', { mode: mode, n: n, r: invRate.value, fv: inr(fv) }));
  }

  function drawChart(n, fvAt, paidAt) {
    var svg = $('#invChart'), W = 400, H = 150, pad = 18;
    var vals = [], paids = [];
    for (var y = 0; y <= n; y++) { vals.push(fvAt(y)); paids.push(paidAt(y)); }
    var max = Math.max.apply(null, vals.concat(paids)) || 1;
    var X = function (k) { return pad + (W - pad * 2) * (k / Math.max(n, 1)); };
    var Y = function (v) { return H - pad - (H - pad * 2) * (v / max); };
    var line = vals.map(function (v, k) { return (k ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
    var pl = paids.map(function (v, k) { return (k ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
    var area = line + ' L' + X(n) + ' ' + (H - pad) + ' L' + X(0) + ' ' + (H - pad) + ' Z';
    var defs = svg.querySelector('defs').outerHTML;
    svg.innerHTML = defs +
      '<line x1="' + pad + '" y1="' + (H - pad) + '" x2="' + (W - pad) + '" y2="' + (H - pad) + '" stroke="#E3E6EE"/>' +
      '<path class="area" d="' + area + '"/><path class="ln2" d="' + pl + '"/><path class="ln" d="' + line + '"/>' +
      '<circle cx="' + X(n) + '" cy="' + Y(vals[n]) + '" r="4" fill="#B5202E"/>' +
      '<text x="' + pad + '" y="' + (H - 4) + '">0</text><text x="' + (W - pad) + '" y="' + (H - 4) + '" text-anchor="end">' + n + ' ' + t('yrsShort') + '</text>';
    var ln = svg.querySelector('.ln');
    if (ln.getTotalLength && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var L = ln.getTotalLength(); ln.style.strokeDasharray = L; ln.style.strokeDashoffset = L;
      ln.getBoundingClientRect(); ln.style.transition = 'stroke-dashoffset .9s cubic-bezier(.22,.8,.2,1)'; ln.style.strokeDashoffset = 0;
    }
  }

  /* ---------------- 2. loans ---------------- */
  var LOANS = {
    home: { rate: 8.5, term: 240, max: 360, amt: 3000000, fee: 0.5 },
    edu: { rate: 10.5, term: 84, max: 180, amt: 1000000, fee: 0 },
    veh: { rate: 9.25, term: 60, max: 96, amt: 800000, fee: 0.5 },
    per: { rate: 12.5, term: 36, max: 84, amt: 300000, fee: 1.5 },
    msme: { rate: 10.5, term: 60, max: 120, amt: 2500000, fee: 1 },
    gold: { rate: 9.5, term: 12, max: 36, amt: 200000, fee: 0.5 },
    shop: { rate: 15, term: 12, max: 36, amt: 60000, fee: 1.5 }
  };
  var loanKind = 'home';
  var lAmt = $('#loanAmt'), lRate = $('#loanRate'), lTerm = $('#loanTerm'), lStart = $('#loanStart'), lFee = $('#loanFee'), lPre = $('#loanPre');
  var now = new Date(); var nm = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  lStart.value = nm.getFullYear() + '-' + String(nm.getMonth() + 1).padStart(2, '0');
  $$('#loanType .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('#loanType .chip').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true'); loanKind = b.dataset.k;
      var d = LOANS[loanKind];
      lRate.value = d.rate; lTerm.max = d.max; lTerm.value = d.term; lAmt.value = d.amt; lFee.value = d.fee; lPre.value = 0;
      calcLoan();
    });
  });
  [lAmt, lRate, lTerm, lStart, lFee, lPre].forEach(function (el) { el.addEventListener('input', calcLoan); });

  function termText(m) {
    var y = Math.floor(m / 12), mo = m % 12, out = [];
    if (y) out.push(y + ' ' + t(y === 1 ? 'yr' : 'yrs'));
    if (mo) out.push(mo + ' ' + t(mo === 1 ? 'mo' : 'mos'));
    return out.join(' ') || '0';
  }
  function monthName(d) {
    try { return d.toLocaleDateString(isKn() ? 'kn-IN' : 'en-IN', { month: 'long', year: 'numeric' }); }
    catch (e) { return (d.getMonth() + 1) + '/' + d.getFullYear(); }
  }
  function simulate(P, i, n, emi, extra, startY, startM) {
    var bal = P, totInt = 0, months = 0, rows = {}, y, m;
    while (bal > 0.5 && months < 1200) {
      var interest = bal * i, prin = Math.min(emi - interest, bal);
      if (i === 0) prin = Math.min(emi, bal);
      bal -= prin; months++;
      var calM = startM + months - 1; y = startY + Math.floor(calM / 12);
      rows[y] = rows[y] || { p: 0, i: 0, b: 0 };
      rows[y].p += prin; rows[y].i += interest; totInt += interest;
      if (extra > 0 && months % 12 === 0 && bal > 0) { var e = Math.min(extra, bal); bal -= e; rows[y].p += e; }
      rows[y].b = Math.max(bal, 0);
      if (months >= n && extra <= 0) break;
    }
    return { months: months, interest: totInt, rows: rows };
  }
  function calcLoan() {
    var P = Math.max(0, +lAmt.value || 0), r = Math.max(0, +lRate.value || 0), n = Math.max(1, +lTerm.value), i = r / 1200;
    var fee = P * (Math.max(0, +lFee.value || 0) / 100), extra = Math.max(0, +lPre.value || 0);
    $('#loanTermOut').textContent = termText(n);
    $('#loanHint').textContent = t('hint_' + loanKind);
    var emi = i === 0 ? P / n : P * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1);
    var parts = (lStart.value || '').split('-'), sy = +parts[0] || now.getFullYear(), sm = (+parts[1] || 1) - 1;
    var base = simulate(P, i, n, emi, 0, sy, sm);
    var withX = extra > 0 ? simulate(P, i, n, emi, extra, sy, sm) : base;
    $('#lEmi').textContent = inr(emi);
    $('#lEmiSub').textContent = t('emiSub', { n: n, t: termText(n) });
    $('#lPrin').textContent = inr(P);
    $('#lInt').textContent = inr(withX.interest);
    $('#lTotal').textContent = inr(P + withX.interest + fee);
    $('#lSaved').textContent = inr(Math.max(base.interest - withX.interest, 0));
    var close = new Date(sy, sm + withX.months - 1, 1);
    $('#lCloseDate').textContent = monthName(close);
    var note = '(' + termText(withX.months) + ')';
    if (withX.months < n) note += ' · ' + t('earlier', { t: termText(n - withX.months) });
    $('#lCloseNote').textContent = note;
    var tb = $('#lSched tbody'), html = '';
    Object.keys(withX.rows).forEach(function (y) {
      var row = withX.rows[y];
      html += '<tr><td>' + y + '</td><td>' + inr(row.p) + '</td><td>' + inr(row.i) + '</td><td>' + inr(row.b) + '</td></tr>';
    });
    tb.innerHTML = html;
    var typeName = (document.querySelector('#loanType [aria-pressed="true"]') || {}).textContent || loanKind;
    window.DK_setWa && window.DK_setWa('loan', t('waLoan', { type: typeName.trim(), a: inr(P), t: termText(n), r: r, emi: inr(emi), close: monthName(close) }));
  }

  document.addEventListener('langchange', function () { calcInvest(); calcLoan(); });
  calcInvest(); calcLoan();
})();
