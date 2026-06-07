// Parse "4 servings", "serves 4", "4 people", "makes 12 cookies", "4–6" → first number
export function parseBaseServings(servings: string): number | null {
  const m = servings.match(/(\d+)/);
  return m ? parseInt(m[0]) : null;
}

// Update the number in a servings label: "serves 4 people" → "serves 8 people"
export function adjustServingsLabel(original: string, newCount: number): string {
  return original.replace(/\d+/, String(newCount));
}
