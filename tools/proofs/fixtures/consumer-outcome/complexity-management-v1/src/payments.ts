export class PaymentDeclinedError extends Error {
  readonly effects: string[];

  constructor(effects: string[]) {
    super("payment declined");
    this.name = "PaymentDeclinedError";
    this.effects = [...effects];
  }
}

export function chargePayment(card: string, cents: number, effects: string[]): { paymentId: string } {
  effects.push(`payment:charge:${cents}`);
  if (card === "declined") throw new PaymentDeclinedError(effects);
  return { paymentId: "payment-1" };
}
