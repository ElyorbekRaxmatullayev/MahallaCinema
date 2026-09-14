export function getEventDateTime(date: Date | string, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hours || 0, minutes || 0, 0, 0);
  return combined;
}

export function isEventPast(date: Date | string, time: string): boolean {
  return getEventDateTime(date, time).getTime() < Date.now();
}
