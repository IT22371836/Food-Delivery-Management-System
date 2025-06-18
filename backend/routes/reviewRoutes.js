import express from "express";
import {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewsByItemId,
} from "../controllers/reviewController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/create", createReview);
router.get("/list", getAllReviews);
router.get("/:id", getReviewById);
router.put("/:id", authMiddleware, updateReview);
router.delete("/:id", deleteReview);
router.get("/item/:id", getReviewsByItemId);

export default router;
