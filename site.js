const normalizePath = (path) => {
  const normalized = path.replace(/index\.html$/, "").replace(/\/$/, "");
  return normalized || "/";
};

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