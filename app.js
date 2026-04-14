const slides = Array.from(document.querySelectorAll(".slide"));
const pageCurrent = document.getElementById("pageCurrent");
const pageTotal = document.getElementById("pageTotal");
const progressBar = document.getElementById("progressBar");
const trackLabel = document.getElementById("trackLabel");
const notesPanel = document.getElementById("notesPanel");
const notesContent = document.getElementById("notesContent");
const overview = document.getElementById("overview");
const overviewGrid = document.getElementById("overviewGrid");

const notesToggle = document.getElementById("notesToggle");
const notesClose = document.getElementById("notesClose");
const overviewToggle = document.getElementById("overviewToggle");
const overviewClose = document.getElementById("overviewClose");
const fullscreenToggle = document.getElementById("fullscreenToggle");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");

let currentIndex = 0;
let lastWheelAt = 0;
let touchStartX = null;

pageTotal.textContent = String(slides.length);

slides.forEach((slide, index) => {
  const number = slide.querySelector(".slide-number");
  if (number) {
    const track = slide.dataset.track || "正文";
    number.textContent = `${track} ${String(index + 1).padStart(2, "0")}`;
  }
});

function titleForSlide(slide, index) {
  return slide.dataset.title || slide.querySelector("h1, h2")?.textContent?.trim() || `第 ${index + 1} 页`;
}

function subtitleForSlide(slide) {
  return slide.querySelector(".hero-subtitle, .note-banner, .accent-block, p")?.textContent?.trim() || "";
}

function buildOverview() {
  overviewGrid.innerHTML = "";

  slides.forEach((slide, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "overview-card";
    card.innerHTML = `
      <strong>${slide.dataset.track || "正文"} · ${String(index + 1).padStart(2, "0")}</strong>
      <h3>${titleForSlide(slide, index)}</h3>
      <p>${subtitleForSlide(slide)}</p>
    `;
    card.addEventListener("click", () => {
      goTo(index);
      closeOverview();
    });
    overviewGrid.appendChild(card);
  });
}

function updateNotes() {
  const notesNode = slides[currentIndex].querySelector(".slide-notes");
  notesContent.innerHTML = notesNode ? notesNode.innerHTML : "<p>当前页没有备注。</p>";
}

function updateUI() {
  slides.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === currentIndex);
  });

  pageCurrent.textContent = String(currentIndex + 1);
  progressBar.style.width = `${((currentIndex + 1) / slides.length) * 100}%`;

  const currentSlide = slides[currentIndex];
  trackLabel.textContent = currentSlide.dataset.track || "正文";
  document.title = `${titleForSlide(currentSlide, currentIndex)} · 长护险智能风控与精准支付一体化平台`;
  updateNotes();
}

function goTo(index, options = {}) {
  const safeIndex = Math.max(0, Math.min(index, slides.length - 1));
  currentIndex = safeIndex;
  updateUI();

  if (!options.skipHash) {
    history.replaceState(null, "", `#${safeIndex + 1}`);
  }
}

function next() {
  goTo(currentIndex + 1);
}

function prev() {
  goTo(currentIndex - 1);
}

function openNotes() {
  document.body.classList.add("notes-open");
}

function closeNotes() {
  document.body.classList.remove("notes-open");
}

function toggleNotes() {
  document.body.classList.toggle("notes-open");
}

function openOverview() {
  document.body.classList.add("overview-open");
}

function closeOverview() {
  document.body.classList.remove("overview-open");
}

function toggleOverview() {
  document.body.classList.toggle("overview-open");
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }

  await document.documentElement.requestFullscreen();
}

function parseHash() {
  const value = window.location.hash.replace("#", "").trim();
  const number = Number.parseInt(value, 10);
  if (!Number.isNaN(number) && number >= 1 && number <= slides.length) {
    return number - 1;
  }

  return 0;
}

document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (key === "Escape") {
    closeOverview();
    closeNotes();
    return;
  }

  if (key === " " || key === "ArrowRight" || key === "ArrowDown" || key === "PageDown" || key === "Enter") {
    event.preventDefault();
    next();
    return;
  }

  if (key === "ArrowLeft" || key === "ArrowUp" || key === "PageUp" || key === "Backspace") {
    event.preventDefault();
    prev();
    return;
  }

  if (key === "Home") {
    event.preventDefault();
    goTo(0);
    return;
  }

  if (key === "End") {
    event.preventDefault();
    goTo(slides.length - 1);
    return;
  }

  if (key === "f" || key === "F") {
    event.preventDefault();
    toggleFullscreen();
    return;
  }

  if (key === "n" || key === "N") {
    event.preventDefault();
    toggleNotes();
    return;
  }

  if (key === "o" || key === "O") {
    event.preventDefault();
    toggleOverview();
  }
});

window.addEventListener("wheel", (event) => {
  if (document.body.classList.contains("overview-open")) {
    return;
  }

  if (event.target.closest("#notesPanel")) {
    return;
  }

  const now = Date.now();
  if (now - lastWheelAt < 650) {
    return;
  }

  if (Math.abs(event.deltaY) < 20) {
    return;
  }

  lastWheelAt = now;
  if (event.deltaY > 0) {
    next();
  } else {
    prev();
  }
}, { passive: true });

window.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0]?.clientX ?? null;
}, { passive: true });

window.addEventListener("touchend", (event) => {
  if (touchStartX === null) {
    return;
  }

  const endX = event.changedTouches[0]?.clientX ?? touchStartX;
  const delta = endX - touchStartX;

  if (Math.abs(delta) > 60) {
    if (delta < 0) {
      next();
    } else {
      prev();
    }
  }

  touchStartX = null;
}, { passive: true });

notesToggle.addEventListener("click", toggleNotes);
notesClose.addEventListener("click", closeNotes);
overviewToggle.addEventListener("click", toggleOverview);
overviewClose.addEventListener("click", closeOverview);
fullscreenToggle.addEventListener("click", toggleFullscreen);
prevButton.addEventListener("click", prev);
nextButton.addEventListener("click", next);

window.addEventListener("hashchange", () => {
  goTo(parseHash(), { skipHash: true });
});

buildOverview();
goTo(parseHash(), { skipHash: true });
