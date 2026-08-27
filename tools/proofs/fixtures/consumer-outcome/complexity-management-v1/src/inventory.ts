export function reserveInventory(sku: string, effects: string[]): { reservationId: string; sku: string } {
  effects.push(`inventory:reserve:${sku}`);
  return { reservationId: "reservation-1", sku };
}
