const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysUntil(isoDate) {
  if (!isoDate) return null;
  const targetDate = new Date(isoDate);
  if (Number.isNaN(targetDate.getTime())) return null;
  return Math.ceil((targetDate - new Date()) / MS_PER_DAY);
}

export function formatRelativeStartLabel(isoDate) {
  const daysLeft = daysUntil(isoDate);
  if (daysLeft === null) return "Datum saknas";
  if (daysLeft > 0) return `${daysLeft} dagar kvar`;
  if (daysLeft === 0) return "Startar idag";
  return "Startad";
}

export function formatCreatedAt(isoDate) {
  if (!isoDate) return "Tid saknas";
  try {
    return new Intl.DateTimeFormat("sv-SE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

