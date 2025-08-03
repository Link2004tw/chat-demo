export function formatTimestamp(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    weekday: "short", // e.g., "Mon"
    month: "short", // e.g., "Aug"
    day: "numeric", // e.g., "3"
    hour: "numeric",
    minute: "2-digit",
    hour12: true, // e.g., "12:30 PM"
  });
}

