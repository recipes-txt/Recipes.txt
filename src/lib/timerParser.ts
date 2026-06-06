export interface TimerInfo {
  minutes: number;
  label: string;
}

export function detectTimer(step: string): TimerInfo | null {
  // "1 hour 30 minutes" or "1 hr 30 min"
  const hourMin = step.match(/(\d+)\s*h(?:ou?rs?)?\s+(\d+)\s*m(?:in(?:utes?)?)?/i);
  if (hourMin) {
    const m = parseInt(hourMin[1]) * 60 + parseInt(hourMin[2]);
    return { minutes: m, label: `${hourMin[1]}h ${hourMin[2]}m` };
  }

  // "1.5 hours" or "2 hours"
  const hours = step.match(/(\d+\.?\d*)\s*h(?:ou?rs?)/i);
  if (hours) {
    const m = Math.round(parseFloat(hours[1]) * 60);
    return { minutes: m, label: `${m} min` };
  }

  // "10-15 minutes" (range → upper bound)
  const rangeMin = step.match(/(\d+)\s*[-–]\s*(\d+)\s*m(?:in(?:utes?)?)/i);
  if (rangeMin) {
    const hi = parseInt(rangeMin[2]);
    return { minutes: hi, label: `${rangeMin[1]}–${rangeMin[2]} min` };
  }

  // "25 minutes" or "25 mins"
  const mins = step.match(/(\d+)\s*m(?:in(?:utes?)?)\b/i);
  if (mins) {
    const m = parseInt(mins[1]);
    if (m >= 1 && m <= 480) return { minutes: m, label: `${m} min` };
  }

  // "30 seconds" (≥30s, convert to fractional minutes rounded up)
  const secs = step.match(/(\d+)\s*s(?:ec(?:onds?)?)\b/i);
  if (secs && parseInt(secs[1]) >= 30) {
    const s = parseInt(secs[1]);
    return { minutes: Math.ceil(s / 60), label: `${s}s` };
  }

  return null;
}
