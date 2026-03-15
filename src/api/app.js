// src/api/app.js
import startClock from "@/utils/time.js";
import startWeather from "@/utils/weather.js";
import { initLoginPin } from "@/ui/loginPin.js";
import { renderBookings } from "@/ui/renderBookings.js";
import { renderAdminBookings } from "@/ui/renderAdminBookings.js";
import { renderCourses } from "@/ui/renderCourses.js";
import { initRegisterUser } from "@/ui/registerUser.js";
import { PAGES } from "@/constants/routes.js";
import {
  clearAuthUser,
  getAuthUser,
  isTeacher,
  redirectForPage,
} from "@/auth/authService.js";

function prefetchPages(pages = []) {
  // refactor: guard prefetch flow to avoid unhandled runtime failures
  try {
    pages.forEach((href) => {
      if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "document";
      link.href = href;
      document.head.appendChild(link);
    });
  } catch (error) {
    console.warn("prefetchPages error:", error);
  }
}

// refactor: split booking navigation visibility into focused function
function applyBookingNavVisibility(root = document, { canSeeAdmin, adminLinksLength } = {}) {
  const bookingLinks = root.querySelectorAll(`a[href$="${PAGES.BOOKING}"]`);
  bookingLinks.forEach((link) => {
    if (canSeeAdmin || adminLinksLength === 0) return;
    link.remove();
  });
}

// refactor: split admin navigation visibility into focused function
function applyAdminNavVisibility(root = document, { canSeeAdmin, isBookingPage } = {}) {
  const adminLinks = root.querySelectorAll(`a[href$="${PAGES.ADMIN}"]`);

  adminLinks.forEach((link) => {
    if (canSeeAdmin) {
      link.hidden = false;
      link.setAttribute("aria-hidden", "false");
      link.tabIndex = 0;
      return;
    }

    link.href = `${PAGES.BOOKING}?view=my`;
    link.textContent = "Mina bokningar";
    link.hidden = false;
    link.setAttribute("aria-hidden", "false");
    link.tabIndex = 0;
    link.classList.toggle("is-active", isBookingPage);

    if (!isBookingPage) {
      link.removeAttribute("aria-current");
      return;
    }

    link.setAttribute("aria-current", "page");
  });
}

function applyRoleNavVisibility(root = document, user) {
  // refactor: compose role visibility from split booking/admin helpers
  const page = window.location.pathname.split("/").pop() || "index.html";
  const canSeeAdmin = isTeacher(user);
  const isBookingPage = page === PAGES.BOOKING;
  const adminLinksLength = root.querySelectorAll(`a[href$="${PAGES.ADMIN}"]`).length;

  applyBookingNavVisibility(root, { canSeeAdmin, adminLinksLength });
  applyAdminNavVisibility(root, { canSeeAdmin, isBookingPage });
}

function initPageElements(root = document) {
  return {
    logoutBtn: root.getElementById("logoutBtn"),
    hasTime: Boolean(root.getElementById("time")),
    hasWeather: Boolean(root.getElementById("weatherIcon") && root.getElementById("temp")),
    hasPinLogin: Boolean(root.getElementById("pinBoxes") && root.getElementById("pinHiddenInput")),
    hasCoursesGrid: Boolean(root.getElementById("coursesGrid")),
    hasBookingsGrid: Boolean(root.getElementById("bookingsGrid")),
    hasAdminBookingsGrid: Boolean(root.getElementById("adminBookingsGrid")),
    hasRegisterForm: Boolean(root.getElementById("registerForm")),
  };
}

function initAuthFlow({ page, authUser, root = document } = {}) {
  const isPublicPage = page === "index.html" || page === PAGES.LOGIN;
  const redirectPath = isPublicPage ? redirectForPage(page, authUser) : null;

  if (redirectPath) {
    window.location.replace(redirectPath);
    return false;
  }

  applyRoleNavVisibility(root, authUser);
  root.body.classList.add("ui-stable");
  return true;
}

function initPrefetch() {
  prefetchPages([PAGES.COURSES, PAGES.BOOKING, PAGES.ADMIN, PAGES.LOGIN, "index.html"]);
}

// refactor: move app bootstrap logic into a single init function
function init() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  const authUser = getAuthUser();
  const pageElements = initPageElements(document);

  if (!initAuthFlow({ page, authUser, root: document })) {
    return;
  }

  if (pageElements.hasTime) startClock("time");
  if (pageElements.hasWeather) startWeather();
  if (pageElements.hasPinLogin) {
    initLoginPin({ redirectTo: PAGES.COURSES });
  }
  if (pageElements.hasCoursesGrid) renderCourses();
  if (pageElements.hasBookingsGrid) renderBookings();
  if (pageElements.hasAdminBookingsGrid) renderAdminBookings();
  if (pageElements.hasRegisterForm) initRegisterUser();

  const { logoutBtn } = pageElements;
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearAuthUser();
      window.location.replace("index.html");
    });
  }

  requestAnimationFrame(() => {
    document.documentElement.classList.remove("js-loading");
    document.documentElement.classList.add("js-ready");
  });

  initPrefetch();
}

init(); // refactor: explicit app entrypoint
