/* =========================================================
   The Comfortable Detour — app.js
   Plain JavaScript. No libraries, no network requests,
   no tracking. The only thing saved is the optional tally
   (in this browser's localStorage, on this device only).
   ========================================================= */

(function () {
  "use strict";

  // Lets CSS know JavaScript is running (enables scroll-reveal effects).
  document.documentElement.classList.add("js");

  var motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reducedMotion() { return !!(motionQuery && motionQuery.matches); }

  /* =======================================================
     1. THE TRAPS
     DRAFT COPY — rewrite "voice" and "truth" in your own words.
     x / y are positions on the winding path (SVG units, 400 x 600).
     ======================================================= */
  var TRAPS = [
    {
      title: "The quick check",
      type: "Instant gratification",
      voice: "\u201cI'll just check my phone for a second. Then I'll start.\u201d",
      truth: "Starting something meaningful feels uncertain, and your brain doesn't love uncertainty. A notification, a feed, a message — these are small, guaranteed rewards. Your brain isn't choosing the phone over your goal; it's choosing a sure little lift over an unsure effort. The \u201csecond\u201d is rarely a second, because every scroll offers another tiny, easy reward.",
      x: 300, y: 450
    },
    {
      title: "More research first",
      type: "Disguised as productive",
      voice: "\u201cI should research this a bit more before I start. I don't want to do it wrong.\u201d",
      truth: "This one is clever. Reading, watching, and gathering information give you the feeling of progress without the discomfort of real action. It feels responsible because it's dressed up as preparation. Some research is useful — but when it keeps replacing the first real attempt, it's comfort wearing a lab coat.",
      x: 68, y: 360
    },
    {
      title: "I've earned a break",
      type: "Instant gratification",
      voice: "\u201cI've had a long day. I deserve a little something first.\u201d",
      truth: "You might genuinely be tired — rest is real and worth protecting. But notice when the reward arrives before the effort, every time. Your brain is offering a pleasant feeling now in exchange for a goal that only pays off later, and \u201cnow\u201d almost always wins that trade. The break isn't the problem; the break that quietly becomes the whole evening is.",
      x: 322, y: 250
    },
    {
      title: "The fascinating side quest",
      type: "Disguised as productive",
      voice: "\u201cOh, this other thing is actually really interesting right now. I'm learning something!\u201d",
      truth: "Your curiosity here is completely real — which is exactly why this trap is so hard to spot. Your brain has found something that feels meaningful, energising, and not at all like avoidance. But notice its timing: it tends to show up right when the real task is about to begin. Genuine interest, borrowed as an escape route.",
      x: 342, y: 169
    },
    {
      title: "Getting organised",
      type: "Disguised as productive",
      voice: "\u201cOnce I set up the perfect system — new app, clean desk, fresh plan — then I'll really get going.\u201d",
      truth: "Organising feels productive, and you get a satisfying sense of order at the end. But it's often a rehearsal for starting rather than starting itself. Your brain gets the reward of \u201cfresh beginning\u201d energy without ever having to face the hard, messy first step. The perfect setup can keep being perfected forever.",
      x: 150, y: 282
    }
  ];

  var bubblesEl = document.getElementById("bubbles");
  var card = document.getElementById("trapCard");
  var cardType = document.getElementById("trapCardType");
  var cardVoice = document.getElementById("trapCardVoice");
  var cardReveal = document.getElementById("trapCardReveal");
  var cardTruth = document.getElementById("trapCardTruth");
  var cardTruthText = document.getElementById("trapCardTruthText");
  var cardClose = document.getElementById("trapCardClose");
  var progressText = document.getElementById("trapsProgress");

  var bubbleButtons = [];
  var seen = {};
  var activeIndex = -1;

  function buildBubbles() {
    if (!bubblesEl) return;
    TRAPS.forEach(function (trap, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "bubble";
      b.textContent = String(i + 1);
      b.style.left = (trap.x / 400 * 100) + "%";
      b.style.top = (trap.y / 600 * 100) + "%";
      b.style.setProperty("--delay", (i * 0.5) + "s");
      b.setAttribute("aria-label", "Trap " + (i + 1) + " of " + TRAPS.length + ": " + trap.title + " (" + trap.type.toLowerCase() + ")");
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-controls", "trapCard");
      b.addEventListener("click", function () {
        if (activeIndex === i) { closeCard(true); } else { openCard(i); }
      });
      bubblesEl.appendChild(b);
      bubbleButtons.push(b);
    });
  }

  function updateProgress() {
    var count = Object.keys(seen).length;
    if (!progressText) return;
    if (count === TRAPS.length) {
      progressText.textContent = "All " + TRAPS.length + " traps explored. Recognise any of them? Most people recognise a few.";
    } else {
      progressText.textContent = count + " of " + TRAPS.length + " traps explored";
    }
  }

  function openCard(i) {
    var trap = TRAPS[i];
    activeIndex = i;
    seen[i] = true;

    bubbleButtons.forEach(function (b, j) {
      b.setAttribute("aria-pressed", j === i ? "true" : "false");
      if (seen[j]) b.classList.add("is-seen");
    });

    cardType.textContent = trap.type + " \u00b7 " + trap.title;
    cardVoice.textContent = trap.voice;
    cardTruthText.textContent = trap.truth;
    cardTruth.hidden = true;
    cardReveal.hidden = false;
    cardReveal.setAttribute("aria-expanded", "false");

    // Restart the entrance animation
    card.hidden = false;
    card.style.animation = "none";
    void card.offsetWidth;
    card.style.animation = "";

    updateProgress();

    try { card.focus({ preventScroll: true }); } catch (e) { card.focus(); }
    scrollIntoViewIfNeeded(card);
  }

  function closeCard(returnFocus) {
    var prev = activeIndex;
    activeIndex = -1;
    card.hidden = true;
    bubbleButtons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    if (returnFocus && prev > -1 && bubbleButtons[prev]) bubbleButtons[prev].focus();
  }

  function scrollIntoViewIfNeeded(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    if (r.top < 0 || r.bottom > vh) {
      el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "nearest" });
    }
  }

  if (cardReveal) {
    cardReveal.addEventListener("click", function () {
      cardTruth.hidden = false;
      cardReveal.hidden = true;
      cardReveal.setAttribute("aria-expanded", "true");
      scrollIntoViewIfNeeded(card);
      // Move focus to the explanation so keyboard/screen-reader users land on it
      cardTruth.setAttribute("tabindex", "-1");
      try { cardTruth.focus({ preventScroll: true }); } catch (e) { cardTruth.focus(); }
    });
  }
  if (cardClose) cardClose.addEventListener("click", function () { closeCard(true); });
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Escape" || e.key === "Esc") && activeIndex > -1) closeCard(true);
  });

  buildBubbles();
  updateProgress();

  /* =======================================================
     2. THE COMPOUNDING COST SLIDER
     Illustrative math only — not real data.
     ======================================================= */
  var slider = document.getElementById("timeSlider");
  var timeValue = document.getElementById("timeValue");
  var progressFill = document.getElementById("progressFill");
  var progressReadout = document.getElementById("progressReadout");
  var loopFill = document.getElementById("loopFill");
  var loopReadout = document.getElementById("loopReadout");
  var costLive = document.getElementById("costLive");

  var LOOP_LENGTH_DAYS = 12; // one "comfort loop" every ~12 days (illustrative)
  var lastStage = -1;

  // DRAFT COPY — the changing line under the bars.
  var STAGES = [
    { max: 0, text: "Move the slider to let time pass." },
    { max: 13, text: "A few days. \u201cI'll start properly next week.\u201d It feels completely reasonable." },
    { max: 59, text: "A few weeks. The loop has spun a handful of times. The goal has barely moved." },
    { max: 179, text: "A few months. Every single cycle felt like a fair choice in the moment." },
    { max: 364, text: "Half a year or more. Lots of motion. Very little distance." },
    { max: 365, text: "A year. Not because you didn't care \u2014 because the detour was always right there, and always comfortable." }
  ];

  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

  function describeTime(days) {
    if (days === 0) return "Today";
    if (days >= 365) return "One year from now";
    if (days < 7) return plural(days, "day") + " from now";
    if (days < 60) return plural(Math.round(days / 7), "week") + " from now";
    return plural(Math.round(days / 30.4), "month") + " from now";
  }

  function updateSlider() {
    if (!slider) return;
    var days = parseInt(slider.value, 10) || 0;
    var ratio = days / 365;

    // Time label
    var label = describeTime(days);
    timeValue.textContent = label;
    slider.setAttribute("aria-valuetext", label);
    slider.style.setProperty("--fill", (ratio * 100) + "%");

    // Goal progress: grows only very slightly across the whole year
    var progress = 0.8 + 5.2 * ratio; // ~1% to ~6% of the bar
    progressFill.style.width = progress.toFixed(2) + "%";
    progressReadout.textContent =
      days < 30 ? "barely started" :
      days < 180 ? "a tiny bit further" :
      "still near the start";

    // Comfort loops: fill, reset, fill, reset...
    var loops = Math.floor(days / LOOP_LENGTH_DAYS);
    var loopProgress = (days % LOOP_LENGTH_DAYS) / LOOP_LENGTH_DAYS * 100;
    if (days > 0 && loopProgress === 0) loopProgress = 100; // show a full bar the moment a loop completes
    loopFill.style.width = loopProgress.toFixed(2) + "%";
    loopReadout.textContent = plural(loops, "loop") + " completed";

    // Changing caption (only updates when the stage changes, so screen readers aren't flooded)
    var stage = 0;
    for (var s = 0; s < STAGES.length; s++) {
      if (days <= STAGES[s].max) { stage = s; break; }
    }
    if (stage !== lastStage) {
      costLive.textContent = STAGES[stage].text;
      lastStage = stage;
    }
  }

  if (slider) {
    slider.addEventListener("input", updateSlider);
    slider.addEventListener("change", updateSlider);
    updateSlider();
  }

  /* =======================================================
     3. REFLECTION PROMPT
     Nothing is sent or saved. The response is fixed and
     identical for everyone.
     ======================================================= */
  var form = document.getElementById("reflectForm");
  var input = document.getElementById("avoidedGoal");
  var errorEl = document.getElementById("reflectError");
  var responseEl = document.getElementById("reflectResponse");
  var namedEl = document.getElementById("reflectNamed");
  var editBtn = document.getElementById("reflectEdit");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault(); // nothing is submitted anywhere
      var text = (input.value || "").trim();
      if (!text) {
        errorEl.textContent = "Whenever you're ready \u2014 even a few words is enough.";
        input.focus();
        return;
      }
      errorEl.textContent = "";
      namedEl.textContent = text; // textContent: shown exactly as typed, never interpreted as code
      responseEl.hidden = false;
      responseEl.style.animation = "none";
      void responseEl.offsetWidth;
      responseEl.style.animation = "";
      try { responseEl.focus({ preventScroll: true }); } catch (err) { responseEl.focus(); }
      responseEl.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    });
  }
  if (editBtn) {
    editBtn.addEventListener("click", function () {
      input.focus();
      input.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
    });
  }

  /* ---------- Optional 10-minute timer (runs only in this tab) ---------- */
  var TIMER_SECONDS = 10 * 60;
  var timerDisplay = document.getElementById("timerDisplay");
  var timerStart = document.getElementById("timerStart");
  var timerReset = document.getElementById("timerReset");
  var timerStatus = document.getElementById("timerStatus");
  var remaining = TIMER_SECONDS;
  var endTime = 0;
  var tickId = null;

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function renderTimer() { timerDisplay.textContent = formatTime(remaining); }

  function tick() {
    remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    renderTimer();
    if (remaining <= 0) {
      stopTicking();
      timerStart.textContent = "Start another 10 minutes";
      timerStatus.textContent = "Ten minutes. However it went \u2014 you showed up for it. That counts.";
      remaining = TIMER_SECONDS;
    }
  }
  function stopTicking() {
    if (tickId) { clearInterval(tickId); tickId = null; }
  }

  if (timerStart) {
    renderTimer();
    timerStart.addEventListener("click", function () {
      if (tickId) {
        // Pause
        stopTicking();
        remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
        renderTimer();
        timerStart.textContent = "Resume";
        timerStatus.textContent = "Paused. No pressure \u2014 pick it back up when you can.";
      } else {
        if (remaining <= 0) remaining = TIMER_SECONDS;
        endTime = Date.now() + remaining * 1000;
        tickId = setInterval(tick, 250);
        renderTimer();
        timerStart.textContent = "Pause";
        timerReset.hidden = false;
        timerStatus.textContent = "Timer running. Just begin \u2014 it doesn't have to be good yet.";
      }
    });
    timerReset.addEventListener("click", function () {
      stopTicking();
      remaining = TIMER_SECONDS;
      renderTimer();
      timerStart.textContent = "Start 10 minutes";
      timerReset.hidden = true;
      timerStatus.textContent = "Timer reset.";
    });
  }

  /* =======================================================
     4. DEVICE-LOCAL TALLY (localStorage)
     Private to this browser on this device. Not an account.
     ======================================================= */
  var STORAGE_KEY = "comfortableDetour.tally.v1";
  var tallyCountEl = document.getElementById("tallyCount");
  var tallyUnitEl = document.getElementById("tallyUnit");
  var tallyButton = document.getElementById("tallyButton");
  var tallyMessage = document.getElementById("tallyMessage");
  var tallyReset = document.getElementById("tallyReset");
  var tallyCountWrap = tallyCountEl ? tallyCountEl.parentNode : null;

  var storageOK = (function () {
    try {
      var k = "__detour_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  })();

  var tally = { count: 0, lastDate: null };

  function todayKey() {
    var d = new Date();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }

  function loadTally() {
    if (!storageOK) return;
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        tally.count = Math.max(0, parseInt(parsed.count, 10) || 0);
        tally.lastDate = typeof parsed.lastDate === "string" ? parsed.lastDate : null;
      }
    } catch (e) { /* ignore broken data */ }
  }

  function saveTally() {
    if (!storageOK) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tally)); } catch (e) { /* storage full or blocked */ }
  }

  // DRAFT COPY — warm lines shown with the tally.
  function tallyLine(n) {
    if (n === 0) return "Whenever you're ready. Showing up counts, however small.";
    if (n === 1) return "One. Honestly, the hardest number to reach.";
    if (n < 5) return "You came back. That matters more than how long you stayed.";
    if (n < 10) return "This is starting to look like a pattern \u2014 the good kind.";
    if (n < 30) return "Quietly, you're building something here.";
    return "Look at that. Day by day, the comfortable detour is losing.";
  }

  function renderTally() {
    if (!tallyCountEl) return;
    tallyCountEl.textContent = String(tally.count);
    tallyUnitEl.textContent = tally.count === 1 ? "day" : "days";
    var doneToday = tally.lastDate === todayKey();
    tallyButton.disabled = doneToday;
    tallyButton.textContent = doneToday ? "Marked for today" : "I showed up today";
    var line = tallyLine(tally.count);
    if (doneToday) line = "Marked for today. " + line + " Come back tomorrow if you like.";
    if (!storageOK) line += " (Your browser isn't allowing local storage right now, so this tally will reset when you leave the page.)";
    tallyMessage.textContent = line;
    tallyReset.hidden = tally.count === 0;
  }

  if (tallyButton) {
    loadTally();
    renderTally();

    tallyButton.addEventListener("click", function () {
      if (tally.lastDate === todayKey()) return; // once per day
      tally.count += 1;
      tally.lastDate = todayKey();
      saveTally();
      renderTally();
      if (tallyCountWrap && !reducedMotion()) {
        tallyCountWrap.classList.remove("bump");
        void tallyCountWrap.offsetWidth;
        tallyCountWrap.classList.add("bump");
      }
    });

    tallyReset.addEventListener("click", function () {
      var ok = window.confirm("Reset your tally to zero? This only affects this browser on this device, and it can't be undone.");
      if (!ok) return;
      tally = { count: 0, lastDate: null };
      if (storageOK) {
        try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      }
      renderTally();
      tallyButton.focus();
    });
  }

  /* =======================================================
     5. SCROLL REVEAL
     ======================================================= */
  var revealEls = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || reducedMotion()) {
    for (var r = 0; r < revealEls.length; r++) revealEls[r].classList.add("is-visible");
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
    for (var q = 0; q < revealEls.length; q++) io.observe(revealEls[q]);
  }

  /* =======================================================
     6. BACKGROUND PARTICLES (canvas, decorative only)
     Static when reduced motion is preferred.
     ======================================================= */
  var canvas = document.getElementById("particles");
  var ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  var particles = [];
  var rafId = null;
  var W = 0, H = 0;

  function makeParticles() {
    var count = Math.min(70, Math.max(24, Math.round((W * H) / 18000)));
    particles = [];
    for (var i = 0; i < count; i++) {
      var warm = Math.random() < 0.45;
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.5 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.04 - Math.random() * 0.12,
        a: 0.15 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        color: warm ? "255,179,92" : "98,214,209"
      });
    }
  }

  function resizeCanvas() {
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeParticles();
    drawParticles(0);
  }

  function drawParticles(t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var twinkle = reducedMotion() ? 1 : 0.6 + 0.4 * Math.sin(t / 1400 + p.phase);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + p.color + "," + (p.a * twinkle).toFixed(3) + ")";
      ctx.fill();
    }
  }

  function step(t) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
    }
    drawParticles(t);
    rafId = window.requestAnimationFrame(step);
  }

  function startParticles() {
    if (!ctx || rafId || reducedMotion() || document.hidden) return;
    rafId = window.requestAnimationFrame(step);
  }
  function stopParticles() {
    if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; }
  }

  if (ctx) {
    resizeCanvas();
    startParticles();

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 200);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopParticles(); else startParticles();
    });
    if (motionQuery) {
      var onMotionChange = function () {
        if (reducedMotion()) { stopParticles(); drawParticles(0); } else { startParticles(); }
      };
      if (motionQuery.addEventListener) motionQuery.addEventListener("change", onMotionChange);
      else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);
    }
  }
})();
