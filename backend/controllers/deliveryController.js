// controllers/deliveryController.js

import Order from "../models/orderModel.js";
import DeliveryAssignment from "../models/deliveryAssignment.js";

export const getOutForDeliveryOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: "Out for Delivery" });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
};

export const createDeliveryAssignment = async (req, res) => {
  try {
    const { orderId, deliveryPersonId } = req.body;
    const assignment = new DeliveryAssignment({ orderId, deliveryPersonId });
    await assignment.save();
    await Order.findByIdAndUpdate(orderId, { status: "Assigned for Delivery" });
    res.status(201).json({
      success: true,
      message: "Delivery assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error creating delivery assignment" });
  }
};

export const getAllDeliveryAssignments = async (req, res) => {
  try {
    const assignments = await DeliveryAssignment.find()
      .populate("orderId")
      .populate("deliveryPersonId");
    res.json({ success: true, data: assignments });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching delivery assignments" });
  }
};

export const getDeliveryAssignmentById = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findById(req.params.id)
      .populate("orderId")
      .populate("deliveryPersonId");
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery assignment not found" });
    }
    res.json({ success: true, data: assignment });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching delivery assignment" });
  }
};

export const updateDeliveryAssignment = async (req, res) => {
  try {
    const { status } = req.body;
    const assignment = await DeliveryAssignment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery assignment not found" });
    }
    res.json({
      success: true,
      message: "Delivery assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error updating delivery assignment" });
  }
};

export const deleteDeliveryAssignment = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findByIdAndDelete(
      req.params.id
    );
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery assignment not found" });
    }
    res.json({
      success: true,
      message: "Delivery assignment deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error deleting delivery assignment" });
  }
};
