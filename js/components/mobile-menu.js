(function mobileMenu() {
  "use strict";

  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");

  if (!navToggle || !primaryNav) return;

  const navItems = Array.from(primaryNav.children);
  navItems.forEach((item, index) => {
    item.style.setProperty("--i", index);
    item.style.setProperty("--ri", navItems.length - 1 - index);
  });

  const closeNav = () => {
    primaryNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  };

  const openNav = () => {
    primaryNav.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
  };

  navToggle.addEventListener("click", () => {
    if (primaryNav.classList.contains("is-open")) {
      closeNav();
    } else {
      openNav();
    }
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#primaryNav") && !event.target.closest("#navToggle")) {
      closeNav();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNav();
    }
  });
})();
