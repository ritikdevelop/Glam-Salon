"use strict";

// Native navigation keeps the full menu available when JavaScript is disabled.
const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector("#main-navigation");
if (menuButton && menu) {
  menuButton.hidden = false;
  document.documentElement.classList.add("nav-ready");
  const closeMenu = () => {
    menu.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  };
  menuButton.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest("header.main-header")) closeMenu();
  });
  const desktop = matchMedia("(min-width: 992px)");
  desktop.addEventListener("change", closeMenu);
}

// The static site has no mail delivery backend: prepare an email honestly.
const contactForm = document.querySelector("#contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const data = new FormData(contactForm);
    const body = [
      "Name: " + data.get("name"),
      "Email: " + data.get("email"),
      "Phone: " + data.get("phone"),
      "",
      data.get("msg"),
    ].join("\n");
    const target =
      "mailto:info@glambeautyandbrows.com.au?subject=" +
      encodeURIComponent(data.get("subject") || "Glam appointment enquiry") +
      "&body=" +
      encodeURIComponent(body);
    const status = document.querySelector("#msgSubmit");
    status.textContent =
      "Your email draft is ready. Send it from your email app. If it does not open, email info@glambeautyandbrows.com.au.";
    window.location.href = target;
  });
}
