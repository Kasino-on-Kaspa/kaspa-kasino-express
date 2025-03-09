import { Router, Response, RequestHandler } from "express";
import { authController } from "./auth.controller";
import { authenticateJWT, AuthenticatedRequest } from "./auth.middleware";

const router = Router();

// Public routes
router.post("/signin", authController.signIn);
router.post("/refresh", authController.refresh);

// Protected routes - all routes below this will require authentication
router.use(authenticateJWT);

router.get("/me", (req: AuthenticatedRequest, res: Response): void => {
  res.json({ user: req.user });
});

export default router;
