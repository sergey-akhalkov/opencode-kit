import { reserveInventory } from "./inventory.ts";
import { chargePayment, PaymentDeclinedError } from "./payments.ts";
import { recordReceipt } from "./receipts.ts";

const card = process.argv[2] ?? "ok";
const effects: string[] = [];

try {
  const reservation = reserveInventory("book", effects);
  const payment = chargePayment(card, 1250, effects);
  const receipt = recordReceipt(reservation.reservationId, payment.paymentId, effects);
  console.log(JSON.stringify({ effects, receiptId: receipt.receiptId, status: "ok" }));
} catch (error) {
  if (error instanceof PaymentDeclinedError) {
    console.error(JSON.stringify({ effects: error.effects, error: `${error.name}: ${error.message}` }));
    process.exitCode = 2;
  } else {
    throw error;
  }
}
