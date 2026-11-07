import { Router } from "express";
import {
  createClass,
  deleteClass,
  listClasses,
  updateClass,
} from "../controllers/classes.js";
import { authenticate, authorize } from "../middleware/authenticate.js";

const classesRouter = Router();

classesRouter.use(authenticate);
classesRouter.get("/", authorize("owner", "trainer"), listClasses);
classesRouter.post("/", authorize("owner"), createClass);
classesRouter.patch("/:id", authorize("owner"), updateClass);
classesRouter.delete("/:id", authorize("owner"), deleteClass);

export default classesRouter;
