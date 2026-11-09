// Amounts are stored as integer minor units (1 BDT = 100 poisha).
export const toMinor = (amount) => Math.round(amount * 100);
export const toMajor = (minor) => (minor ?? 0) / 100;
