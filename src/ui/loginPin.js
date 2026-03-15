import { isValidEmail } from "@/utils/validators.js";
import { createLoginPinUi } from "@/ui/loginPinUi.js";
import { submitPinLogin } from "@/auth/loginPinAuth.js";

// refactor: isolate clear/reset behavior for PIN input lifecycle
function setupClearListener({ pinInput, ui } = {}) {
  const clearPinInput = () => {
    pinInput.value = "";
    ui.render("");
  };

  return { clearPinInput };
}

// refactor: isolate non-submit input/click listener wiring
function setupPinInputListeners({ emailInput, pinInput, pinBoxes, ui } = {}) {
  window.addEventListener("load", () => {
    ui.focusEmail();
  });

  emailInput.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      if (ui.requireValidEmail()) return;
      event.preventDefault();
      ui.shakePin();
      return;
    }

    if (event.key !== "Enter") return;
    event.preventDefault();
    if (ui.requireValidEmail()) ui.focusPin();
  });

  emailInput.addEventListener("input", () => {
    if (ui.hasEmailWarning()) ui.clearEmailWarn();
  });

  emailInput.addEventListener("focus", () => {
    if (ui.hasEmailWarning()) ui.clearEmailWarn();
  });

  pinBoxes.addEventListener("click", () => {
    if (!ui.requireValidEmail()) {
      ui.shakePin();
      return;
    }
    ui.focusPin();
  });

  document.addEventListener("click", (event) => {
    if (ui.clickedInsidePin(event.target) || ui.clickedEmail(event.target)) return;
    if (ui.hasEmailWarning()) ui.clearEmailWarn();
  });

  return { pinInput };
}

// refactor: isolate submit/auth flow from other listener setup
function setupSubmitListener({ emailInput, pinInput, ui, redirectTo, clearPinInput } = {}) {
  pinInput.addEventListener("input", async (event) => {
    if (!ui.requireValidEmail()) {
      clearPinInput();
      ui.setError(false);
      ui.shakePin();
      return;
    }

    const pin = event.target.value.replace(/\D/g, "").slice(0, ui.boxCount);
    event.target.value = pin;
    ui.setError(false);
    ui.render(pin);
    if (pin.length !== ui.boxCount) return;

    const result = await submitPinLogin({
      email: emailInput.value.trim().toLowerCase(),
      pin,
      redirectTo,
    });

    if (result.ok) return;
    ui.setError(true);
    clearPinInput();
    ui.shakePin();
    ui.focusPin();
  });
}

export function initLoginPin({
  emailInputId = "emailInput",
  pinInputId = "pinHiddenInput",
  pinBoxesId = "pinBoxes",
  errorId = "loginError",
  redirectTo = "courses.html",
} = {}) {
  const registeredBanner = document.getElementById("registeredBanner");
  if (registeredBanner && new URLSearchParams(window.location.search).get("registered") === "true") {
    registeredBanner.hidden = false;
  }

  const emailInput = document.getElementById(emailInputId);
  const pinInput = document.getElementById(pinInputId);
  const pinBoxes = document.getElementById(pinBoxesId);
  const errorEl = document.getElementById(errorId);
  const emailHint = document.getElementById("emailHint");
  if (!emailInput || !pinInput || !pinBoxes) return;

  const ui = createLoginPinUi({
    emailInput,
    pinInput,
    pinBoxes,
    errorEl,
    emailHint,
    isValidEmail,
  });

  // refactor: orchestrate split setup helpers from initLoginPin
  const { clearPinInput } = setupClearListener({ pinInput, ui });
  setupPinInputListeners({ emailInput, pinInput, pinBoxes, ui });
  setupSubmitListener({ emailInput, pinInput, ui, redirectTo, clearPinInput });
  ui.render("");
}
