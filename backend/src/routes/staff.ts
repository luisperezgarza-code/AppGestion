import { Router } from "express";
import {
  createTrainer,
  deleteTrainer,
  listTrainers,
  updateTrainer,
} from "../controllers/staff.js";
import { authenticate, authorize } from "../middleware/authenticate.js";

const staffRouter = Router();

staffRouter.use(authenticate);
staffRouter.get("/", authorize("owner", "trainer"), listTrainers);
staffRouter.post("/", authorize("owner"), createTrainer);
staffRouter.patch("/:id", authorize("owner"), updateTrainer);
staffRouter.delete("/:id", authorize("owner"), deleteTrainer);

export default staffRouter;
