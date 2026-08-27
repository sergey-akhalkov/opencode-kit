export function recordReceipt(reservationId: string, paymentId: string, effects: string[]): { receiptId: string } {
  effects.push(`receipt:record:${reservationId}:${paymentId}`);
  return { receiptId: "receipt-1" };
}
