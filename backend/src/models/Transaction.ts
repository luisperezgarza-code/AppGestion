import { model, Schema } from "mongoose";

const transactionSchema = new Schema(
  {
    client: { type: String, required: true, trim: true },
    concept: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: {
      type: String,
      enum: ["Tarjeta", "Transferencia", "Efectivo"],
      required: true,
    },
    date: { type: String, required: true },
    status: {
      type: String,
      enum: ["Completado", "Pendiente"],
      default: "Completado",
    },
  },
  { timestamps: true },
);

export const TransactionModel = model("Transaction", transactionSchema);
