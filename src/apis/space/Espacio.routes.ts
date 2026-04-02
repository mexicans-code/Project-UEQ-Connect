import { Router } from "express";
import * as espacioController from "./Espacio.controller.js";
import { upload } from "../../config/multer.config.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// GET /api/espacios
router.get("/", espacioController.getEspacios);

// GET /api/espacios/destino/:destinoId  → todos los espacios de un destino
router.get("/destino/:destinoId", espacioController.getEspaciosByDestino);

// GET /api/espacios/destino/:destinoId/disponibles  → solo los disponibles
router.get("/destino/:destinoId/disponibles", espacioController.getEspaciosDisponiblesByDestino);

// GET /api/espacios/sugerencias
router.get("/sugerencias", espacioController.getEspaciosSugeridos);

// GET /api/espacios/:id
router.get("/:id", espacioController.getEspacioById);

// POST /api/espacios
router.post("/", authenticateToken, requireAdmin, espacioController.createEspacio);

// PUT /api/espacios/:id
router.put("/:id", authenticateToken, requireAdmin, espacioController.updateEspacio);

// PATCH /api/espacios/:id/ocupado
router.patch("/:id/ocupado", authenticateToken, requireAdmin, espacioController.toggleOcupado);

// DELETE /api/espacios/:id
router.delete("/:id", authenticateToken, requireAdmin, espacioController.deleteEspacio);

// POST /api/espacios/:id/image
router.post("/:id/image", authenticateToken, requireAdmin, upload.single("image"), espacioController.uploadImage);

// DELETE /api/espacios/:id/image
router.delete("/:id/image", authenticateToken, requireAdmin, espacioController.deleteImage);

export default router;