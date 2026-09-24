/* ═══════════════════════════════════════════════════════════
   The Ten-Minute Door — app.js
   Plain JavaScript, no dependencies.
   localStorage is used ONLY for the device-local show-up tally.
   Nothing on this page is ever sent anywhere.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ── 1 · film grain (generated, no image file) ─────────────── */
  (function grain() {
    var host = $('.grain');
    if (!host) return;
    try {
      var c = document.createElement('canvas');
      c.width = 120; c.height = 120;
      var ctx = c.getContext('2d');
      var img = ctx.createImageData(120, 120);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = Math.floor(Math.random() * 255);
        img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      host.style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
    } catch (e) { /* texture is decorative — fine to skip */ }
  })();

  /* ── 2 · scroll reveals ─────────────────────────────────────── */
  (function reveals() {
    var els = $all('.reveal');
    if (!motionOK || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ── 3 · drifting motes in the hero ─────────────────────────── */
  (function motes() {
    var cv = $('#motes');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var hero = cv.parentElement;
    var W = 0, H = 0, ps = [], raf = null;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);

    function make() {
      var n = Math.max(24, Math.min(70, Math.floor(W / 16)));
      ps = [];
      for (var i = 0; i < n; i++) {
        ps.push({
          x: Math.random() * W, y: Math.random() * H,
          r: 0.6 + Math.random() * 1.5,
          vx: (Math.random() - 0.5) * 0.14,
          vy: (Math.random() - 0.5) * 0.12,
          a: 0.15 + Math.random() * 0.5,
          c: Math.random() < 0.72 ? '111,211,199' : '246,164,91'
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + p.c + ',' + (p.a * 0.22) + ')';
        ctx.arc(p.x, p.y, p.r * 3.4, 0, 6.2832);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')';
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }
    }
    function step() {
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -8) p.x = W + 8; if (p.x > W + 8) p.x = -8;
        if (p.y < -8) p.y = H + 8; if (p.y > H + 8) p.y = -8;
      }
      draw();
      raf = requestAnimationFrame(step);
    }
    function resize() {
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = W * DPR; cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      make();
      if (!motionOK) draw();
    }
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(resize, 150);
    });
    resize();
    if (motionOK) {
      step();
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
        else if (!raf) step();
      });
    }
  })();

  /* ── 4 · the two traps ──────────────────────────────────────── */
  /* ✏️ DRAFT COPY — all five trap texts. Rewrite in your own voice. */
  var TRAPS = [
    {
      kind: 'Instant reward', dashed: false, name: 'The Quick Hit',
      voice: 'I deserve one little reward before I start. One quick scroll, one snack, one episode — then I’ll be in a better mood to begin.',
      truth: 'Your brain is buying a guaranteed good feeling now, in exchange for a start that keeps sliding five minutes away. The hit isn’t rest — it’s anesthesia. Notice how “just one” almost never ends in beginning.'
    },
    {
      kind: 'Instant reward', dashed: false, name: 'The Fresh Start',
      voice: 'I’ll start tomorrow morning. Clean slate, full energy — tomorrow-me is going to crush this.',
      truth: 'This is your brain handing the discomfort to a stranger. Future-you feels like a different person, so the cost feels free. But tomorrow never arrives as tomorrow — it arrives as today, held by the same brain that postponed it.'
    },
    {
      kind: 'Disguised as productive', dashed: true, name: 'The Research Spiral',
      voice: 'I should research this more before I start. I want to do it properly — one more article, one more video, and then I’ll be ready.',
      truth: 'This is your brain offering the feeling of progress without the risk of real action. Research is open-ended and safe; making the thing is finite and can be judged. That’s why it feels responsible — it’s dressed up as preparation.'
    },
    {
      kind: 'Disguised as interest', dashed: true, name: 'The Shiny Side-Quest',
      voice: 'Oh — this other thing is actually really interesting right now. It matters too. Maybe I should follow it instead.',
      truth: 'The interest is real — that’s the camouflage. Novelty lights up genuine curiosity, which makes it hard to see as avoidance. The tell isn’t the feeling; it’s the timing. It always seems to flare right before the uncomfortable step.'
    },
    {
      kind: 'Disguised as productive', dashed: true, name: 'The Tidy-Up',
      voice: 'Let me just get organized first. Clean desk, right notes, perfect playlist — then I’ll actually be ready to focus.',
      truth: 'This is arranging the perimeter instead of touching the work. Tidying gives a sense of control that the real task withholds. “Ready” keeps moving, because as long as the setup isn’t finished, starting can’t fail.'
    }
  ];

  (function traps() {
    var card = $('#trap-card');
    var btns = $all('.trap-btn');
    var dots = $all('.trap-dots span');
    var counter = $('#trap-count');
    if (!card || !btns.length) return;

    var seen = {};
    var seenCount = 0;

    function select(i) {
      btns.forEach(function (b, j) {
        b.setAttribute('aria-pressed', j === i ? 'true' : 'false');
      });
      var t = TRAPS[i];
      if (!seen[i]) {
        seen[i] = true; seenCount++;
        btns[i].classList.add('seen');
        if (dots[i]) dots[i].classList.add('seen');
        counter.textContent = seenCount + ' of 5 examined';
      }

      var html =
        '<div class="trap-head">' +
          '<span class="kind-chip' + (t.dashed ? ' dashed' : '') + '">' + t.kind + '</span>' +
          '<h3>Trap ' + (i + 1) + ' of 5 · ' + t.name + '</h3>' +
        '</div>' +
        '<div class="trap-voice">' +
          '<p class="layer-label">What it sounds like inside</p>' +
          '<blockquote>“' + t.voice + '”</blockquote>' +
        '</div>' +
        '<div class="trap-truth">' +
          '<p class="layer-label">What’s actually happening</p>' +
          '<p>' + t.truth + '</p>' +
        '</div>';

      if (seenCount === 5) {
        html += '<p class="trap-allseen">All five seen. Notice how reasonable they sound — that’s the disguise working.</p>';
      }

      card.innerHTML = html;
      card.classList.remove('swap');
      void card.offsetWidth; /* restart the entrance animation */
      card.classList.add('swap');

      if (window.innerWidth < 760) {
        card.scrollIntoView({ block: 'nearest', behavior: motionOK ? 'smooth' : 'auto' });
      }
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        select(parseInt(b.getAttribute('data-i'), 10));
      });
    });
  })();

  /* ── 5 · the compounding cost slider ────────────────────────── */
  (function cost() {
    var slider = $('#time-range');
    if (!slider) return;
    var read = $('#time-read');
    var progFill = $('#prog-fill'), progVal = $('#prog-val');
    var loopFill = $('#loop-fill'), loopVal = $('#loop-val'), loopRow = $('#loop-row');
    var sub = $('#cost-sub');

    var LOOP_DAYS = 9;
    var prevLoops = 0;

    /* ✏️ DRAFT COPY — the shifting one-liner under the slider */
    var SUBS = {
      early: 'A week or two of loops barely registers. That quietness is what makes it dangerous.',
      mid:   'Months of loops feel like busy fog. The goal doesn’t shrink because it’s hard — it shrinks because it’s unvisited.',
      late:  'A year of loops is still just loops. But loops can be interrupted — you’ve already seen how they work.'
    };

    function fmtDay(v) {
      if (v === 0) return 'Today';
      if (v >= 365) return 'One year from now';
      if (v < 30) return 'Day ' + v;
      return 'Day ' + v + ' · about ' + Math.round(v / 30.4) + ' months';
    }

    function update() {
      var v = parseInt(slider.value, 10);
      slider.setAttribute('aria-valuetext', 'Day ' + v + ' of 365');
      slider.style.setProperty('--fill', (v / 365 * 100) + '%');
      read.textContent = fmtDay(v);

      /* progress creeps — deliberately almost nothing */
      var pct = Math.pow(v / 365, 1.12) * 6.4;
      progFill.style.width = pct + '%';
      progVal.textContent = pct.toFixed(1) + '%';

      /* comfort loop: fills, resets, fills, resets */
      var loops = Math.floor(v / LOOP_DAYS);
      var phase = (v % LOOP_DAYS) / LOOP_DAYS;
      loopFill.style.width = (phase * 100) + '%';
      loopVal.textContent = v === 0
        ? 'loop 0'
        : 'loop ' + (loops + 1) + ' · ' + Math.round(phase * 100) + '% full';

      if (loops > prevLoops && motionOK) {
        loopRow.classList.add('flash');
        setTimeout(function () { loopRow.classList.remove('flash'); }, 260);
      }
      prevLoops = loops;

      sub.textContent = v === 0 ? '' : (v < 30 ? SUBS.early : v < 180 ? SUBS.mid : SUBS.late);
    }

    slider.addEventListener('input', update);
    update();
  })();

  /* ── 6 · the reflection prompt ──────────────────────────────── */
  (function reflection() {
    var form = $('#reflect-form');
    if (!form) return;
    var input = $('#goal-input');
    var hint = $('#field-hint');
    var out = $('#reflect-out');
    var submitWrap = $('#field-submit-wrap');
    var editLink = $('#edit-link');

    form.addEventListener('submit', function (e) {
      e.preventDefault(); /* nothing is ever sent anywhere */
      var val = input.value.trim();
      if (!val) {
        hint.textContent = 'Even one small word counts — try naming the tiniest piece.';
        input.focus();
        return;
      }
      hint.textContent = '';

      out.innerHTML = '';
      var named = document.createElement('div');
      named.className = 'named';
      var nl = document.createElement('p');
      nl.className = 'layer-label';
      nl.textContent = 'What you named';
      var nt = document.createElement('p');
      nt.className = 'named-text';
      nt.textContent = '“' + val + '”'; /* textContent = never interpreted as HTML */
      named.appendChild(nl); named.appendChild(nt);

      var nudge = document.createElement('div');
      nudge.className = 'nudge';
      var gl = document.createElement('p');
      gl.className = 'layer-label';
      gl.textContent = 'The same nudge, for everyone';
      var gt = document.createElement('p');
      gt.className = 'nudge-text';
      /* ✏️ DRAFT COPY — the fixed closing response */
      gt.textContent = 'Named. That’s the first honest moment. Now — not tomorrow, not after one more thing — can you give it ten minutes, right now?';
      var gn = document.createElement('p');
      gn.className = 'nudge-note';
      gn.textContent = 'This reply is identical for every visitor on purpose — it’s a prompt to act on, not a reading of what you typed.';
      nudge.appendChild(gl); nudge.appendChild(gt); nudge.appendChild(gn);

      out.appendChild(named);
      out.appendChild(nudge);
      out.classList.remove('pop');
      void out.offsetWidth;
      out.classList.add('pop');

      input.readOnly = true;
      input.setAttribute('aria-disabled', 'true');
      submitWrap.hidden = true;
      editLink.hidden = false;
    });

    editLink.addEventListener('click', function () {
      input.readOnly = false;
      input.removeAttribute('aria-disabled');
      submitWrap.hidden = false;
      editLink.hidden = true;
      input.focus();
    });
  })();

  /* ── 7 · the device-local show-up tally ─────────────────────── */
  (function streak() {
    var KEY = 'tmd.showups.v1';
    var numEl = $('#streak-num'), btn = $('#streak-btn');
    var line = $('#streak-line'), note = $('#streak-note');
    var resetBtn = $('#streak-reset');
    if (!btn) return;

    var store = { count: 0, last: null };
    var storageOK = true;

    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && typeof d.count === 'number') store = d;
      }
    } catch (e) { storageOK = false; }

    function save() {
      if (!storageOK) return;
      try { localStorage.setItem(KEY, JSON.stringify(store)); }
      catch (e) {
        storageOK = false;
        note.textContent = 'Heads-up: this browser won’t let the tally persist, so it will only count for this visit.';
      }
    }

    function todayStr() {
      var d = new Date();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return d.getFullYear() + '-' + m + '-' + day;
    }

    /* ✏️ DRAFT COPY — the warm acknowledgement lines */
    function warmLine(n, countedToday) {
      if (countedToday) return 'That’s today, counted. Come back tomorrow — same door.';
      if (n === 0) return 'Nothing counted yet. The first one is the smallest, most important step.';
      if (n === 1) return 'One. That’s honestly the hardest one.';
      if (n < 5) return n + ' show-ups. Momentum is just showing up, repeated.';
      return n + ' show-ups. That’s not nothing — that’s the whole thing, slowly.';
    }

    function render() {
      var today = todayStr();
      var done = store.last === today;
      numEl.textContent = store.count;
      btn.disabled = done;
      btn.textContent = done ? 'Counted — see you tomorrow ✓' : 'I showed up today';
      line.textContent = warmLine(store.count, done);
      if (!storageOK) {
        note.textContent = 'Heads-up: this browser won’t let the tally persist, so it will only count for this visit.';
      }
    }

    btn.addEventListener('click', function () {
      var today = todayStr();
      if (store.last === today) return;
      store.count += 1;
      store.last = today;
      save();
      render();
    });

    resetBtn.addEventListener('click', function () {
      if (!window.confirm('Start your tally over? This clears the number saved on this device.')) return;
      store.count = 0;
      store.last = null;
      save();
      render();
    });

    render();
  })();

  /* footer year */
  var yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

})();