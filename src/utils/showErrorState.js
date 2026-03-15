export function showErrorState(containerEl, message, { retry = false, onRetry } = {}) {
  if (!containerEl) return;

  containerEl.hidden = false;
  containerEl.textContent = message || "Ett oväntat fel uppstod.";

  if (!retry) return;

  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.className = "course-btn";
  retryButton.textContent = "Försök igen";
  retryButton.addEventListener("click", () => {
    if (typeof onRetry === "function") {
      onRetry();
      return;
    }
    window.location.reload();
  });

  containerEl.appendChild(document.createTextNode(" "));
  containerEl.appendChild(retryButton);
}