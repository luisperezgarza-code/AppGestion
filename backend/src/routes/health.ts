import { Router } from "express";
import { database } from "../config/database.js";

const healthRouter = Router();

healthRouter.get("/", async (_request, response, next) => {
  try {
    await database.query("SELECT 1");
    response.json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

export default healthRouter;
