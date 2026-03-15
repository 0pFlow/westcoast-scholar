import { get, post } from "@/api/http.js";

function setRegisterState(stateEl, message) {
  if (!stateEl) return;
  stateEl.textContent = message || "";
  stateEl.hidden = !message;
}

function validateRegisterForm(formData = {}) {
  const errors = [];

  if (!formData.role) {
    errors.push("Please select student or teacher");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function submitRegistration(payload) {
  await post("/users", payload);
  window.location.assign("login.html?registered=true");
}

async function isEmailRegistered(email) {
  const users = await get(`/users?email=${encodeURIComponent(email)}`);
  return Array.isArray(users) && users.length > 0;
}

export function initRegisterUser({
  formId = "registerForm",
  stateId = "registerState",
  cancelBtnId = "registerCancelBtn",
} = {}) {
  const form = document.getElementById(formId);
  const stateEl = document.getElementById(stateId);
  const cancelBtn = document.getElementById(cancelBtnId);
  if (!form) return;
  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  const roleButtons = Array.from(form.querySelectorAll(".role-btn[data-role]"));
  let selectedRole = null;

  roleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedRole = button.dataset.role || null;
      roleButtons.forEach((btn) => {
        btn.classList.toggle("is-primary", btn === button);
      });
      setRegisterState(stateEl, "");
    });
  });

  cancelBtn?.addEventListener("click", () => {
    window.location.assign("login.html");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const payload = {
      role: selectedRole,
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim().toLowerCase(),
      pin: String(formData.get("pin") || "").trim(),
    };
    const validation = validateRegisterForm(payload);
    if (!validation.valid) {
      setRegisterState(stateEl, validation.errors[0] || "Please check the form.");
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const defaultText = submitButton?.textContent || "Register";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Registering...";
    }

    setRegisterState(stateEl, "");

    try {
      if (await isEmailRegistered(payload.email)) {
        setRegisterState(stateEl, "This email is already registered.");
        return;
      }

      await submitRegistration(payload);
    } catch (error) {
      console.warn("register user error:", error);
      setRegisterState(stateEl, "Something went wrong, please try again.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultText;
      }
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRegisterUser);
} else {
  initRegisterUser();
}
