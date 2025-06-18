import express from "express";
import {
  registerUser,
  loginUser,
  updateUser,
  addAddress,
  deleteUser,
  getAllUsers,
  updateAddress,
  deleteAddress,
} from "../controllers/userController.js";
import userModel from "../models/userModel.js";
import auth from "../middleware/auth.js"; // Assuming you have an auth middleware

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.get("/list", getAllUsers);
userRouter.post("/login", loginUser);
userRouter.put("/:id", updateUser);
userRouter.delete("/:id", deleteUser);
userRouter.post("/:id/address", addAddress);
userRouter.put("/:id/address/:addressId", updateAddress);
userRouter.delete("/:id/address/:addressId", deleteAddress);

userRouter.get("/:id", async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id, { password: 0 });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching user" });
  }
});

userRouter.get("/:id/orders", async (req, res) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .populate("orderHistory");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, orders: user.orderHistory });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching order history" });
  }
});

export default userRouter;
