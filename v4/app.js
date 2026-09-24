/* ==========================================================================
   THE WARM DETOUR — app.js
   Plain browser JavaScript. No frameworks, no build step, no network calls.
   The only thing persisted is the optional "I showed up today" tally, in
   this browser's localStorage, on this device.
   ========================================================================== */

(function () {
  'use strict';

  // Safety net: never run twice if the file:// fallback in index.html also loads this file.
  if (window.__warmDetourReady) { return; }
  window.__warmDetourReady = true;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var prefersCalm = reduceMotion.matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

  /* ======================================================================
     A. SCROLL PROGRESS + SECTION RAIL
     ====================================================================== */
  (function scrollChrome() {
    var bar = $('#scrollBar');
    var links = $all('#rail a');
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    var ticking = false;

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? clamp((window.scrollY / max) * 100, 0, 100) : 0;
      if (bar) bar.style.width = pct.toFixed(2) + '%';

      var probe = window.scrollY + window.innerHeight * 0.38;
      var active = -1;
      sections.forEach(function (sec, i) {
        if (sec && sec.offsetTop <= probe) active = i;
      });
      links.forEach(function (a, i) { a.classList.toggle('is-active', i === active); });
    }

    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  /* ======================================================================
     B. REVEAL ON SCROLL
     ====================================================================== */
  (function reveals() {
    var items = $all('.reveal');
    if (prefersCalm || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    // gentle stagger for items that share a parent
    var groups = {};
    items.forEach(function (el) {
      var key = el.parentElement ? (el.parentElement.className || 'root') : 'root';
      groups[key] = (groups[key] || 0);
      el.style.setProperty('--d', (groups[key] % 5) * 90 + 'ms');
      groups[key]++;
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ======================================================================
     C. HERO CANVAS — drifting dust + a few amber sparks
     ====================================================================== */
  (function heroField() {
    var canvas = $('#field');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var w = 0, h = 0, dpr = 1;
    var motes = [], sparks = [];
    var raf = null, running = false, visible = true;

    function seed() {
      var small = window.innerWidth < 700;
      var moteCount = small ? 34 : 66;
      var sparkCount = small ? 7 : 13;
      motes = []; sparks = [];
      for (var i = 0; i < moteCount; i++) {
        motes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.5 + 0.4,
          vy: -(Math.random() * 0.16 + 0.03),
          sway: Math.random() * Math.PI * 2,
          swaySpeed: Math.random() * 0.006 + 0.002,
          a: Math.random() * 0.5 + 0.18
        });
      }
      for (var j = 0; j < sparkCount; j++) {
        sparks.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.9 + 0.7,
          vx: (Math.random() * 0.34 + 0.08) * (Math.random() < 0.5 ? -1 : 1),
          vy: (Math.random() * 0.2 - 0.1),
          life: Math.random()
        });
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width); h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (prefersCalm) draw(true);
    }

    function draw(staticFrame) {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        if (!staticFrame) {
          m.sway += m.swaySpeed;
          m.y += m.vy;
          m.x += Math.sin(m.sway) * 0.18;
          if (m.y < -6) { m.y = h + 6; m.x = Math.random() * w; }
          if (m.x < -6) m.x = w + 6;
          if (m.x > w + 6) m.x = -6;
        }
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(178, 232, 226,' + m.a.toFixed(3) + ')';
        ctx.fill();
      }

      for (var j = 0; j < sparks.length; j++) {
        var s = sparks[j];
        if (!staticFrame) {
          s.x += s.vx; s.y += s.vy;
          s.life += 0.004;
          if (s.x < -10 || s.x > w + 10 || s.life > 1) {
            s.x = Math.random() * w; s.y = Math.random() * h;
            s.life = 0;
            s.vx = (Math.random() * 0.34 + 0.08) * (Math.random() < 0.5 ? -1 : 1);
          }
        }
        var alpha = (Math.sin(s.life * Math.PI) * 0.55 + 0.1);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 163, 82,' + alpha.toFixed(3) + ')';
        ctx.fill();
      }
    }

    function loop() {
      if (!running) return;
      draw(false);
      raf = window.requestAnimationFrame(loop);
    }

    function start() {
      if (running || prefersCalm || !visible) return;
      running = true; loop();
    }
    function stop() {
      running = false;
      if (raf) { window.cancelAnimationFrame(raf); raf = null; }
    }

    // Pause when the hero is off-screen (saves battery on phones)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0.02 }).observe(canvas);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    var rt = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(rt);
      rt = window.setTimeout(resize, 140);
    });

    function onMotionPrefChange(e) {
      prefersCalm = e.matches;
      if (prefersCalm) { stop(); draw(true); } else { start(); }
    }
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionPrefChange);
    else if (reduceMotion.addListener) reduceMotion.addListener(onMotionPrefChange);

    resize();
    start();
  })();

  /* ======================================================================
     D. HERO ORB — soft pointer parallax (skipped when motion is reduced)
     ====================================================================== */
  (function orbParallax() {
    var orb = $('.hero-orb');
    var hero = $('#opening');
    if (!orb || !hero || prefersCalm) return;
    if (!window.matchMedia('(pointer: fine)').matches) return; // touch devices: leave it still

    var frame = null;
    hero.addEventListener('pointermove', function (e) {
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = null;
        var r = hero.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        orb.style.transform = 'translate3d(' + (dx * -18).toFixed(2) + 'px,' + (dy * -14).toFixed(2) + 'px,0)';
      });
    });
    hero.addEventListener('pointerleave', function () { orb.style.transform = ''; });
  })();

  /* ======================================================================
     E. THE TWO PATHS — diagram layout + interactive trap bubbles
     ====================================================================== */
  (function trapDiagram() {
    var diagram = $('#diagram');
    var svg = $('#paths');
    var bubbleLayer = $('#bubbles');
    var cards = $all('.trap-card');
    var hint = $('#readerHint');
    var stage = $('#cardStage');
    var nav = $('#readerNav');
    var count = $('#readerCount');
    var prevBtn = $('#prevTrap');
    var nextBtn = $('#nextTrap');
    if (!diagram || !svg || !bubbleLayer || !cards.length) return;

    var LAYOUTS = {
      wide: {
        viewBox: '0 0 1000 560',
        ratio: '1000 / 560',
        bubble: 46,
        breakAt: 620,
        straight: 'M78 470 C 300 420, 560 300, 890 140',
        winding: 'M78 470 C150 480 176 356 258 346 C340 336 358 458 438 456 C518 454 528 306 606 296 C684 286 706 424 786 432 C856 439 906 424 975 404',
        goal: { x: 890, y: 140, halo: 88, core: 5, pulse: 16 },
        origin: { x: 78, y: 470, ring: 13, core: 4.5 },
        dead: { x: 975, y: 404, r: 74 },
        amberGrad: { x1: 0.02, y1: 0.5, x2: 1, y2: 0.5 },
        tealGrad: { x1: 0, y1: 1, x2: 1, y2: 0 },
        labels: {
          origin: { x: 152, y: 518, text: 'You, right now' },
          goal: { x: 758, y: 58, text: 'The goal — present, distant' },
          warm: { x: 800, y: 508, text: 'Fades out before arriving' },
          teal: { x: 430, y: 288, text: 'Short, dull, direct' }
        }
      },
      narrow: {
        viewBox: '0 0 420 780',
        ratio: '420 / 780',
        bubble: 54,
        breakAt: 620,
        straight: 'M58 706 C 120 580, 190 400, 310 118',
        winding: 'M58 706 C140 698 108 620 196 602 C288 583 232 512 164 494 C78 470 108 380 208 366 C296 354 288 292 216 268',
        goal: { x: 310, y: 118, halo: 56, core: 4.5, pulse: 13 },
        origin: { x: 58, y: 706, ring: 11, core: 4 },
        dead: { x: 216, y: 268, r: 52 },
        amberGrad: { x1: 0.05, y1: 1, x2: 0.8, y2: 0.05 },
        tealGrad: { x1: 0.1, y1: 1, x2: 0.9, y2: 0 },
        labels: {
          origin: { x: 128, y: 748, text: 'You, right now' },
          goal: { x: 198, y: 56, text: 'The goal' },
          warm: { x: 118, y: 248, text: 'Fades out' },
          teal: { x: 84, y: 452, text: 'Short, direct' }
        }
      }
    };

    var FRACTIONS = [0.11, 0.29, 0.48, 0.67, 0.86];
    var current = -1;
    var opened = [];
    var activeLayout = null;

    var el = {
      straight: $('#pathStraight'),
      ghost: $('#pathStraightGhost'),
      winding: $('#pathWinding'),
      windingGlow: $('#pathWindingGlow'),
      goalHalo: $('#goalHalo'),
      goalCore: $('#goalCore'),
      goalPulse: $('#goalPulse'),
      originRing: $('#originRing'),
      originCore: $('#originCore'),
      dead: $('#deadEnd'),
      amberGrad: $('#fadeAmber'),
      tealGrad: $('#fadeTeal'),
      labelOrigin: $('#labelOrigin'),
      labelGoal: $('#labelGoal'),
      labelWarm: $('#labelWarm'),
      labelTeal: $('#labelTeal')
    };

    function buildBubbles() {
      bubbleLayer.innerHTML = '';
      cards.forEach(function (card, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'bubble';
        b.id = 'bubble-' + (i + 1);
        b.setAttribute('aria-expanded', 'false');
        b.setAttribute('aria-controls', card.id);
        b.setAttribute('aria-label',
          'Trap ' + (i + 1) + ' of ' + cards.length + ': ' +
          card.getAttribute('data-label') + ' (' + card.getAttribute('data-type') + '). Open the explanation.');

        var halo = document.createElement('span');
        halo.className = 'bubble-halo';
        halo.style.setProperty('--pd', (i * 0.42).toFixed(2) + 's');
        var core = document.createElement('span');
        core.className = 'bubble-core';
        var tag = document.createElement('span');
        tag.className = 'bubble-tag';
        tag.textContent = card.getAttribute('data-label');

        b.appendChild(halo); b.appendChild(core); b.appendChild(tag);
        b.addEventListener('click', function () { toggle(i); });
        bubbleLayer.appendChild(b);
      });
    }

    function placeBubbles(L, vbW, vbH) {
      var len = 0;
      try { len = el.winding.getTotalLength(); } catch (err) { len = 0; }
      var bubbles = $all('.bubble', bubbleLayer);
      bubbles.forEach(function (b, i) {
        var x = 50, y = 50;
        if (len) {
          var p = el.winding.getPointAtLength(len * FRACTIONS[i % FRACTIONS.length]);
          x = (p.x / vbW) * 100; y = (p.y / vbH) * 100;
        }
        b.style.left = x.toFixed(3) + '%';
        b.style.top = y.toFixed(3) + '%';
      });
    }

    function setCircle(node, cx, cy, r) {
      if (!node) return;
      node.setAttribute('cx', cx); node.setAttribute('cy', cy);
      if (r !== undefined) node.setAttribute('r', r);
    }

    function setGrad(node, g) {
      if (!node || !g) return;
      node.setAttribute('x1', g.x1); node.setAttribute('y1', g.y1);
      node.setAttribute('x2', g.x2); node.setAttribute('y2', g.y2);
    }

    function setLabel(node, L, key, vbW, vbH) {
      if (!node) return;
      var d = L.labels[key];
      node.textContent = d.text;
      node.style.left = ((d.x / vbW) * 100).toFixed(3) + '%';
      node.style.top = ((d.y / vbH) * 100).toFixed(3) + '%';
    }

    function applyLayout() {
      var name = window.innerWidth >= 620 ? 'wide' : 'narrow';
      var L = LAYOUTS[name];
      var parts = L.viewBox.split(' ');
      var vbW = parseFloat(parts[2]), vbH = parseFloat(parts[3]);

      if (activeLayout === name) { placeBubbles(L, vbW, vbH); return; }
      activeLayout = name;

      svg.setAttribute('viewBox', L.viewBox);
      diagram.style.setProperty('aspect-ratio', L.ratio);
      diagram.style.setProperty('--bubble', L.bubble + 'px');

      el.straight.setAttribute('d', L.straight);
      el.ghost.setAttribute('d', L.straight);
      el.winding.setAttribute('d', L.winding);
      el.windingGlow.setAttribute('d', L.winding);

      setCircle(el.goalHalo, L.goal.x, L.goal.y, L.goal.halo);
      setCircle(el.goalCore, L.goal.x, L.goal.y, L.goal.core);
      setCircle(el.goalPulse, L.goal.x, L.goal.y, L.goal.pulse);
      setCircle(el.originRing, L.origin.x, L.origin.y, L.origin.ring);
      setCircle(el.originCore, L.origin.x, L.origin.y, L.origin.core);
      setCircle(el.dead, L.dead.x, L.dead.y, L.dead.r);
      setGrad(el.amberGrad, L.amberGrad);
      setGrad(el.tealGrad, L.tealGrad);

      setLabel(el.labelOrigin, L, 'origin', vbW, vbH);
      setLabel(el.labelGoal, L, 'goal', vbW, vbH);
      setLabel(el.labelWarm, L, 'warm', vbW, vbH);
      setLabel(el.labelTeal, L, 'teal', vbW, vbH);

      placeBubbles(L, vbW, vbH);
    }

    function render() {
      cards.forEach(function (card, i) {
        var show = i === current;
        card.hidden = !show;
        var b = bubbleLayer.children[i];
        if (b) b.setAttribute('aria-expanded', show ? 'true' : 'false');
      });
      if (hint) hint.classList.toggle('is-hidden', current !== -1);
      if (nav) nav.hidden = current === -1;
      if (count && current !== -1) count.textContent = (current + 1) + ' / ' + cards.length;
      if (current !== -1 && opened.indexOf(current) === -1) {
        opened.push(current);
        var b2 = bubbleLayer.children[current];
        if (b2) b2.classList.add('is-done');
      }
    }

    function select(i, moveFocus) {
      current = clamp(i, 0, cards.length - 1);
      render();
      if (moveFocus) {
        var card = cards[current];
        if (card) {
          card.setAttribute('tabindex', '-1');
          card.focus({ preventScroll: true });
        }
      }
    }

    function toggle(i) {
      if (current === i) { current = -1; render(); }
      else select(i, false);
    }

    buildBubbles();
    applyLayout();
    render();

    if (prevBtn) prevBtn.addEventListener('click', function () {
      select(current <= 0 ? cards.length - 1 : current - 1, true);
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      select(current >= cards.length - 1 ? 0 : current + 1, true);
    });

    // Arrow-key stepping while a card is open
    document.addEventListener('keydown', function (e) {
      if (current === -1) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight') { nextBtn && nextBtn.click(); }
      if (e.key === 'ArrowLeft') { prevBtn && prevBtn.click(); }
      if (e.key === 'Escape') {
        var from = current;
        current = -1;
        render();
        // hand focus back to the point that opened the card, not to <body>
        var b = bubbleLayer.children[from];
        if (b && typeof b.focus === 'function') b.focus();
      }
    });

    var layoutTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(layoutTimer);
      layoutTimer = window.setTimeout(applyLayout, 150);
    });
    // Some mobile browsers report width late; re-place once after load.
    window.addEventListener('load', function () { setTimeout(applyLayout, 60); });
  })();

  /* ======================================================================
     F. THE COMPOUNDING COST — slider driven bars
     ====================================================================== */
  (function compoundingCost() {
    var slider = $('#timeSlider');
    if (!slider) return;

    var readout = $('#timeReadout');
    var progressFill = $('#progressFill');
    var progressStatus = $('#progressStatus');
    var loopFill = $('#loopFill');
    var loopStatus = $('#loopStatus');
    var loopMeta = $('#loopMeta');
    var ticks = $all('#ticks button');
    var playBtn = $('#playYear');
    var playNote = $('#playNote');

    var YEAR = 365;
    var LOOP_DAYS = 26;          // one comfort loop ≈ 26 days in this picture
    var MAX_PROGRESS = 9;        // percent — deliberately tiny
    var playRaf = null;

    function humanDay(day) {
      if (day === 0) return 'Day 1 — today';
      if (day === YEAR) return 'Day 366 — one year from now';
      if (day < 31) return 'Day ' + (day + 1) + ' — a few weeks on';
      var months = Math.round(day / 30.4);
      return 'Day ' + (day + 1) + ' — about ' + months + (months === 1 ? ' month' : ' months') + ' on';
    }

    function progressStatusFor(pct) {
      if (pct < 2.6) return 'Nothing has happened yet';
      if (pct < 4) return 'Barely moved';
      if (pct < 5.6) return 'Still near the start';
      if (pct < 7.4) return 'A fraction of the way';
      return 'Almost exactly where it was';
    }

    function render() {
      var day = parseInt(slider.value, 10) || 0;
      var t = clamp(day / YEAR, 0, 1);

      // Progress: a long slow creep that never really gets going.
      var pct = 2 + Math.pow(t, 1.35) * (MAX_PROGRESS - 2);
      progressFill.style.width = pct.toFixed(2) + '%';
      progressStatus.textContent = progressStatusFor(pct);

      // Comfort loop: fills, empties, fills, empties — never accumulates.
      var completed = Math.floor(day / LOOP_DAYS);
      var frac = (day % LOOP_DAYS) / LOOP_DAYS;
      var loopPct = day === 0 ? 0 : 4 + frac * 96;
      loopFill.style.width = loopPct.toFixed(2) + '%';
      loopStatus.textContent = day === 0
        ? 'Not started yet'
        : 'Loop ' + (completed + 1) + ' — filling again';
      loopMeta.textContent = 'Loops completed: ' + completed + ' · each one felt like a fresh start';

      readout.textContent = humanDay(day);
      slider.setAttribute('aria-valuetext', humanDay(day));

      ticks.forEach(function (btn) {
        var d = parseInt(btn.getAttribute('data-day'), 10);
        btn.classList.toggle('is-current', Math.abs(d - day) <= 2);
        btn.setAttribute('aria-pressed', Math.abs(d - day) <= 2 ? 'true' : 'false');
      });
    }

    function stopPlay() {
      if (playRaf) { window.cancelAnimationFrame(playRaf); playRaf = null; }
      if (playBtn) {
        playBtn.classList.remove('is-playing');
        playBtn.textContent = 'Watch a year pass';
      }
      if (playNote) playNote.textContent = 'Runs for a few seconds. Touch the slider any time to take over.';
    }

    function startPlay() {
      if (playRaf) { stopPlay(); return; }
      var startVal = parseInt(slider.value, 10) >= YEAR ? 0 : parseInt(slider.value, 10);
      var duration = prefersCalm ? 1200 : 7000;
      var t0 = null;
      playBtn.classList.add('is-playing');
      playBtn.textContent = 'Stop';
      if (playNote) playNote.textContent = 'A year of deferred starts, compressed. Tap Stop any time.';

      function step(ts) {
        if (t0 === null) t0 = ts;
        var k = clamp((ts - t0) / duration, 0, 1);
        var eased = prefersCalm ? k : (1 - Math.pow(1 - k, 1.6));
        slider.value = String(Math.round(startVal + (YEAR - startVal) * eased));
        render();
        if (k < 1) playRaf = window.requestAnimationFrame(step);
        else { playRaf = null; stopPlay(); }
      }
      playRaf = window.requestAnimationFrame(step);
    }

    slider.addEventListener('input', function () { stopPlay(); render(); });
    ticks.forEach(function (btn) {
      btn.addEventListener('click', function () {
        stopPlay();
        slider.value = btn.getAttribute('data-day');
        render();
        slider.focus();
      });
    });
    if (playBtn) playBtn.addEventListener('click', startPlay);
    window.addEventListener('pagehide', stopPlay);

    // With motion reduced, the animated run-through is removed rather than faked.
    if (prefersCalm) {
      var row = $('.play-row');
      if (row) row.hidden = true;
    }

    render();
  })();

  /* ======================================================================
     G. REFLECTION PROMPT — local only, fixed honest reply
     ====================================================================== */
  (function reflection() {
    var form = $('#reflectForm');
    if (!form) return;
    var input = $('#goalInput');
    var error = $('#goalError');
    var namedCard = $('#namedCard');
    var namedText = $('#namedText');
    var reply = $('#fixedReply');
    var editBtn = $('#editAnswer');
    var nameBtn = $('#nameBtn');

    form.addEventListener('submit', function (e) {
      e.preventDefault();               // nothing is ever transmitted
      var value = (input.value || '').trim();

      if (!value) {
        input.classList.add('is-invalid');
        error.hidden = false;
        input.focus();
        return;
      }

      input.classList.remove('is-invalid');
      error.hidden = true;
      namedText.textContent = value;    // textContent: never interpreted as HTML
      namedCard.hidden = false;
      reply.hidden = false;
      nameBtn.textContent = 'Named';

      if (!prefersCalm) {
        var r = reply.getBoundingClientRect();
        if (r.bottom > window.innerHeight + 40) {
          reply.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });

    input.addEventListener('input', function () {
      if (!input.value.trim()) {
        input.classList.remove('is-invalid');
        error.hidden = true;
      }
      if (nameBtn.textContent === 'Named') nameBtn.textContent = 'Name it again';
    });

    if (editBtn) editBtn.addEventListener('click', function () {
      namedCard.hidden = true;
      reply.hidden = true;
      nameBtn.textContent = 'Name it';
      input.focus();
      input.select();
    });
  })();

  /* ======================================================================
     H. "I SHOWED UP TODAY" — device-local tally
     ====================================================================== */
  (function tally() {
    var KEY = 'warmDetour.tally.v1';
    var numberEl = $('#tallyNumber');
    var unitEl = $('#tallyUnit');
    var dotsEl = $('#tallyDots');
    var lineEl = $('#tallyLine');
    var markBtn = $('#showUpBtn');
    var resetBtn = $('#resetTally');
    if (!numberEl || !markBtn) return;

    var storageOK = true;
    var memory = { dates: [] };

    function load() {
      try {
        var raw = window.localStorage.getItem(KEY);
        if (!raw) return { dates: [] };
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.dates)) {
          return { dates: parsed.dates.filter(function (d) { return typeof d === 'string'; }).slice(-400) };
        }
        return { dates: [] };
      } catch (err) {
        storageOK = false;
        return memory;
      }
    }

    function save(data) {
      memory = data;
      if (!storageOK) return false;
      try {
        window.localStorage.setItem(KEY, JSON.stringify(data));
        return true;
      } catch (err) {
        storageOK = false;
        return false;
      }
    }

    function iso(d) {
      var m = ('0' + (d.getMonth() + 1)).slice(-2);
      var day = ('0' + d.getDate()).slice(-2);
      return d.getFullYear() + '-' + m + '-' + day;
    }
    function shift(dateStr, deltaDays) {
      var p = dateStr.split('-');
      var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
      d.setDate(d.getDate() + deltaDays);
      return iso(d);
    }
    function streakOf(dates) {
      if (!dates.length) return 0;
      var set = {};
      dates.forEach(function (d) { set[d] = true; });
      var today = iso(new Date());
      var cursor = set[today] ? today : shift(today, -1);
      if (!set[cursor]) return 0;
      var n = 0;
      while (set[cursor]) { n++; cursor = shift(cursor, -1); }
      return n;
    }

    function lineFor(state) {
      if (!storageOK) {
        return 'This browser is blocking local storage, so the tally can\u2019t be remembered here. ' +
               'The button still works for this visit — nothing is sent anywhere either way.';
      }
      if (state.markedToday) {
        return 'Today is already counted. Nothing more to do here — come back tomorrow and the button will be waiting.';
      }
      if (state.total === 0) {
        return 'Nothing marked yet. One tap a day, for the days you showed up — including the days it was only ten minutes.';
      }
      if (state.streak >= 3) {
        return state.streak + ' days in a row. That is a pattern forming, and patterns are how this gets reversed.';
      }
      if (state.total === 1) {
        return 'One day marked. That is the whole job: show up, tap once, close the tab.';
      }
      return state.total + ' days marked, and every one of them was optional. Keep going.';
    }

    function renderDots(dates) {
      if (!dotsEl) return;
      var set = {};
      dates.forEach(function (d) { set[d] = true; });
      var today = iso(new Date());
      dotsEl.innerHTML = '';
      for (var i = 13; i >= 0; i--) {
        var d = shift(today, -i);
        var dot = document.createElement('span');
        dot.className = 'tally-dot';
        if (set[d]) dot.classList.add('is-on');
        if (i === 0) dot.classList.add('is-today');
        dot.setAttribute('title', d + (set[d] ? ' — marked' : ''));
        dotsEl.appendChild(dot);
      }
    }

    function render(bump) {
      var dates = load().dates;
      var today = iso(new Date());
      var markedToday = dates.indexOf(today) !== -1;
      var total = dates.length;
      var streak = streakOf(dates);

      numberEl.textContent = String(total);
      if (unitEl) unitEl.textContent = total === 1 ? 'day marked' : 'days marked';
      if (bump && !prefersCalm) {
        numberEl.classList.remove('is-bumped');
        void numberEl.offsetWidth;
        numberEl.classList.add('is-bumped');
      }

      markBtn.disabled = markedToday;
      markBtn.textContent = markedToday ? 'Today is already marked' : 'I showed up today';
      markBtn.setAttribute('aria-describedby', 'tallyLine');

      if (lineEl) {
        lineEl.textContent = lineFor({ markedToday: markedToday, total: total, streak: streak });
      }
      renderDots(dates);
    }

    markBtn.addEventListener('click', function () {
      var data = load();
      var today = iso(new Date());
      if (data.dates.indexOf(today) !== -1) { render(false); return; }
      data.dates.push(today);
      data.dates.sort();
      save(data);
      render(true);
    });

    if (resetBtn) resetBtn.addEventListener('click', function () {
      var ok = window.confirm('Reset your tally? This clears the marks stored in this browser on this device. It cannot be undone.');
      if (!ok) return;
      try { window.localStorage.removeItem(KEY); } catch (err) { /* nothing stored */ }
      memory = { dates: [] };
      render(false);
      markBtn.focus();
    });

    // Refresh the state if the page is left open across midnight.
    var lastDay = iso(new Date());
    window.setInterval(function () {
      var now = iso(new Date());
      if (now !== lastDay) { lastDay = now; render(false); }
    }, 60000);

    render(false);
  })();

})();
