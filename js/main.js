/* DhanaKanaka site behaviour */
(function () {
  'use strict';
  var WA = '919448973582';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- WhatsApp links with a friendly prefilled note ---------- */
  function waHref(msg) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg); }
  window.DK_setWa = function (kind, msg) {
    $$('.wa-link[data-wa="' + kind + '"]').forEach(function (a) { a.href = waHref(msg); });
  };
  function refreshGenericWa() {
    var msg = window.DK_t ? window.DK_t('waHello') : 'Hello, I visited dhanakanaka.in and would like to talk.';
    $$('.wa-link:not([data-wa])').forEach(function (a) { a.href = waHref(msg); });
    var dvg = window.DK_t ? window.DK_t('waDvg') : 'Hello, I would like to take part in DVG Balaga Prathishthana events.';
    $$('.wa-link[data-wa="dvg"]').forEach(function (a) { a.href = waHref(dvg); });
    var sam = window.DK_t ? window.DK_t('waSam') : 'Hello, I would like to know more about Samarasa Ventures events.';
    $$('.wa-link[data-wa="sam"]').forEach(function (a) { a.href = waHref(sam); });
  }
  document.addEventListener('langchange', refreshGenericWa);

  /* ---------- floating nav: hide on scroll down, show on scroll up ---------- */
  var nav = $('#nav'), lastY = window.scrollY, burger = $('.burger');
  var darkZones = $$('.hero, .planner, .culture, .page-hero, .footer');
  function navState() {
    var y = window.scrollY;
    if (nav && !nav.classList.contains('open')) {
      if (y > lastY + 6 && y > 180) nav.classList.add('hide');
      else if (y < lastY - 6 || y < 180) nav.classList.remove('hide');
    }
    lastY = y;
    // on-dark when nav overlaps a dark section
    var mid = 46, dark = false;
    darkZones.forEach(function (z) { var r = z.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) dark = true; });
    if (nav) nav.classList.toggle('on-dark', dark);
    // active link
    $$('.nav-links a[href^="#"]').forEach(function (a) {
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (!t) return; var r = t.getBoundingClientRect();
      a.classList.toggle('active', r.top < 140 && r.bottom > 140);
    });
  }
  if (burger) burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.remove('hide');
  });
  $$('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); if (burger) burger.setAttribute('aria-expanded', 'false'); }); });

  /* ---------- finance scroll gauge: a rising price line with a rupee coin ---------- */
  var gauge = $('.gauge'), track, fill, coin, glabel, glen = 0;
  if (gauge) {
    track = $('.track', gauge); fill = $('.fill', gauge); coin = $('.coin', gauge); glabel = $('.gauge-label b', gauge);
    // build a market-like rising zigzag, seeded so it looks the same each visit
    var pts = [], y = 392, seed = 7, x = 23;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    pts.push([x, y]);
    while (y > 12) { y -= 14 + rnd() * 18; x = 8 + rnd() * 30; if (rnd() < .22) y += 10; pts.push([x, Math.max(y, 10)]); }
    var d = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
    track.setAttribute('d', d); fill.setAttribute('d', d);
    glen = fill.getTotalLength();
    fill.style.strokeDasharray = glen; fill.style.strokeDashoffset = glen;
  }
  var topbar = $('.topbar');
  function progress() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? clamp(window.scrollY / h, 0, 1) : 0;
    if (topbar) topbar.style.transform = 'scaleX(' + p + ')';
    if (gauge && glen) {
      fill.style.strokeDashoffset = glen * (1 - p);
      var pt = fill.getPointAtLength(glen * p);
      coin.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ') scale(' + (0.9 + 0.2 * Math.abs(Math.sin(p * 20))) + ' 1)');
      glabel.textContent = '+' + Math.round(p * 100) + '%';
    }
  }

  /* ---------- pinned horizontal planner with dissolve ---------- */
  var hs = $('.hs'), panels = $$('.hs-panel'), tabs = $$('.hs-tabs [role=tab]'), hsBar = $('.hs-bar i');
  var mq = window.matchMedia('(max-width: 860px)');
  function hold(t) { // dwell on each card, glide between them
    var s = clamp((t - 0.22) / 0.56, 0, 1);
    return s * s * (3 - 2 * s);
  }
  function planner() {
    if (!hs || !panels.length) return;
    if (mq.matches) { panels.forEach(function (p) { p.removeAttribute('inert'); }); return; }
    var r = hs.getBoundingClientRect();
    var span = hs.offsetHeight - window.innerHeight;
    var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    var n = panels.length, raw = p * (n - 1), i0 = Math.min(Math.floor(raw), n - 2);
    var x = i0 + hold(raw - i0);
    panels.forEach(function (el, i) {
      var dd = i - x, a = Math.abs(dd);
      el.style.opacity = clamp(1 - a * 1.5, 0, 1);
      el.style.transform = 'translateX(' + (dd * 14) + '%) scale(' + (1 - Math.min(a, 1) * 0.05) + ')';
      el.style.filter = a > 0.01 ? 'blur(' + Math.min(a * 12, 12).toFixed(1) + 'px) saturate(' + (1 - Math.min(a, 1) * .4) + ')' : 'none';
      el.style.zIndex = a < 0.5 ? 2 : 1;
      el.style.pointerEvents = a < 0.5 ? 'auto' : 'none';
      if (a < 0.5) el.removeAttribute('inert'); else el.setAttribute('inert', '');
    });
    var cur = Math.round(x);
    tabs.forEach(function (t, i) { t.setAttribute('aria-selected', i === cur ? 'true' : 'false'); });
    if (hsBar) hsBar.style.transform = 'scaleX(' + p + ')';
  }
  function goPanel(i) {
    if (!hs) return;
    if (mq.matches) { panels[i].scrollIntoView({ behavior: 'smooth' }); return; }
    var top = hs.getBoundingClientRect().top + window.scrollY;
    var span = hs.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + span * (i / (panels.length - 1)) + 2, behavior: reduce ? 'auto' : 'smooth' });
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { goPanel(+t.dataset.go); }); });
  // deep links like index.html#loans
  function hashGo() {
    var map = { invest: 0, loans: 1, culture: 2 };
    var h = location.hash.slice(1);
    if (h in map) setTimeout(function () { goPanel(map[h]); }, 60);
  }

  /* ---------- reveal on scroll ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); if (e.target.querySelectorAll) $$('.count', e.target).concat(e.target.classList.contains('count') ? [e.target] : []).forEach(countUp); } });
  }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' }) : null;
  function observeAll() { $$('.rv, .mborder.draw').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); }); }

  /* ---------- counters ---------- */
  function countUp(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    var to = +el.dataset.to, suf = el.dataset.suffix || '', start = null, dur = 1600;
    var fmt = function (v) { return to >= 1900 && to <= 2100 ? String(v) : v.toLocaleString('en-IN'); };
    if (reduce) { el.textContent = fmt(to) + suf; return; }
    var from = to >= 1900 && to <= 2100 ? to - 60 : 0;
    function step(ts) {
      if (!start) start = ts; var k = Math.min((ts - start) / dur, 1); k = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(from + (to - from) * k)) + suf;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- accordion galleries ---------- */
  function lang() { return document.documentElement.lang === 'kn' ? 'kn' : 'en'; }
  var DVG_PHOTOS = [
    ['a00', 'DVG Prashasthi Pradana Samarambha, DVG Balaga Mysuru', 'ಡಿವಿಜಿ ಪ್ರಶಸ್ತಿ ಪ್ರದಾನ ಸಮಾರಂಭ, ಡಿವಿಜಿ ಬಳಗ ಮೈಸೂರು'],
    ['a01', 'DVG Award ceremony', 'ಡಿವಿಜಿ ಪ್ರಶಸ್ತಿ ಪ್ರದಾನ'],
    ['a02', 'Awardee with members of the Balaga', 'ಬಳಗದ ಸದಸ್ಯರೊಂದಿಗೆ ಪುರಸ್ಕೃತರು'],
    ['a03', 'DVG Balaga Prathishthana felicitation', 'ಡಿವಿಜಿ ಬಳಗ ಪ್ರತಿಷ್ಠಾನದ ಸನ್ಮಾನ'],
    ['a04', 'Presenting the DVG Award', 'ಡಿವಿಜಿ ಪ್ರಶಸ್ತಿ ಪ್ರದಾನ'],
    ['a05', 'Honouring the awardee', 'ಪುರಸ್ಕೃತರಿಗೆ ಗೌರವ'],
    ['a06', 'Felicitation on stage', 'ವೇದಿಕೆಯಲ್ಲಿ ಸನ್ಮಾನ'],
    ['a07', 'An earlier DVG Award', 'ಹಿಂದಿನ ಡಿವಿಜಿ ಪ್ರಶಸ್ತಿ'],
    ['a08', 'Award presentation with guests', 'ಅತಿಥಿಗಳೊಂದಿಗೆ ಪ್ರಶಸ್ತಿ ಪ್ರದಾನ'],
    ['a09', 'The awardee and the Balaga', 'ಪುರಸ್ಕೃತರು ಮತ್ತು ಬಳಗ'],
    ['a10', 'With a portrait of D.V. Gundappa', 'ಡಿ.ವಿ. ಗುಂಡಪ್ಪನವರ ಚಿತ್ರದೊಂದಿಗೆ']
  ].map(function (x) { return { src: 'assets/dvg/' + x[0] + '.webp', en: x[1], kn: x[2] }; });
  var GALLERY_BASE = [
    { src: 'assets/img/kanakaraju.webp', en: 'C. Kanakaraju', kn: 'ಸಿ. ಕನಕರಾಜು' },
    { src: 'assets/img/lakshmi.webp', en: 'Lakshmi, in the Mysuru painting tradition', kn: 'ಮೈಸೂರು ಶೈಲಿಯ ಲಕ್ಷ್ಮೀ ಚಿತ್ರ' }
  ];
  var lbItems = [];
  /* iOS app-switcher style card stack with spring physics */
  function Accordion(root, items) {
    var pos = 0, target = 0, vel = 0, raf = 0, cards = [], cw = 0, W = 0, timer = null, hover = false, dragging = false;
    var ctrl = root.nextElementSibling, count = ctrl && $('.acc-count', ctrl);
    var cap = document.createElement('div'); cap.className = 'deck-cap';
    root.classList.add('deck'); root.tabIndex = 0;
    function n() { return items.length; }
    function build() {
      root.innerHTML = ''; cards = [];
      items.forEach(function (it, i) {
        var c = document.createElement('figure'); c.className = 'deck-card';
        c.innerHTML = '<div class="deck-bg"></div><img alt="" draggable="false" decoding="async"' + (i > 3 ? ' loading="lazy"' : '') + '><span class="deck-shade"></span>';
        c.querySelector('img').src = it.src; c.querySelector('img').alt = it[lang()] || it.en || '';
        c.querySelector('.deck-bg').style.backgroundImage = 'url("' + it.src + '")';
        c.addEventListener('click', function () { if (moved > 6) return; if (Math.round(pos) === i) openLb(items, i); else go(i); });
        root.appendChild(c); cards.push(c);
      });
      root.appendChild(cap);
      measure(); render(); caption();
    }
    function measure() { W = root.clientWidth; cw = Math.min(W * (W < 700 ? .8 : .58), 820); }
    function render() {
      var base = (W - cw) / 2;
      cards.forEach(function (c, i) {
        var d = i - pos, ad = Math.abs(d);
        if (d < -6 || d > 3.5) { c.style.visibility = 'hidden'; return; }
        c.style.visibility = 'visible';
        var x, s, br;
        if (d <= 0) { x = d * cw * 0.2 * (1 - Math.min(-d, 4) * 0.08); s = 1 + d * 0.055; br = 1 + d * 0.16; }
        else { x = d * cw * 0.82; s = 1 - Math.min(d, 1) * 0.02; br = 1 - Math.min(d, 1) * 0.1; }
        c.style.width = cw + 'px';
        c.style.transform = 'translate3d(' + (base + x).toFixed(2) + 'px,0,0) scale(' + s.toFixed(4) + ')';
        c.style.zIndex = 100 + i;
        c.querySelector('.deck-shade').style.opacity = (1 - Math.max(br, .25)).toFixed(3);
        c.classList.toggle('is-front', ad < .5);
      });
      if (count) count.textContent = (((Math.round(pos) % n()) + n()) % n() + 1) + ' / ' + n();
    }
    var lastCap = -1;
    function caption() {
      var i = Math.round(pos); if (i === lastCap) return; lastCap = i;
      var it = items[i]; cap.classList.remove('show');
      setTimeout(function () { cap.innerHTML = '<small>' + String(i + 1).padStart(2, '0') + ' / ' + String(n()).padStart(2, '0') + '</small><b></b>'; cap.querySelector('b').textContent = it[lang()] || it.en || ''; cap.classList.add('show'); }, 180);
    }
    function loop() {
      if (!dragging) { // critically damped spring
        var k = 0.065, damp = 0.72;
        vel = (vel + (target - pos) * k) * damp; pos += vel;
        if (Math.abs(target - pos) < 0.0008 && Math.abs(vel) < 0.0008) { pos = target; vel = 0; render(); caption(); raf = 0; return; }
      }
      render(); caption(); raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }
    function go(i) { target = Math.max(0, Math.min(n() - 1, i)); if (i >= n()) target = 0; if (i < 0) target = n() - 1; kick(); restart(); }
    function restart() { clearInterval(timer); timer = setInterval(function () { if (!hover && !dragging && !document.hidden && inView) go(target + 1); }, 4800); }
    // drag / swipe with momentum
    var sx = 0, sp = 0, lx = 0, lt = 0, dv = 0, moved = 0;
    root.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return; dragging = true; moved = 0; sx = lx = e.clientX; sp = pos; lt = performance.now(); dv = 0;
      root.setPointerCapture(e.pointerId); root.classList.add('grabbing');
    });
    root.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var now = performance.now(), dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      dv = (e.clientX - lx) / Math.max(now - lt, 1); lx = e.clientX; lt = now;
      var p = sp - dx / (cw * 0.82);
      if (p < 0) p = p * 0.35; if (p > n() - 1) p = n() - 1 + (p - n() + 1) * 0.35; // rubber band
      pos = p; render(); caption();
    });
    function end() {
      if (!dragging) return; dragging = false; root.classList.remove('grabbing');
      var fling = -dv * 260 / (cw * 0.82);
      target = Math.max(0, Math.min(n() - 1, Math.round(pos + fling))); vel = 0; kick(); restart();
    }
    root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
    var wheelT = 0;
    root.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; e.preventDefault();
      var now = performance.now(); if (now - wheelT < 420) return; wheelT = now; go(target + (e.deltaX > 0 ? 1 : -1));
    }, { passive: false });
    root.addEventListener('mouseenter', function () { hover = true; });
    root.addEventListener('mouseleave', function () { hover = false; });
    root.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { go(target + 1); e.preventDefault(); } if (e.key === 'ArrowLeft') { go(target - 1); e.preventDefault(); } if (e.key === 'Enter') openLb(items, target); });
    if (ctrl) $$('.acc-btn', ctrl).forEach(function (b) { b.addEventListener('click', function () { go(target + (+b.dataset.dir)); }); });
    var inView = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }).observe(root);
    window.addEventListener('resize', function () { measure(); render(); });
    document.addEventListener('langchange', function () { lastCap = -1; caption(); cards.forEach(function (c, i) { c.querySelector('img').alt = items[i][lang()] || items[i].en || ''; }); });
    this.set = function (list) { items = list; pos = target = 0; vel = 0; lastCap = -1; build(); restart(); };
    build(); restart();
  }
  function initGalleries() {
    var g = $('#galleryAcc');
    if (g) {
      var acc = new Accordion(g, GALLERY_BASE.slice());
      fetch('assets/gallery/gallery.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; })
        .then(function (list) {
          if (!Array.isArray(list) || !list.length) return;
          acc.set(list.map(function (x) { return { src: 'assets/gallery/' + x.file, en: x.caption || '', kn: x.caption_kn || x.caption || '' }; }).concat(GALLERY_BASE));
        }).catch(function () {});
    }
    var a = $('#awardAcc'); if (a) new Accordion(a, DVG_PHOTOS);
  }

  /* ---------- lightbox (created on demand) ---------- */
  var lb = $('#lightbox'), lbi = 0, lastFocus = null;
  function ensureLb() {
    if (lb) return;
    lb = document.createElement('div'); lb.className = 'lightbox'; lb.id = 'lightbox';
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<button class="lb-btn lb-close" type="button" aria-label="Close">✕</button><button class="lb-btn lb-prev" type="button" aria-label="Previous">‹</button><img alt=""><button class="lb-btn lb-next" type="button" aria-label="Next">›</button><p></p>';
    document.body.appendChild(lb); wireLb();
  }
  function openLb(list, i) {
    ensureLb(); lbItems = list; lbi = i; lastFocus = document.activeElement;
    showLb(); lb.classList.add('open'); document.body.style.overflow = 'hidden'; $('.lb-close', lb).focus();
  }
  function showLb() { var it = lbItems[lbi]; $('img', lb).src = it.src; $('img', lb).alt = it[lang()] || it.en || ''; $('p', lb).textContent = it[lang()] || it.en || ''; }
  function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  function wireLb() {
    $('.lb-close', lb).addEventListener('click', closeLb);
    $('.lb-prev', lb).addEventListener('click', function () { lbi = (lbi - 1 + lbItems.length) % lbItems.length; showLb(); });
    $('.lb-next', lb).addEventListener('click', function () { lbi = (lbi + 1) % lbItems.length; showLb(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowRight') $('.lb-next', lb).click();
      if (e.key === 'ArrowLeft') $('.lb-prev', lb).click();
    });
  }
  if (lb) wireLb();

  /* ---------- coins flowing from Lakshmi's hand ---------- */
  function coinRain() {
    var hero = $('.hero'), cv = $('.coin-rain'), lk = $('#lakshmiHero');
    if (!hero || !cv || !lk) return;
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), coins = [], run = true, last = 0, acc = 0, ox = 0, oy = 0;
    function size() {
      var r = hero.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      origin();
    }
    function origin() { // live position of the palm, follows reveal and float motion
      var r = hero.getBoundingClientRect(), l = lk.getBoundingClientRect();
      ox = l.left - r.left + l.width * +lk.dataset.hx; oy = l.top - r.top + l.height * +lk.dataset.hy;
    }
    function spawn() {
      var s = Math.max(W / 1400, .55), sz = lk.getBoundingClientRect().width / 300;
      coins.push({
        x: ox + (Math.random() - .5) * 8 * sz, y: oy + (Math.random() - .3) * 6 * sz,
        vx: (0.5 + Math.random() * 2.6) * s,
        vy: -0.6 + Math.random() * 1.4,
        r: (4 + Math.random() * 4.5) * Math.min(Math.max(sz, .7), 1.4), a: Math.random() * 6.28, va: .08 + Math.random() * .16, life: 0
      });
    }
    function drawCoin(c) {
      var sx = Math.abs(Math.cos(c.a)) * .85 + .15;
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(sx, 1);
      var g = ctx.createRadialGradient(-c.r * .35, -c.r * .35, c.r * .1, 0, 0, c.r);
      g.addColorStop(0, '#FFF3C4'); g.addColorStop(.45, '#F2C94C'); g.addColorStop(1, '#A87412');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, c.r, 0, 6.2832); ctx.fill();
      ctx.lineWidth = Math.max(1, c.r * .16); ctx.strokeStyle = 'rgba(122,82,10,.85)'; ctx.stroke();
      if (sx > .55) { ctx.fillStyle = 'rgba(122,82,10,.8)'; ctx.font = '700 ' + (c.r * 1.15) + 'px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('₹', 0, c.r * .06); }
      ctx.restore();
    }
    function frame(t) {
      if (!run) return;
      var dt = Math.min((t - last) / 16.7, 3) || 1; last = t;
      origin(); acc += dt; while (acc > 3.2) { spawn(); acc -= 3.2; }
      ctx.clearRect(0, 0, W, H);
      for (var i = coins.length - 1; i >= 0; i--) {
        var c = coins[i];
        c.vy += .07 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt; c.life += dt;
        if (c.y > H + 20 || c.x > W + 20) { coins.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, .55 + c.life / 5); drawCoin(c);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    function start() { if (run) return; run = true; last = performance.now(); requestAnimationFrame(frame); }
    size();
    if (lk.complete) size(); else lk.addEventListener('load', size);
    window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) start(); else run = false; }).observe(hero);
    document.addEventListener('visibilitychange', function () { if (document.hidden) run = false; else start(); });
    last = performance.now(); requestAnimationFrame(frame);
  }

  /* ---------- brand returns home ---------- */
  $$('.home-link').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (document.body.dataset.page === 'home') { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); if (history.replaceState) history.replaceState(null, '', '#top'); }
    });
  });

  /* ---------- loop ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { navState(); progress(); planner(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  document.addEventListener('DOMContentLoaded', function () {
    $$('.yr').forEach(function (e) { e.textContent = new Date().getFullYear(); });
    observeAll(); initGalleries(); coinRain(); refreshGenericWa(); onScroll(); hashGo();
    var hero = $('.hero'); if (hero) requestAnimationFrame(function () { hero.classList.add('ready'); });
  });
})();
