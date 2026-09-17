import express from "express";

import { getMe, updateProfile, getUserProfile } from "../controllers/user.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateProfile);
router.put("/profile", authenticate, updateProfile);
router.get("/:username", optionalAuthenticate, getUserProfile);

export default router;