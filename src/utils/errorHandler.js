// refactor: provide a reusable, user-visible error utility for API and UI layers
function ensureErrorHost() {
  if (typeof document === "undefined") return null;

  let host = document.getElementById("appErrorHost");
  if (host) return host;

  host = document.createElement("div");
  host.id = "appErrorHost";
  host.classList.add("app-error-host");

  document.body.appendChild(host);
  return host;
}

function showErrorMessage(message, { retry = false, onRetry = null } = {}) {
  const host = ensureErrorHost();
  if (!host) return;

  const box = document.createElement("div");
  box.classList.add("app-error-box");

  const text = document.createElement("div");
  text.textContent = message;
  box.appendChild(text);

  if (retry) {
    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "course-btn app-error-retry";
    retryButton.textContent = "Försök igen";
    retryButton.addEventListener("click", () => {
      box.remove();
      if (typeof onRetry === "function") {
        onRetry();
        return;
      }
      window.location.reload();
    });
    box.appendChild(retryButton);
  }

  host.appendChild(box);

  window.setTimeout(() => {
    box.remove();
    if (!host.childElementCount) host.remove();
  }, 6000);
}

export function handleApiError(
  error,
  { retry = false, onRetry = null, fallbackMessage = "Something went wrong" } = {},
) {
  // refactor: always preserve original error for debugging
  console.error(error);

  // refactor: normalize thrown values into a consistent Error instance
  const normalizedError = error instanceof Error ? error : new Error(String(error || fallbackMessage));

  // refactor: expose a user-visible message with optional retry action
  showErrorMessage(fallbackMessage, { retry, onRetry });

  normalizedError.userMessage = fallbackMessage;
  return normalizedError;
}