(function contactForm() {
  "use strict";

  const contactSection = document.querySelector(".contact");
  PortfolioUtils.observeReveal(contactSection);

  const contactFormEl = document.getElementById("contactForm");
  if (!contactFormEl) return;

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

  const contactHistory = document.getElementById("contactHistory");
  const contactHistoryToggle = document.getElementById("contactHistoryToggle");
  const contactHistoryPopover = document.getElementById("contactHistoryPopover");
  const contactHistoryLoad = document.getElementById("contactHistoryLoad");
  const contactHistoryName = document.getElementById("contactHistoryName");
  const contactHistoryEmail = document.getElementById("contactHistoryEmail");
  const contactHistoryMessage = document.getElementById("contactHistoryMessage");

  /*
    `hidden` and the enter/exit transition have to be sequenced by hand:
    `display: none` can't be transitioned out of, so the element is un-hidden
    a frame before it animates in, and stays in the tree until its exit
    finishes. Kept in sync with the transition response in
    css/sections/contact.css.
  */
  const POPOVER_EXIT_MS = 200;
  let popoverExitTimer = null;

  const closeHistoryPopover = () => {
    if (contactHistoryPopover.hidden) return;
    contactHistoryPopover.classList.remove("is-open");
    contactHistoryToggle.setAttribute("aria-expanded", "false");
    popoverExitTimer = window.setTimeout(() => {
      contactHistoryPopover.hidden = true;
    }, POPOVER_EXIT_MS);
  };

  const openHistoryPopover = () => {
    window.clearTimeout(popoverExitTimer);
    contactHistoryPopover.hidden = false;
    /* Read a layout value to flush the un-hidden state, so the browser has a
       closed frame to animate *from* rather than starting at the open one. */
    void contactHistoryPopover.offsetWidth;
    contactHistoryPopover.classList.add("is-open");
    contactHistoryToggle.setAttribute("aria-expanded", "true");
  };

  const isHistoryPopoverOpen = () =>
    contactHistoryPopover.classList.contains("is-open");

  const readContactHistory = () => {
    try {
      const raw = localStorage.getItem(PortfolioConfig.CONTACT_HISTORY_STORAGE_KEY);
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
      localStorage.setItem(PortfolioConfig.CONTACT_HISTORY_STORAGE_KEY, JSON.stringify(entry));
    } catch (error) {
      /* localStorage unavailable (e.g. private browsing) — history just won't persist */
    }
    renderContactHistory(entry);
  };

  renderContactHistory(readContactHistory());

  contactHistoryToggle.addEventListener("click", () => {
    if (isHistoryPopoverOpen()) {
      closeHistoryPopover();
    } else {
      openHistoryPopover();
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

  contactFormEl.addEventListener("submit", (event) => {
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
    contactFormEl.reset();
    Object.values(contactFields).forEach((field) => clearFieldError(field));
  });
})();
