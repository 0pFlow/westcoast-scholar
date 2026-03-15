export function setViewState(element, text) {
  if (!element) return;
  element.hidden = false;
  element.textContent = text;
}

export function hideViewState(element) {
  if (!element) return;
  element.hidden = true;
}


