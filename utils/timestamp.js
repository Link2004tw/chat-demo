export function formatTimestamp(timestamp) {
  if (!timestamp || !timestamp.toDate) {
    return null;
  }
  const date = timestamp.toDate();
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
