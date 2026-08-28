export class PaymentDeclinedError extends Error {
  constructor() {
    super("payment declined");
    this.name = "PaymentDeclinedError";
  }
}

export function charge(effects: string[], card: string): void {
  if (card === "declined") throw new PaymentDeclinedError();
  effects.push("payment-charge");
}
