import { Router } from "express";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from "../controllers/finance.js";
import { authenticate, authorize } from "../middleware/authenticate.js";

const financeRouter = Router();

financeRouter.use(authenticate);
financeRouter.use(authorize("owner", "receptionist"));
financeRouter.get("/", listTransactions);
financeRouter.post("/", createTransaction);
financeRouter.patch("/:id", updateTransaction);
financeRouter.delete("/:id", deleteTransaction);

export default financeRouter;
