import { Router } from "express"; 
import  indexRoute, { healthCheck }  from "../controllers/index.controller.js";
const router=Router();
router.get("/",indexRoute);
router.get("/health", healthCheck);
export default router;