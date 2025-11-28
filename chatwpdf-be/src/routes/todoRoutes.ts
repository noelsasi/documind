import { Router } from "express";
import { todoController } from "../controllers/todoController";

const router = Router();

router.get("/", todoController.getAll);

router.get("/:id", todoController.getOne);

router.post("/", todoController.create);

router.put("/:id", todoController.update);

router.delete("/:id", todoController.delete);

export default router;
