import { Router } from "express";
import {
  createMember,
  deleteMember,
  listMembers,
  updateMember,
} from "../controllers/members.js";
import { authenticate, authorize } from "../middleware/authenticate.js";

const membersRouter = Router();

membersRouter.use(authenticate);
membersRouter.use(authorize("owner", "receptionist"));
membersRouter.get("/", listMembers);
membersRouter.post("/", createMember);
membersRouter.patch("/:id", updateMember);
membersRouter.delete("/:id", deleteMember);

export default membersRouter;
