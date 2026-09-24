/* =========================================================
   THE COMFORT LOOP
   Plain JavaScript only.
   No APIs, no external services, no analytics.
========================================================= */

"use strict";

/* =========================================================
   HELPERS
========================================================= */

function $(selector, parent = document) {
  return parent.querySelector(selector);
}

function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/* =========================================================
   1. INTERACTIVE DISTRACTION BUBBLES
========================================================= */

const distractionBubbles = $$(".distraction-bubble");

distractionBubbles.forEach((bubble) => {
  const cardId = bubble.getAttribute("aria-controls");
  const card = document.getElementById(cardId);

  if (!card) {
    return;
  }

  bubble.addEventListener("click", () => {
    const wasOpen = bubble.getAttribute("aria-expanded") === "true";

    // Close every other bubble/card first.
    distractionBubbles.forEach((otherBubble) => {
      const otherCardId = otherBubble.getAttribute("aria-controls");
      const otherCard = document.getElementById(otherCardId);

      otherBubble.setAttribute("aria-expanded", "false");

      if (otherCard) {
        otherCard.hidden = true;
      }
    });

    // Re-open the selected card unless it was already open.
    if (!wasOpen) {
      bubble.setAttribute("aria-expanded", "true");
      card.hidden = false;

      // Move keyboard users to the revealed card.
      card.setAttribute("tabindex", "-1");
      card.focus({ preventScroll: true });

      // Keep the card visible on smaller screens.
      window.setTimeout(() => {
        const cardRect = card.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        if (cardRect.bottom > viewportHeight - 24) {
          card.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
            block: "nearest"
          });
        }
      }, 50);
    }
  });
});

/* =========================================================
   2. TIME PASSING SLIDER
========================================================= */

const timeSlider = $("#time-slider");
const timeLabel = $("#time-label");
const sliderValue = $("#slider-value");
const progressFill = $("#progress-fill");
const progressPercent = $("#progress-percent");
const loopFill = $("#loop-fill");
const loopCycleLabel = $("#loop-cycle-label");
const sliderCaption = $("#slider-caption");

function getTimeLabel(value) {
  if (value <= 12) {
    return "Today";
  }

  if (value <= 37) {
    return "About 3 months";
  }

  if (value <= 62) {
    return "About 6 months";
  }

  if (value <= 87) {
    return "About 9 months";
  }

  return "One year from now";
}

function getSliderCaption(value) {
  if (value <= 12) {
    return `
      <strong>Draft caption:</strong>
      Right now, the distance between intention and action is still small.
      The next useful move does not need to be dramatic. It just needs to happen.
    `;
  }

  if (value <= 37) {
    return `
      <strong>Draft caption:</strong>
      A few months can contain a surprising number of “later” moments.
      The illustration keeps goal progress deliberately small while the comfort
      loop keeps returning because the same relief is available again.
    `;
  }

  if (value <= 62) {
    return `
      <strong>Draft caption:</strong>
      The loop is repetitive for a reason: avoidance can solve the discomfort
      of this moment without solving the goal itself. The pattern can feel busy
      while the important work stays almost still.
    `;
  }

  if (value <= 87) {
    return `
      <strong>Draft caption:</strong>
      Time does not automatically create momentum. Repeatedly choosing the
      easiest next feeling can leave the goal almost exactly where you left it.
      This is a visual metaphor, not a prediction about your life.
    `;
  }

  return `
    <strong>Draft caption:</strong>
    A year is made of ordinary days. The point is not that every missed day
    becomes a catastrophe. The point is that tiny repeated detours can add up,
    while tiny repeated acts of showing up can add up too.
  `;
}

function updateTimeExperience() {
  const value = Number(timeSlider.value);

  // Illustrative math, intentionally not presented as psychology research.
  const goalProgress = Math.round(8 + (value * 0.12));

  const totalCycles = 8;
  const rawCyclePosition = (value / 100) * totalCycles;

  let currentCycle;
  let phase;

  if (value === 100) {
    currentCycle = totalCycles;
    phase = 1;
  } else {
    currentCycle = Math.floor(rawCyclePosition) + 1;
    phase = rawCyclePosition % 1;
  }

  const loopWidth = 12 + (phase * 82);

  const timeText = getTimeLabel(value);

  timeLabel.textContent = timeText;
  sliderValue.textContent = `${value}%`;

  progressPercent.textContent = `${goalProgress}%`;
  progressFill.style.width = `${goalProgress}%`;

  loopCycleLabel.textContent = `Cycle ${currentCycle}`;
  loopFill.style.width = `${loopWidth}%`;

  sliderCaption.innerHTML = getSliderCaption(value);

  timeSlider.setAttribute("aria-valuenow", String(value));
  timeSlider.setAttribute("aria-valuetext", timeText);
}

timeSlider.addEventListener("input", updateTimeExperience);

updateTimeExperience();

/* =========================================================
   3. REFLECTION FORM
========================================================= */

const reflectionForm = $("#reflection-form");
const goalInput = $("#goal-input");
const reflectionResponse = $("#reflection-response");
const characterNote = $("#character-note");

function updateCharacterCount() {
  characterNote.textContent = `${goalInput.value.length} / 500`;
}

goalInput.addEventListener("input", updateCharacterCount);

reflectionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const trimmedGoal = goalInput.value.trim();

  if (!trimmedGoal) {
    goalInput.focus();
    return;
  }

  // Nothing is transmitted or stored.
  // The textarea itself remains visible so the user's reflection
  // is visually acknowledged without pretending to analyze it.
  reflectionResponse.hidden = false;

  reflectionResponse.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "nearest"
  });
});

/* =========================================================
   4. DEVICE-LOCAL STREAK
========================================================= */

const STREAK_STORAGE_KEY = "comfort-loop-streak-v1";

const streakCountElement = $("#streak-count");
const streakMessageElement = $("#streak-message");
const checkInButton = $("#check-in-button");

function todayKey() {
  // Using ISO date avoids time-of-day complexity for the counter.
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(dateA, dateB) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  const first = new Date(`${dateA}T00:00:00Z`);
  const second = new Date(`${dateB}T00:00:00Z`);

  return Math.round(Math.abs(second - first) / millisecondsPerDay);
}

function readStreak() {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);

    if (!raw) {
      return {
        count: 0,
        lastCheckIn: null
      };
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed.count !== "number" ||
      parsed.count < 0 ||
      (parsed.lastCheckIn !== null && typeof parsed.lastCheckIn !== "string")
    ) {
      return {
        count: 0,
        lastCheckIn: null
      };
    }

    return {
      count: Math.floor(parsed.count),
      lastCheckIn: parsed.lastCheckIn
    };
  } catch (error) {
    // Graceful fallback if localStorage is unavailable or contains bad data.
    return {
      count: 0,
      lastCheckIn: null
    };
  }
}

function saveStreak(streak) {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streak));
    return true;
  } catch (error) {
    return false;
  }
}

function renderStreak(streak) {
  streakCountElement.textContent = String(streak.count);

  if (streak.count === 0) {
    streakMessageElement.textContent = "A tiny start still counts.";
    return;
  }

  if (streak.count === 1) {
    streakMessageElement.textContent = "One day showed up. That's one real vote for the goal.";
    return;
  }

  streakMessageElement.textContent =
    `${streak.count} days of showing up. Keep the next step small enough to begin.`;
}

function initializeStreak() {
  const streak = readStreak();
  renderStreak(streak);
}

checkInButton.addEventListener("click", () => {
  const today = todayKey();
  const current = readStreak();

  if (current.lastCheckIn === today) {
    streakMessageElement.textContent =
      "You've already logged today. Your streak is still here.";
    return;
  }

  let nextCount = 1;

  if (current.lastCheckIn) {
    const gap = daysBetween(current.lastCheckIn, today);

    if (gap === 1) {
      nextCount = current.count + 1;
    }
  }

  const nextStreak = {
    count: nextCount,
    lastCheckIn: today
  };

  const saved = saveStreak(nextStreak);

  renderStreak(nextStreak);

  if (!saved) {
    streakMessageElement.textContent =
      "Logged for this session, but this browser is not allowing local storage.";
  }
});

initializeStreak();

/* =========================================================
   5. EXTRA SAFETY / HONESTY CHECK
========================================================= */

// No forms submit anywhere.
// No fetch(), XMLHttpRequest, navigator.sendBeacon(), analytics,
// third-party scripts, account systems, or external services are used.
// The only persistent browser data is the local streak object above.
