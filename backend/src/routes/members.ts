import { Router } from "express";
import {
  createMember,
  deleteMember,
  listMembers,
  updateMember,
} from "../controllers/members.js";

const membersRouter = Router();

membersRouter.get("/", listMembers);
membersRouter.post("/", createMember);
membersRouter.patch("/:id", updateMember);
membersRouter.delete("/:id", deleteMember);

export default membersRouter;
