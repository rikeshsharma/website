(function themeToggle() {
  "use strict";

  const themeToggleButton = document.getElementById("themeToggle");
  if (!themeToggleButton) return;

  themeToggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const darkMode = document.body.classList.contains("dark-mode");
    themeToggleButton.setAttribute(
      "aria-label",
      darkMode ? "Switch to light mode" : "Switch to dark mode"
    );
  });
})();
