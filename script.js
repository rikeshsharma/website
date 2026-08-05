const navToggle = document.getElementById("navToggle");
const primaryNav = document.getElementById("primaryNav");

if (navToggle && primaryNav) {
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
}

const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  const darkMode = document.body.classList.contains("dark-mode");
  themeToggle.setAttribute(
    "aria-label",
    darkMode ? "Switch to light mode" : "Switch to dark mode"
  );
});

const projectsGrid = document.querySelector(".projects-grid");

if (projectsGrid) {
  const gridObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  gridObserver.observe(projectsGrid);

  projectsGrid.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", () => {
      const wasOpen = card.classList.contains("is-open");
      projectsGrid
        .querySelectorAll(".project-card.is-open")
        .forEach((open) => open.classList.remove("is-open"));
      if (!wasOpen) {
        card.classList.add("is-open");
      }
    });
  });
}

const aboutSection = document.querySelector(".about");

if (aboutSection) {
  const aboutObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  aboutObserver.observe(aboutSection);
}

const contactSection = document.querySelector(".contact");

if (contactSection) {
  const contactObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  contactObserver.observe(contactSection);
}

const siteFooter = document.querySelector(".site-footer");

if (siteFooter) {
  const footerObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  footerObserver.observe(siteFooter);
}

const footerYear = document.getElementById("footerYear");
if (footerYear) {
  footerYear.textContent = new Date().getFullYear();
}

const contactForm = document.getElementById("contactForm");

if (contactForm) {
  const contactFields = {
    name: {
      input: document.getElementById("contactName"),
      error: document.getElementById("contactNameError"),
      message: "Please enter your name.",
    },
    email: {
      input: document.getElementById("contactEmail"),
      error: document.getElementById("contactEmailError"),
      message: "Please enter a valid email address.",
    },
    message: {
      input: document.getElementById("contactMessage"),
      error: document.getElementById("contactMessageError"),
      message: "Please enter a message.",
    },
  };
  const contactStatus = document.getElementById("contactFormStatus");

  const CONTACT_HISTORY_KEY = "contactHistory";

  const contactHistory = document.getElementById("contactHistory");
  const contactHistoryToggle = document.getElementById("contactHistoryToggle");
  const contactHistoryPopover = document.getElementById("contactHistoryPopover");
  const contactHistoryLoad = document.getElementById("contactHistoryLoad");
  const contactHistoryName = document.getElementById("contactHistoryName");
  const contactHistoryEmail = document.getElementById("contactHistoryEmail");
  const contactHistoryMessage = document.getElementById("contactHistoryMessage");

  const closeHistoryPopover = () => {
    contactHistoryPopover.hidden = true;
    contactHistoryToggle.setAttribute("aria-expanded", "false");
  };

  const openHistoryPopover = () => {
    contactHistoryPopover.hidden = false;
    contactHistoryToggle.setAttribute("aria-expanded", "true");
  };

  const readContactHistory = () => {
    try {
      const raw = localStorage.getItem(CONTACT_HISTORY_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  };

  const renderContactHistory = (entry) => {
    if (!entry) {
      contactHistory.hidden = true;
      return;
    }
    contactHistoryName.textContent = entry.name;
    contactHistoryEmail.textContent = entry.email;
    contactHistoryMessage.textContent = entry.message;
    contactHistory.hidden = false;
  };

  const saveContactHistory = (entry) => {
    try {
      localStorage.setItem(CONTACT_HISTORY_KEY, JSON.stringify(entry));
    } catch (error) {
      /* localStorage unavailable (e.g. private browsing) — history just won't persist */
    }
    renderContactHistory(entry);
  };

  renderContactHistory(readContactHistory());

  contactHistoryToggle.addEventListener("click", () => {
    if (contactHistoryPopover.hidden) {
      openHistoryPopover();
    } else {
      closeHistoryPopover();
    }
  });

  document.addEventListener("click", (event) => {
    if (!contactHistory.contains(event.target)) {
      closeHistoryPopover();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeHistoryPopover();
    }
  });

  contactHistoryLoad.addEventListener("click", () => {
    const entry = readContactHistory();
    if (!entry) return;
    contactFields.name.input.value = entry.name;
    contactFields.email.input.value = entry.email;
    contactFields.message.input.value = entry.message;
    Object.values(contactFields).forEach((field) => clearFieldError(field));
    closeHistoryPopover();
    contactFields.name.input.focus();
  });

  const clearFieldError = (field) => {
    field.input.classList.remove("is-invalid");
    field.input.removeAttribute("aria-invalid");
    field.error.textContent = "";
  };

  const setFieldError = (field) => {
    field.input.classList.add("is-invalid");
    field.input.setAttribute("aria-invalid", "true");
    field.error.textContent = field.message;
  };

  const validateField = (field) => {
    const value = field.input.value.trim();
    const isValid = value !== "" && field.input.checkValidity();
    if (isValid) {
      clearFieldError(field);
    } else {
      setFieldError(field);
    }
    return isValid;
  };

  Object.values(contactFields).forEach((field) => {
    field.input.addEventListener("input", () => clearFieldError(field));
  });

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    contactStatus.textContent = "";

    let firstInvalid = null;
    let allValid = true;

    Object.values(contactFields).forEach((field) => {
      const isValid = validateField(field);
      if (!isValid) {
        allValid = false;
        firstInvalid = firstInvalid || field.input;
      }
    });

    if (!allValid) {
      firstInvalid.focus();
      return;
    }

    const name = contactFields.name.input.value.trim();
    const email = contactFields.email.input.value.trim();
    const message = contactFields.message.input.value.trim();

    const subject = `[Website] ${name}'s message for Rikesh`;
    const body = `Message:\n${message}\n\nThanks and Regards\n${name}\n${email}\n`;
    const mailtoLink = `mailto:rikeshsharma777@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;
    contactStatus.textContent = "Opening your email client…";

    saveContactHistory({ name, email, message });
    contactForm.reset();
    Object.values(contactFields).forEach((field) => clearFieldError(field));
  });
}