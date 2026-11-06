import { Router } from "express";
import {
  createTrainer,
  deleteTrainer,
  listTrainers,
  updateTrainer,
} from "../controllers/staff.js";

const staffRouter = Router();

staffRouter.get("/", listTrainers);
staffRouter.post("/", createTrainer);
staffRouter.patch("/:id", updateTrainer);
staffRouter.delete("/:id", deleteTrainer);

export default staffRouter;
