import { Router } from "express";
import { signup, login, me, refresh, logout } from "../auth/authController.js";
import { isAuthenticated } from "../../middlewares/authMiddleware.js";

const router = Router();

router.get("/me", isAuthenticated, me);

router.post("/signup", signup);
router.post("/login", login);

router.post("/refresh", refresh);

router.post("/logout", isAuthenticated, logout);

export default router;
