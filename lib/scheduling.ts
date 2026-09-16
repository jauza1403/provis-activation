export const SLOT_CAPACITY = 10;
export const slots = [
  "08.00–10.00 WIB",
  "10.00–12.00 WIB",
  "13.00–15.00 WIB",
  "15.00–17.00 WIB",
];

export function candidateSlots(slot: string) {
  const index = slots.indexOf(slot);
  return index < 0 ? [] : slots.slice(index);
}
