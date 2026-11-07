import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  currentUser,
  login,
  register,
} from "../controllers/auth.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authenticate, currentUser);

export default authRouter;
