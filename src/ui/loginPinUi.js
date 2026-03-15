// refactor: extract PIN masking setup into a focused helper
function setupPinMask({ maskTimeouts } = {}) {
  function maskWithFade(box, span) {
    box.classList.add("is-masking");
    setTimeout(() => {
      span.textContent = "•";
      requestAnimationFrame(() => {
        box.classList.remove("is-masking");
      });
    }, 120);
  }

  function clearMaskTimeout(index) {
    if (!maskTimeouts[index]) return;
    clearTimeout(maskTimeouts[index]);
    maskTimeouts[index] = null;
  }

  return { maskWithFade, clearMaskTimeout };
}

// refactor: extract PIN box rendering from createLoginPinUi orchestration
function renderLoginPinUi({ pin, boxes, maskTimeouts, maskWithFade, clearMaskTimeout, setActive } = {}) {
  boxes.forEach((box, i) => {
    const span = box.querySelector("span");
    if (!span) return;

    const isFilled = i < pin.length;
    const isLastTyped = i === pin.length - 1;
    clearMaskTimeout(i);
    box.classList.remove("is-masking");

    if (!isFilled) {
      span.textContent = "";
      return;
    }

    if (!isLastTyped) {
      span.textContent = "•";
      return;
    }

    span.textContent = pin[i];
    maskTimeouts[i] = setTimeout(() => {
      maskWithFade(box, span);
    }, 500);
  });

  setActive(Math.min(pin.length, boxes.length - 1));
}

export function createLoginPinUi({
  emailInput,
  pinInput,
  pinBoxes,
  errorEl,
  emailHint,
  isValidEmail,
} = {}) {
  const boxes = [...pinBoxes.querySelectorAll(".pin-box")];
  const maskTimeouts = new Array(boxes.length).fill(null);
  const { maskWithFade, clearMaskTimeout } = setupPinMask({ maskTimeouts });

  function setEmailWarn(isOn) {
    emailInput.classList.toggle("is-warn", isOn);
    if (emailHint) emailHint.hidden = !isOn;
  }

  function clearEmailWarn() {
    emailInput.classList.remove("is-warn");
    if (emailHint) emailHint.hidden = true;
  }

  function requireValidEmail() {
    const ok = isValidEmail(emailInput.value);
    setEmailWarn(!ok);
    if (!ok) emailInput.focus();
    return ok;
  }

  function setError(isError) {
    if (errorEl) errorEl.hidden = !isError;
    pinBoxes.classList.toggle("is-error", isError);
  }

  function setActive(activeIndex) {
    boxes.forEach((box, i) => box.classList.toggle("is-active", i === activeIndex));
  }

  function render(pin) {
    renderLoginPinUi({
      pin,
      boxes,
      maskTimeouts,
      maskWithFade,
      clearMaskTimeout,
      setActive,
    });
  }

  function shakePin() {
    pinBoxes.classList.remove("shake");
    pinBoxes.offsetWidth;
    pinBoxes.classList.add("shake");
  }

  return {
    boxCount: boxes.length,
    requireValidEmail,
    clearEmailWarn,
    setError,
    render,
    shakePin,
    focusEmail: () => emailInput.focus(),
    focusPin: () => pinInput.focus(),
    hasEmailWarning: () => emailInput.classList.contains("is-warn"),
    clickedInsidePin: (target) => pinBoxes.contains(target),
    clickedEmail: (target) => emailInput.contains(target),
  };
}