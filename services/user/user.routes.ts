import { Router } from "express";
import { userController } from "./user.controller";
import { authenticateJWT } from "../auth/auth.middleware";

const router = Router();

// All user routes require authentication
router.use(authenticateJWT);

// User CRUD routes
router.get("/me", userController.getUser);
router.post("/me", userController.updateUser);
router.delete("/me", userController.deleteUser);

export default router;
