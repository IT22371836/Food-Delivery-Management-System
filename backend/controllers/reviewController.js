import orderModel from "../models/orderModel.js";
import reviewModel from "../models/review.model.js";

export const getReviewsByItemId = async (req, res) => {
  try {
    const itemId = req.params.id;
    console.log(itemId);
    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required" });
    }

    // Find orders containing the item
    let orders = await orderModel.find();
    console.log(orders);
    orders = orders.filter((order) =>
      order.items.some((item) => item._id === itemId)
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this item" });
    }

    // Get the order IDs
    const orderIds = orders.map((order) => order._id);

    // Find reviews for these orders
    const reviews = await reviewModel
      .find({ orderId: { $in: orderIds } })
      .populate("reviewedBy", "name")
      .populate("orderId", "items");

    res.status(200).json(reviews);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching reviews", error: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const { review, rate, orderId, userId } = req.body;

    const newReview = new reviewModel({
      reviewedBy: userId,
      review,
      rate,
      orderId,
    });
    await newReview.save();
    return res
      .status(201)
      .json({ message: "Review submitted successfully", review: newReview });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error submitting review", error: error.message });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await reviewModel
      .find()
      .populate("reviewedBy", "name")
      .populate("orderId", "orderNumber");
    res.status(200).json(reviews);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching reviews", error: error.message });
  }
};

export const getReviewById = async (req, res) => {
  try {
    const review = await reviewModel
      .findById(req.params.id)
      .populate("reviewedBy", "name")
      .populate("orderId", "orderNumber");
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.status(200).json(review);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching review", error: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { review, rate } = req.body;
    const updatedReview = await reviewModel.findByIdAndUpdate(
      req.params.id,
      { review, rate },
      { new: true }
    );
    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found" });
    }
    res
      .status(200)
      .json({ message: "Review updated successfully", review: updatedReview });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating review", error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const deletedReview = await reviewModel.findByIdAndDelete(req.params.id);
    if (!deletedReview) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting review", error: error.message });
  }
};
