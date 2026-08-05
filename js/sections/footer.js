(function footerSection() {
  "use strict";

  const siteFooter = document.querySelector(".site-footer");
  PortfolioUtils.observeReveal(siteFooter);

  const footerYear = document.getElementById("footerYear");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }
})();
