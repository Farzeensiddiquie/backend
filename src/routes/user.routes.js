import { Router } from "express";
import welcome from "../controllers/user.controller.js";
const router=Router();
router.get("/",welcome);
export default router;