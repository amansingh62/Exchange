import { Router } from "express";
import { isAuthenticated } from "../../middlewares/authMiddleware.js";
import { dashboard, history, search, send } from "./walletController.js";

const router = Router();

router.get("/history", isAuthenticated, history);
router.get("/search", isAuthenticated, search);
router.get("/dashboard", isAuthenticated, dashboard);
router.post("/send", isAuthenticated, send);

export default router;