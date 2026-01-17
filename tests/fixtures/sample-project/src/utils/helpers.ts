export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]!;
}
