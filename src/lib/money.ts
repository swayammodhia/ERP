export function toMinorUnits(amount: number) {
  return Math.round(amount * 100);
}

export function fromMinorUnits(amount: number | string | null | undefined) {
  return Number(amount ?? 0) / 100;
}
