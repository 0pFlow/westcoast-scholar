export default function startClock(elementId) {
  const timeEl = document.getElementById(elementId);
  if (!timeEl) return;

  function formatTime(date) {
    return new Intl.DateTimeFormat("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  function updateClock() {
    timeEl.textContent = formatTime(new Date());
  }

  function scheduleMinuteTick() {
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    setTimeout(() => {
      updateClock();
      setInterval(updateClock, 60_000);
    }, Math.max(0, msToNextMinute));
  }

  updateClock();
  scheduleMinuteTick();
}

