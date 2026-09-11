const normalizePath = (path) => {
  const normalized = path.replace(/index\.html$/, "").replace(/\/$/, "");
  return normalized || "/";
};

const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

if (isIos) {
  document.documentElement.classList.add("is-ios");
}

const matchesCode = (value, expectedCharacters) => {
  if (value.length !== expectedCharacters.length) return false;

  return expectedCharacters.every((character, index) => value.charCodeAt(index) === character);
};

const countdownTarget = Date.parse("2026-09-15T00:00:00-07:00");
const countdownParts = {
  days: document.querySelector("#countdown-days"),
  hours: document.querySelector("#countdown-hours"),
  minutes: document.querySelector("#countdown-minutes"),
  seconds: document.querySelector("#countdown-seconds")
};

const updateCountdown = () => {
  const remaining = Math.max(0, countdownTarget - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (countdownParts.days) {
    countdownParts.days.textContent = String(days).padStart(2, "0");
    countdownParts.hours.textContent = String(hours).padStart(2, "0");
    countdownParts.minutes.textContent = String(minutes).padStart(2, "0");
    countdownParts.seconds.textContent = String(seconds).padStart(2, "0");
  }
};

if (countdownParts.days) {
  updateCountdown();
  window.setInterval(updateCountdown, 1000);
}

const currentPath = normalizePath(window.location.pathname);

document.querySelectorAll(".site-nav a").forEach((link) => {
  const linkPath = normalizePath(new URL(link.href, window.location.href).pathname);

  if (linkPath === currentPath) {
    link.setAttribute("aria-current", "page");
  }
});

const revealItems = document.querySelectorAll(
  ".home-copy, .feature-intro, .feature-item, .members-intro, .member-card, .yoruichi-section"
);

if ("IntersectionObserver" in window) {
  document.documentElement.classList.add("has-reveal");

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const yoruichiLink = document.querySelector(".yoruichi-link");
const accessModal = document.querySelector("#yoruichi-modal");

if (yoruichiLink && accessModal) {
  const accessForm = accessModal.querySelector(".access-form");
  const accessInput = accessModal.querySelector("#access-code");
  const accessError = accessModal.querySelector(".access-error");
  const closeAccess = () => {
    accessModal.hidden = true;
    accessError.textContent = "";
    accessInput.value = "";
  };

  yoruichiLink.addEventListener("click", (event) => {
    event.preventDefault();
    accessModal.hidden = false;
    accessInput.focus();
  });

  accessForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (matchesCode(accessInput.value, [121, 111, 114, 117, 105, 99, 104, 105, 103, 111, 116, 121, 97, 109, 115])) {
      sessionStorage.setItem("magikasYoruichiAccess", "granted");
      window.location.href = yoruichiLink.href;
      return;
    }

    accessError.textContent = "INCORRECT CODE. TRY AGAIN.";
    accessInput.select();
  });

  accessModal.querySelector(".access-close").addEventListener("click", closeAccess);
  accessModal.addEventListener("click", (event) => {
    if (event.target === accessModal) closeAccess();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !accessModal.hidden) closeAccess();
  });
}

const launchAccessLink = document.querySelector(".launch-access-link");
const launchModal = document.querySelector("#launch-modal");

if (launchAccessLink && launchModal) {
  const launchForm = launchModal.querySelector(".access-form");
  const launchInput = launchModal.querySelector("#launch-access-code");
  const launchError = launchModal.querySelector(".access-error");
  const closeLaunchAccess = () => {
    launchModal.hidden = true;
    launchAccessLink.setAttribute("aria-expanded", "false");
    launchError.textContent = "";
    launchInput.value = "";
  };

  launchAccessLink.addEventListener("click", () => {
    launchModal.hidden = false;
    launchAccessLink.setAttribute("aria-expanded", "true");
    launchInput.focus();
  });

  launchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (matchesCode(launchInput.value, [109, 97, 103, 105, 107, 97, 115, 102, 97, 116, 101, 100, 97, 115, 99, 101, 110, 115, 105, 111, 110])) {
      window.location.href = "test-dev.html";
      return;
    }

    launchError.textContent = "INCORRECT CODE. TRY AGAIN.";
    launchInput.select();
  });

  launchModal.querySelector(".access-close").addEventListener("click", closeLaunchAccess);
  launchModal.addEventListener("click", (event) => {
    if (event.target === launchModal) closeLaunchAccess();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !launchModal.hidden) closeLaunchAccess();
  });
}