/* ==========================================================================
   THE COMFORT LOOP — behavior
   Plain JavaScript, no dependencies. Everything runs locally in the browser.
   - Scroll-in reveals (graceful without JS)
   - Hero dust particles (canvas, honors prefers-reduced-motion)
   - Distraction bubbles positioned along the SVG path, detail card
   - "Time passing" slider with two live bars (simple math, no backend)
   - Reflection prompt (nothing is sent or stored)
   - Device-local tally via localStorage (this device only)
   ========================================================================== */

(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- scroll-in reveals ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- hero dust particles ---------- */
  var canvas = document.getElementById('dust');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var dots = [];
    var raf = null;
    var W = 0;
    var H = 0;
    var COLORS = ['95,208,192', '242,166,90', '176,190,204'];

    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeDots() {
      var count = Math.max(16, Math.min(44, Math.round((W * H) / 28000)));
      dots = [];
      for (var i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.6 + Math.random() * 1.6,
          vy: 0.06 + Math.random() * 0.22,
          sway: 0.4 + Math.random() * 1.1,
          phase: Math.random() * Math.PI * 2,
          c: COLORS[Math.floor(Math.random() * COLORS.length)],
          a: 0.1 + Math.random() * 0.28
        });
      }
    }

    function drawDot(d, x, y) {
      ctx.beginPath();
      ctx.arc(x, y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + d.c + ',' + d.a + ')';
      ctx.fill();
    }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      dots.forEach(function (d) { drawDot(d, d.x, d.y); });
    }

    function tick(t) {
      ctx.clearRect(0, 0, W, H);
      dots.forEach(function (d) {
        var x = d.x + Math.sin((t / 1700) * d.sway + d.phase) * 14;
        drawDot(d, x, d.y);
        d.y -= d.vy;
        if (d.y < -4) {
          d.y = H + 4;
          d.x = Math.random() * W;
        }
      });
      raf = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function stopLoop() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    }

    sizeCanvas();
    makeDots();

    if (prefersReduced.matches) {
      drawStatic();
    } else {
      startLoop();
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stopLoop();
        else startLoop();
      });
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        sizeCanvas();
        makeDots();
        if (prefersReduced.matches) drawStatic();
      }, 180);
    });
  }

  /* ---------- the two traps ---------- */
  var TRAPS = [
    {
      type: 'instant',
      tag: 'instant relief',
      voice: '\u201CLet me just check my phone first. One minute, then I\u2019ll start.\u201D',
      truth: 'Your brain is offering a small hit of relief to escape the discomfort of beginning. The discomfort doesn\u2019t leave \u2014 it waits politely until the minute is over, then asks for another minute. The relief is real; so is the loop.'
    },
    {
      type: 'instant',
      tag: 'instant relief',
      voice: '\u201COne more video. This one\u2019s actually relevant to what I\u2019m trying to do.\u201D',
      truth: 'Real information, real interest, zero movement. It\u2019s the feeling of progress without the fact of it \u2014 you end the day informed, no closer, and strangely okay with it. That \u201Cstrangely okay\u201D is the trap working exactly as designed.'
    },
    {
      type: 'disguised',
      tag: 'disguised as productive',
      voice: '\u201CI should really research this more before I start. I want to do it properly.\u201D',
      truth: 'Preparation feels responsible, which makes it almost impossible to feel bad about. But notice: there\u2019s no version of \u201Cenough research\u201D that ends the feeling. At some point, reading becomes a very respectable hiding place.'
    },
    {
      type: 'disguised',
      tag: 'disguised as productive',
      voice: '\u201CThis other idea is genuinely interesting right now. I\u2019ll come back to the goal after.\u201D',
      truth: 'The interest is real \u2014 that\u2019s what makes it such a good exit. Novelty lets your brain be curious without being brave. The original goal waits exactly where you left it: unstarted, still glowing, patient.'
    },
    {
      type: 'instant',
      tag: 'comfort now, effort later',
      voice: '\u201CI work better under pressure. I\u2019ll start tomorrow, when I\u2019m fresh.\u201D',
      truth: 'Your brain is negotiating: all the discomfort today, all the effort billed to a future you who doesn\u2019t get a vote. Tomorrow arrives with the same negotiation, the same warm exits \u2014 and the same comfortable answer.'
    }
  ];

  var brainPath = document.getElementById('brain-path');
  var bubbles = Array.prototype.slice.call(document.querySelectorAll('.bubble'));
  var trapCard = document.getElementById('trap-card');
  var selectedTrap = -1;
  var defaultCardHTML = trapCard ? trapCard.innerHTML : '';

  /* place bubbles exactly on the winding path */
  if (brainPath && bubbles.length) {
    try {
      var L = brainPath.getTotalLength();
      var FRACTIONS = [0.14, 0.33, 0.52, 0.71, 0.89];
      bubbles.forEach(function (b, i) {
        if (i >= FRACTIONS.length) return;
        var pt = brainPath.getPointAtLength(L * FRACTIONS[i]);
        b.style.left = ((pt.x / 1000) * 100).toFixed(2) + '%';
        b.style.top = ((pt.y / 520) * 100).toFixed(2) + '%';
      });
    } catch (err) {
      /* keep CSS fallback positions */
    }
  }

  function renderCard(html) {
    if (!trapCard) return;
    trapCard.innerHTML = html;
    trapCard.classList.remove('swap');
    void trapCard.offsetWidth; /* restart animation */
    trapCard.classList.add('swap');
  }

  function selectTrap(i) {
    if (!trapCard || i >= TRAPS.length) return;

    /* toggle off if the same point is tapped again */
    if (selectedTrap === i) {
      selectedTrap = -1;
      bubbles.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      renderCard(defaultCardHTML);
      return;
    }

    selectedTrap = i;
    bubbles.forEach(function (b, j) {
      b.setAttribute('aria-pressed', String(j === i));
    });

    var t = TRAPS[i];
    renderCard(
      '<p class="trap-tag chip-' + t.type + '">' + t.tag + '</p>' +
      '<blockquote class="trap-voice"><p>' + t.voice + '</p></blockquote>' +
      '<div class="trap-truth"><h3>what\u2019s actually happening</h3><p>' + t.truth + '</p></div>'
    );
  }

  bubbles.forEach(function (b, i) {
    b.addEventListener('click', function () { selectTrap(i); });
  });

  /* ---------- the compounding cost ---------- */
  var timeInput = document.getElementById('time');
  var timeOut = document.getElementById('time-out');
  var goalFill = document.getElementById('goal-fill');
  var loopFill = document.getElementById('loop-fill');
  var goalVal = document.getElementById('goal-val');
  var loopVal = document.getElementById('loop-val');
  var lastLoops = -1;

  function updateCost() {
    if (!timeInput) return;
    var t = timeInput.valueAsNumber / 365;
    if (!isFinite(t)) t = 0;

    /* month readout */
    var months = Math.round(t * 12);
    if (timeOut) {
      timeOut.textContent = months === 0 ? 'Today' : (months === 12 ? 'One year from now' : 'Month ' + months);
    }
    timeInput.setAttribute('aria-valuetext', months === 0 ? 'today' : 'month ' + months + ' of 12');

    /* track fill behind the thumb */
    timeInput.style.setProperty('--p', (t * 100).toFixed(1) + '%');

    /* progress toward the goal: grows only very slightly */
    var goalPct = t * 4.5;
    if (goalFill) goalFill.style.width = goalPct.toFixed(2) + '%';
    if (goalVal) {
      goalVal.textContent = t === 0 ? 'not started' : goalPct.toFixed(1) + '% of the distance \u2014 a sliver';
    }

    /* comfort loops: fill, reset, fill, reset */
    var cycles = t * 6;
    var phase = cycles % 1;
    var loopsDone = Math.floor(cycles);
    if (loopFill) loopFill.style.width = (phase * 100).toFixed(1) + '%';
    if (loopVal) {
      loopVal.textContent = (t === 0) ? 'waiting' : loopsDone + (loopsDone === 1 ? ' loop' : ' loops') + ' completed';
      if (loopsDone > lastLoops && lastLoops >= 0) {
        loopVal.classList.remove('flash');
        void loopVal.offsetWidth;
        loopVal.classList.add('flash');
      }
    }
    lastLoops = loopsDone;
  }

  if (timeInput) {
    timeInput.addEventListener('input', updateCost);
    updateCost();
  }

  /* ---------- the reflection prompt ---------- */
  var reflectForm = document.getElementById('reflect-form');
  var avoidedInput = document.getElementById('avoided');
  var formNote = document.getElementById('form-note');
  var responseBox = document.getElementById('response');
  var reflectField = document.getElementById('reflect-field');

  if (reflectForm && avoidedInput) {
    if (formNote) formNote.hidden = true;

    reflectForm.addEventListener('submit', function (e) {
      e.preventDefault(); /* nothing is ever sent anywhere */

      var value = avoidedInput.value.trim();
      if (!value) {
        if (formNote) formNote.hidden = false;
        avoidedInput.focus();
        return;
      }

      if (formNote) formNote.hidden = true;
      if (reflectField) reflectField.classList.add('glow');

      /* the response below is fixed and identical for everyone */
      if (responseBox) {
        responseBox.hidden = false;
      }
    });
  }

  /* ---------- the tally (device-local only) ---------- */
  var tallyBtn = document.getElementById('tally-btn');
  var tallyCount = document.getElementById('tally-count');
  var storageNote = document.getElementById('storage-note');
  var TALLY_KEY = 'comfort-loop-tally-v1';
  var tally = { count: 0, last: null };
  var storageOk = true;

  try {
    var raw = window.localStorage.getItem(TALLY_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        tally.count = Number(parsed.count) || 0;
        tally.last = typeof parsed.last === 'string' ? parsed.last : null;
      }
    }
  } catch (err) {
    storageOk = false;
  }

  function todayString() {
    try {
      return new Date().toISOString().slice(0, 10);
    } catch (err) {
      return String(Date.now());
    }
  }

  function renderTally() {
    if (!tallyBtn || !tallyCount) return;
    var today = todayString();

    if (tally.last === today) {
      tallyBtn.disabled = true;
      tallyBtn.textContent = 'Marked for today \u2014 see you tomorrow';
    } else {
      tallyBtn.disabled = false;
      tallyBtn.textContent = 'I showed up today';
    }

    if (tally.count <= 0) {
      tallyCount.textContent = 'No days marked yet on this device.';
    } else {
      tallyCount.textContent = tally.count + (tally.count === 1 ? ' day' : ' days') + ' marked on this device.';
    }

    if (!storageOk && storageNote) {
      storageNote.hidden = false;
    }
  }

  if (tallyBtn) {
    tallyBtn.addEventListener('click', function () {
      var today = todayString();
      if (tally.last === today) return;

      tally.count += 1;
      tally.last = today;

      if (storageOk) {
        try {
          window.localStorage.setItem(TALLY_KEY, JSON.stringify(tally));
        } catch (err) {
          storageOk = false;
          if (storageNote) storageNote.hidden = false;
        }
      }

      renderTally();
      tallyCount.classList.remove('bump');
      void tallyCount.offsetWidth;
      tallyCount.classList.add('bump');
    });

    renderTally();
  }
})();
