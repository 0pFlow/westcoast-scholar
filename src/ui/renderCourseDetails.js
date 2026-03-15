export function attachCourseDetailsToggle({
  cardElement,
  buttonSelector = ".details-btn",
  detailsSelector = ".course-extra",
  collapsedLabel = "Details",
  expandedLabel = "Hide",
} = {}) {
  if (!cardElement) return;

  const detailsButton = cardElement.querySelector(buttonSelector);
  const detailsContainer = cardElement.querySelector(detailsSelector);
  if (!detailsButton || !detailsContainer) return;

  let isExpanded = false;

  detailsButton.addEventListener("click", () => {
    isExpanded = !isExpanded;

    if (isExpanded) {
      cardElement.classList.add("is-expanded");
      Array.from(cardElement.parentElement?.children || [])
        .filter((c) => c !== cardElement)
        .forEach((c) => {
          c.style.display = "none";
        });
      detailsContainer.hidden = false;
      detailsButton.textContent = expandedLabel;
      return;
    }

    cardElement.classList.remove("is-expanded");
    Array.from(cardElement.parentElement?.children || []).forEach((c) => {
      c.style.display = "";
    });
    detailsContainer.hidden = true;
    detailsButton.textContent = collapsedLabel;
  });
}
