// Input validation for API route parameters

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NUMERIC_RE = /^\d+$/;

export function isValidDate(d: string): boolean {
  return DATE_RE.test(d);
}

export function isValidId(id: string): boolean {
  return NUMERIC_RE.test(id);
}

// NHL game IDs can be numeric
export function isValidGameId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 32;
}

export function isValidRound(r: string): boolean {
  return NUMERIC_RE.test(r) && parseInt(r) >= 1 && parseInt(r) <= 30;
}
