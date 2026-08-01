const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  const darkMode = document.body.classList.contains("dark-mode");
  themeToggle.setAttribute(
    "aria-label",
    darkMode ? "Switch to light mode" : "Switch to dark mode"
  );
});