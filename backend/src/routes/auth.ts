import { Router } from "express";
import {
  authenticate,
  optionalAuthenticate,
} from "../middleware/authenticate.js";
import {
  currentUser,
  disableTwoFactor,
  login,
  register,
  setupTwoFactor,
  verifyTwoFactor,
} from "../controllers/auth.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/2fa/setup", authenticate, setupTwoFactor);
authRouter.post("/2fa/verify", optionalAuthenticate, verifyTwoFactor);
authRouter.post("/2fa/disable", authenticate, disableTwoFactor);
authRouter.get("/me", authenticate, currentUser);

export default authRouter;
