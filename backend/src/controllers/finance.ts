import mongoose from "mongoose";
import { TransactionModel } from "../models/Transaction.js";
import { asyncHandler } from "./asyncHandler.js";

export const listTransactions = asyncHandler(async (_request, response) => {
  const transactions = await TransactionModel.find()
    .sort({ date: -1, createdAt: -1 })
    .lean();
  response.json({ data: transactions });
});

export const createTransaction = asyncHandler(async (request, response) => {
  const transaction = await TransactionModel.create(request.body);
  response.status(201).json({ data: transaction });
});

export const updateTransaction = asyncHandler(async (request, response) => {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    response.status(400).json({ error: "El identificador de la transacción no es válido." });
    return;
  }

  const transaction = await TransactionModel.findByIdAndUpdate(
    id,
    request.body,
    { new: true, runValidators: true },
  );
  if (!transaction) {
    response.status(404).json({ error: "No se encontró la transacción." });
    return;
  }
  response.json({ data: transaction });
});

export const deleteTransaction = asyncHandler(async (request, response) => {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    response.status(400).json({ error: "El identificador de la transacción no es válido." });
    return;
  }

  const transaction = await TransactionModel.findByIdAndDelete(id);
  if (!transaction) {
    response.status(404).json({ error: "No se encontró la transacción." });
    return;
  }
  response.status(204).end();
});
