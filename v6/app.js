/* =========================================================
   The Comfort Trap — app.js
   Plain JavaScript. No libraries, no network requests,
   no analytics. Nothing typed on this page is sent anywhere.
   localStorage is used ONLY for the optional "I showed up
   today" tally, and only on this device.
   ========================================================= */

(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  /* ---------- Reduced motion ---------- */
  var motionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };
  function prefersReducedMotion() {
    return !!motionQuery.matches;
  }

  /* =========================================================
     DRAFT COPY: the five traps.
     Rewrite "voice" (what your brain says) and "truth"
     (what's actually happening) in your own words.
     type: "instant"   = instant-gratification trap
           "disguised" = feels interesting/productive, but is avoidance
     ========================================================= */
  var TRAPS = [
    {
      title: "Just a quick check",
      type: "instant",
      voice: "I'll just look at my phone for a second. I've earned a tiny break before I start.",
      truth:
        "Your brain has learned that this little screen reliably delivers something new and pleasant, instantly. Starting your goal offers nothing that quick — so the quick thing wins. The \u201csecond\u201d rarely stays a second, because each swipe offers another small reward right when the discomfort of starting would come back."
    },
    {
      title: "More research first",
      type: "disguised",
      voice: "I should research this more before I start. I don't want to do it wrong.",
      truth:
        "This is your brain offering you the feeling of progress without the discomfort of real action. It feels responsible because it's dressed up as preparation. Some research genuinely helps — but when you already know enough to take the next small step, more reading becomes a comfortable place to wait."
    },
    {
      title: "I'll feel more ready later",
      type: "instant",
      voice: "I'll start after a snack, a show, a bit of downtime. I'll be in a much better headspace then.",
      truth:
        "Here your brain is trading a small, certain good feeling now for a hard, uncertain one later. It promises that \u201cready\u201d is just around the corner. But the feeling of readiness usually shows up after you begin, not before — so waiting for it can go on for a very long time."
    },
    {
      title: "This is actually fascinating",
      type: "disguised",
      voice: "This other thing is genuinely interesting right now — and honestly, it's kind of related.",
      truth:
        "Your curiosity is real, and that's exactly why this one is so convincing. Your brain borrows genuine interest and points it somewhere easier. There's no rejection, no blank page, no risk of falling short — just the pleasant pull of something new. It doesn't feel like avoiding. It feels like being engaged."
    },
    {
      title: "Let me get organized",
      type: "disguised",
      voice: "First I need the right system — a new app, a clean desk, a proper plan. Then I'll really get going.",
      truth:
        "Setting things up feels like a start, and a little of it can help. But polishing the runway isn't the same as taking off. Your brain gets the satisfaction of order and control, while the actual uncertain, important part stays safely untouched for another day."
    }
  ];

  var TAG_TEXT = {
    instant: "Instant reward",
    disguised: "Disguised as progress"
  };

  /* =========================================================
     1. Drifting dust (canvas, decorative)
     ========================================================= */
  function initDust() {
    var canvas = document.getElementById("dust");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var particles = [];
    var width = 0;
    var height = 0;
    var dpr = 1;
    var rafId = null;

    var COLORS = [
      "236, 233, 227", // soft white
      "236, 233, 227",
      "255, 182, 92", // amber
      "79, 209, 197" // teal
    ];

    function makeParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.3,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(Math.random() * 0.15 + 0.03),
        a: Math.random() * 0.45 + 0.1,
        tw: Math.random() * Math.PI * 2,
        c: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.min(70, Math.floor((width * height) / 16000));
      particles = [];
      for (var i = 0; i < target; i++) particles.push(makeParticle());
      draw(0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var twinkle = 0.65 + 0.35 * Math.sin(t * 0.001 + p.tw);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + p.c + "," + (p.a * twinkle).toFixed(3) + ")";
        ctx.fill();
      }
    }

    function step(t) {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -5) {
          p.y = height + 5;
          p.x = Math.random() * width;
        }
        if (p.x < -5) p.x = width + 5;
        if (p.x > width + 5) p.x = -5;
      }
      draw(t);
      rafId = window.requestAnimationFrame(step);
    }

    function start() {
      stop();
      if (prefersReducedMotion() || document.hidden) {
        draw(0); // static, calm state
        return;
      }
      rafId = window.requestAnimationFrame(step);
    }

    function stop() {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = null;
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resize();
      }, 200);
    });
    document.addEventListener("visibilitychange", start);
    if (motionQuery.addEventListener) motionQuery.addEventListener("change", start);

    resize();
    start();
  }

  /* =========================================================
     2. The two traps
     ========================================================= */
  function initTraps() {
    var list = document.getElementById("trap-list");
    var paths = document.getElementById("paths");
    var progressEl = document.getElementById("paths-progress");
    if (!list || !paths) return;

    var seen = {};

    TRAPS.forEach(function (trap, i) {
      var li = document.createElement("li");
      li.className = "trap";

      var stop = document.createElement("div");
      stop.className = "trap__stop";

      var cardId = "trap-card-" + i;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bubble";
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", cardId);

      var orb = document.createElement("span");
      orb.className = "bubble__orb";
      orb.setAttribute("aria-hidden", "true");

      var text = document.createElement("span");
      text.className = "bubble__text";

      var title = document.createElement("span");
      title.className = "bubble__title";
      title.textContent = trap.title;

      var tag = document.createElement("span");
      tag.className = "bubble__tag" + (trap.type === "disguised" ? " bubble__tag--disguised" : "");
      tag.textContent = TAG_TEXT[trap.type];

      var state = document.createElement("span");
      state.className = "bubble__state";
      state.textContent = "Tap to open";

      text.appendChild(title);
      text.appendChild(tag);
      text.appendChild(state);
      btn.appendChild(orb);
      btn.appendChild(text);
      stop.appendChild(btn);

      var card = document.createElement("div");
      card.className = "trap__card";
      card.id = cardId;
      card.hidden = true;

      var voice = document.createElement("div");
      voice.className = "layer layer--voice";
      var voiceLabel = document.createElement("span");
      voiceLabel.className = "layer__label";
      voiceLabel.textContent = "Your brain says";
      var quote = document.createElement("p");
      quote.className = "layer__quote";
      quote.textContent = "\u201c" + trap.voice + "\u201d";
      voice.appendChild(voiceLabel);
      voice.appendChild(quote);

      var truth = document.createElement("div");
      truth.className = "layer layer--truth";
      var truthLabel = document.createElement("span");
      truthLabel.className = "layer__label";
      truthLabel.textContent = "What's really happening";
      var truthText = document.createElement("p");
      truthText.className = "layer__truth";
      truthText.textContent = trap.truth;
      truth.appendChild(truthLabel);
      truth.appendChild(truthText);

      card.appendChild(voice);
      card.appendChild(truth);

      li.appendChild(stop);
      li.appendChild(card);
      list.appendChild(li);

      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        card.hidden = open;
        state.textContent = open ? "Tap to open again" : "Tap to close";
        if (!open) {
          seen[i] = true;
          btn.classList.add("is-seen");
          updateProgress();
        }
        drawPaths();
      });
    });

    function updateProgress() {
      var count = Object.keys(seen).length;
      if (!progressEl) return;
      progressEl.textContent =
        count === TRAPS.length
          ? "All 5 stops explored. Recognise any of them?"
          : count + " of " + TRAPS.length + " stops explored";
    }

    /* Draw the straight goal line and the winding trap line
       so they always pass through the actual stops. */
    var svg = document.getElementById("paths-svg");
    var goalLine = document.getElementById("goal-line");
    var trapLine = document.getElementById("trap-line");
    var goalStart = document.getElementById("goal-start");
    var goalEnd = document.getElementById("goal-end");
    var endRow = paths.querySelector(".paths__end");

    function drawPaths() {
      if (!svg) return;
      var box = paths.getBoundingClientRect();
      var listBox = list.getBoundingClientRect();
      var goalX = parseFloat(getComputedStyle(paths).getPropertyValue("--goal-x")) || 22;

      var startY = listBox.top - box.top;
      var endY = endRow ? endRow.getBoundingClientRect().top - box.top - 10 : box.height - 10;

      svg.setAttribute("width", String(box.width));
      svg.setAttribute("height", String(box.height));

      // Gradients use pixel units so the perfectly straight goal line still renders
      ["goalGrad", "trapGrad"].forEach(function (id) {
        var g = document.getElementById(id);
        if (g) {
          g.setAttribute("y1", String(startY));
          g.setAttribute("y2", String(endY));
        }
      });

      goalLine.setAttribute("d", "M " + goalX + " " + startY + " L " + goalX + " " + endY);
      goalStart.setAttribute("cx", goalX);
      goalStart.setAttribute("cy", startY);
      goalEnd.setAttribute("cx", goalX);
      goalEnd.setAttribute("cy", endY);

      var points = [{ x: goalX, y: startY }];
      var orbs = list.querySelectorAll(".bubble__orb");
      for (var i = 0; i < orbs.length; i++) {
        var r = orbs[i].getBoundingClientRect();
        points.push({ x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 });
      }
      points.push({ x: box.width * 0.85, y: endY });

      var d = "M " + points[0].x.toFixed(1) + " " + points[0].y.toFixed(1);
      for (var j = 1; j < points.length; j++) {
        var p0 = points[j - 1];
        var p1 = points[j];
        var dy = (p1.y - p0.y) * 0.55;
        d +=
          " C " + p0.x.toFixed(1) + " " + (p0.y + dy).toFixed(1) +
          ", " + p1.x.toFixed(1) + " " + (p1.y - dy).toFixed(1) +
          ", " + p1.x.toFixed(1) + " " + p1.y.toFixed(1);
      }
      trapLine.setAttribute("d", d);
    }

    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        drawPaths();
      }).observe(paths);
    } else {
      window.addEventListener("resize", drawPaths);
    }
    drawPaths();
    // Re-draw once fonts/layout settle
    window.addEventListener("load", drawPaths);
    // The reveal animation moves the block slightly; re-draw after it finishes
    paths.addEventListener("transitionend", drawPaths);
  }

  /* =========================================================
     3. The compounding cost slider
     ========================================================= */
  function initCost() {
    var slider = document.getElementById("time-slider");
    if (!slider) return;
    var output = document.getElementById("time-output");
    var progressFill = document.getElementById("progress-fill");
    var progressValue = document.getElementById("progress-value");
    var loopFill = document.getElementById("loop-fill");
    var loopValue = document.getElementById("loop-value");
    var status = document.getElementById("cost-status");

    var MAX_DAYS = 365;
    var MAX_PROGRESS = 6; // percent reached after a full year of deferring
    var LOOP_DAYS = 12; // one full comfort loop every ~12 days (illustrative)
    var lastLoopFrac = 0;
    var statusTimer;

    function timeLabel(days) {
      if (days === 0) return "Today";
      if (days === 1) return "Tomorrow";
      if (days < 14) return days + " days from now";
      if (days < 60) return Math.round(days / 7) + " weeks from now";
      if (days >= MAX_DAYS) return "One year from now";
      var months = Math.round(days / 30.4);
      if (months >= 12) months = 11;
      return months + (months === 1 ? " month" : " months") + " from now";
    }

    function update() {
      var days = parseInt(slider.value, 10) || 0;
      var pct = (days / MAX_DAYS) * 100;
      slider.style.setProperty("--pct", pct + "%");

      // Progress: creeps up very slightly, flattening over time
      var curve = (1 - Math.exp(-days / 160)) / (1 - Math.exp(-MAX_DAYS / 160));
      var progress = MAX_PROGRESS * curve;
      progressFill.style.transform = "scaleX(" + (progress / 100).toFixed(4) + ")";
      progressValue.textContent = progress.toFixed(1) + "%";

      // Comfort loop: fills, resets, fills, resets…
      var cycles = days / LOOP_DAYS;
      var loops = Math.floor(cycles);
      var frac = cycles - loops;
      if (frac < lastLoopFrac) {
        // Snap back to empty without animating backwards
        loopFill.classList.add("no-anim");
        loopFill.style.transform = "scaleX(" + frac.toFixed(4) + ")";
        void loopFill.offsetWidth; // flush
        loopFill.classList.remove("no-anim");
      } else {
        loopFill.style.transform = "scaleX(" + frac.toFixed(4) + ")";
      }
      lastLoopFrac = frac;
      loopValue.textContent = loops + (loops === 1 ? " loop" : " loops");

      var label = timeLabel(days);
      output.textContent = label;
      slider.setAttribute("aria-valuetext", label);

      // Calm screen-reader summary, only after the reader stops dragging
      clearTimeout(statusTimer);
      statusTimer = setTimeout(function () {
        if (status) {
          status.textContent =
            label + ": progress toward your goal " + progress.toFixed(1) +
            " percent. Comfort loops completed: " + loops + ".";
        }
      }, 600);
    }

    slider.addEventListener("input", update);
    slider.addEventListener("change", update);
    update();
  }

  /* =========================================================
     5a. The reflection prompt (purely local, nothing sent)
     ========================================================= */
  function initReflection() {
    var form = document.getElementById("reflect-form");
    if (!form) return;
    var input = document.getElementById("reflect-input");
    var error = document.getElementById("reflect-error");
    var response = document.getElementById("response");
    var responseText = document.getElementById("response-text");
    var responseCard = document.getElementById("response-card");
    var again = document.getElementById("reflect-again");

    form.addEventListener("submit", function (e) {
      e.preventDefault(); // nothing is submitted anywhere
      var value = input.value.trim();
      if (!value) {
        // DRAFT COPY
        error.textContent = "Take your time. Even a few words is enough.";
        input.focus();
        return;
      }
      error.textContent = "";
      responseText.textContent = value; // textContent = safe, never treated as code
      response.hidden = false;
      responseCard.focus({ preventScroll: true });
      response.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start"
      });
    });

    input.addEventListener("input", function () {
      if (error.textContent && input.value.trim()) error.textContent = "";
    });

    again.addEventListener("click", function () {
      input.value = "";
      response.hidden = true;
      input.focus();
    });
  }

  /* =========================================================
     5b. Optional 10-minute timer (runs only in this tab)
     ========================================================= */
  function initTimer() {
    var display = document.getElementById("timer-display");
    var startBtn = document.getElementById("timer-start");
    var resetBtn = document.getElementById("timer-reset");
    var status = document.getElementById("timer-status");
    if (!display || !startBtn) return;

    var DURATION = 10 * 60 * 1000;
    var remaining = DURATION;
    var endTime = 0;
    var tickId = null;
    var running = false;

    function format(ms) {
      var total = Math.max(0, Math.ceil(ms / 1000));
      var m = Math.floor(total / 60);
      var s = total % 60;
      return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }

    function render() {
      display.textContent = format(remaining);
    }

    function tick() {
      remaining = endTime - Date.now();
      if (remaining <= 0) {
        remaining = 0;
        finish();
        return;
      }
      render();
    }

    function start() {
      running = true;
      endTime = Date.now() + remaining;
      tickId = setInterval(tick, 250);
      startBtn.textContent = "Pause";
      resetBtn.hidden = false;
      display.classList.remove("is-done");
      status.textContent = "Timer started. " + format(remaining) + " remaining.";
    }

    function pause() {
      running = false;
      clearInterval(tickId);
      remaining = endTime - Date.now();
      render();
      startBtn.textContent = "Resume";
      status.textContent = "Timer paused at " + format(remaining) + ".";
    }

    function finish() {
      running = false;
      clearInterval(tickId);
      render();
      display.classList.add("is-done");
      startBtn.textContent = "Another 10 minutes";
      // DRAFT COPY
      status.textContent = "Ten minutes done. However it went, you showed up.";
      display.textContent = "Done";
      remaining = DURATION;
    }

    function reset() {
      running = false;
      clearInterval(tickId);
      remaining = DURATION;
      render();
      display.classList.remove("is-done");
      startBtn.textContent = "Start 10 minutes";
      resetBtn.hidden = true;
      status.textContent = "Timer reset.";
    }

    startBtn.addEventListener("click", function () {
      if (running) pause();
      else start();
    });
    resetBtn.addEventListener("click", reset);
    render();
  }

  /* =========================================================
     5c. "I showed up today" tally — localStorage, this device only
     ========================================================= */
  function initTally() {
    var btn = document.getElementById("tally-btn");
    if (!btn) return;
    var countEl = document.getElementById("tally-count");
    var unitEl = document.getElementById("tally-unit");
    var streakEl = document.getElementById("tally-streak");
    var messageEl = document.getElementById("tally-message");
    var resetBtn = document.getElementById("tally-reset");

    var KEY = "comfortTrap.tally.v1";

    // DRAFT COPY: warm lines shown after tapping the button
    var MESSAGES = [
      "Noted. Small and real beats big and imaginary.",
      "You came back. That's the whole trick, honestly.",
      "Another day you chose the plain path for a while. Well done.",
      "It doesn't have to be impressive. It just has to be real.",
      "Quietly, it's adding up."
    ];

    // Check whether this browser lets us save locally
    var storageOk = (function () {
      try {
        var t = "__ct_test__";
        window.localStorage.setItem(t, t);
        window.localStorage.removeItem(t);
        return true;
      } catch (e) {
        return false;
      }
    })();

    var memoryData = { count: 0, streak: 0, lastDate: null };

    function load() {
      if (!storageOk) return memoryData;
      try {
        var raw = window.localStorage.getItem(KEY);
        if (!raw) return { count: 0, streak: 0, lastDate: null };
        var d = JSON.parse(raw);
        return {
          count: Math.max(0, parseInt(d.count, 10) || 0),
          streak: Math.max(0, parseInt(d.streak, 10) || 0),
          lastDate: typeof d.lastDate === "string" ? d.lastDate : null
        };
      } catch (e) {
        return { count: 0, streak: 0, lastDate: null };
      }
    }

    function save(d) {
      if (!storageOk) {
        memoryData = d;
        return;
      }
      try {
        window.localStorage.setItem(KEY, JSON.stringify(d));
      } catch (e) {
        memoryData = d;
      }
    }

    function dayKey(date) {
      var y = date.getFullYear();
      var m = date.getMonth() + 1;
      var d = date.getDate();
      return y + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d;
    }
    function todayKey() {
      return dayKey(new Date());
    }
    function yesterdayKey() {
      var d = new Date();
      d.setDate(d.getDate() - 1);
      return dayKey(d);
    }

    function render(d) {
      countEl.textContent = String(d.count);
      unitEl.textContent = d.count === 1 ? "day you showed up" : "days you showed up";

      var today = todayKey();
      var streakAlive = d.lastDate === today || d.lastDate === yesterdayKey();
      if (d.count === 0) {
        streakEl.textContent = "";
      } else if (streakAlive && d.streak > 1) {
        streakEl.textContent = d.streak + " days in a row.";
      } else if (!streakAlive) {
        // DRAFT COPY
        streakEl.textContent = "Welcome back. Every return counts. No streak required.";
      } else {
        streakEl.textContent = "";
      }

      if (d.lastDate === today) {
        btn.disabled = true;
        btn.textContent = "Counted for today";
      } else {
        btn.disabled = false;
        btn.textContent = "I showed up today";
      }

      resetBtn.hidden = d.count === 0;
    }

    var data = load();
    render(data);

    if (!storageOk) {
      messageEl.textContent =
        "Heads up: this browser isn't allowing local saving (private mode, perhaps), so your tally will reset when you leave the page.";
    } else if (data.lastDate === todayKey()) {
      messageEl.textContent = "Already counted today. See you tomorrow.";
    }

    btn.addEventListener("click", function () {
      var d = load();
      var today = todayKey();
      if (d.lastDate === today) {
        messageEl.textContent = "Already counted today. See you tomorrow.";
        return;
      }
      d.streak = d.lastDate === yesterdayKey() ? d.streak + 1 : 1;
      d.count += 1;
      d.lastDate = today;
      save(d);
      render(d);
      messageEl.textContent = MESSAGES[(d.count - 1) % MESSAGES.length];

      if (!prefersReducedMotion()) {
        countEl.classList.remove("bump");
        void countEl.offsetWidth;
        countEl.classList.add("bump");
      }
    });

    resetBtn.addEventListener("click", function () {
      var ok = window.confirm("Reset your tally to zero on this device? This can't be undone.");
      if (!ok) return;
      var empty = { count: 0, streak: 0, lastDate: null };
      if (storageOk) {
        try {
          window.localStorage.removeItem(KEY);
        } catch (e) {
          /* ignore */
        }
      }
      memoryData = empty;
      render(empty);
      messageEl.textContent = "Tally reset. A fresh start is still a start.";
      btn.focus();
    });
  }

  /* =========================================================
     Gentle scroll reveals
     ========================================================= */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add("is-visible");
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  /* ---------- Start everything ---------- */
  function init() {
    initReveal();
    initDust();
    initTraps();
    initCost();
    initReflection();
    initTimer();
    initTally();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
