export function clearPendingBookingSelection() {
  sessionStorage.removeItem("pending_booking_course_id");
  window.history.replaceState({}, "", "booking.html");
}

export async function withLoading(
  button,
  loadingText,
  callback,
  { resetOnSuccess = true } = {},
) {
  if (!button) {
    return callback();
  }

  const originalText = button.textContent;
  const originalDisabled = button.disabled;
  let shouldReset = false;

  button.disabled = true;
  if (loadingText) button.textContent = loadingText;

  try {
    const result = await callback();
    shouldReset = resetOnSuccess || result === false;
    return result;
  } catch (error) {
    shouldReset = true;
    throw error;
  } finally {
    if (shouldReset) {
      button.disabled = originalDisabled;
      button.textContent = originalText;
    }
  }
}
