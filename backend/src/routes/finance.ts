import { Router } from "express";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from "../controllers/finance.js";

const financeRouter = Router();

financeRouter.get("/", listTransactions);
financeRouter.post("/", createTransaction);
financeRouter.patch("/:id", updateTransaction);
financeRouter.delete("/:id", deleteTransaction);

export default financeRouter;
