import { Router } from "express";
import {
  changePassword,
  createUser,
  listUsers,
  updateProfile,
} from "../controllers/users.js";
import { authenticate, authorize } from "../middleware/authenticate.js";

const usersRouter = Router();

usersRouter.use(authenticate);
usersRouter.get("/", authorize("owner"), listUsers);
usersRouter.post("/", authorize("owner"), createUser);
usersRouter.patch("/me", updateProfile);
usersRouter.patch("/me/password", changePassword);

export default usersRouter;
