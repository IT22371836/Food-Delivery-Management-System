import DeliveryPersonModel from "../models/deliveryPerson.js";
import jwt from "jsonwebtoken";

export const loginDeliveryPerson = async (req, res) => {
  try {
    const { nic, email } = req.body;

    // Find the delivery person by NIC and email
    const deliveryPerson = await DeliveryPersonModel.findOne({ nic, email });

    if (!deliveryPerson) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please check your NIC and email.",
      });
    }

    // If the delivery person is found, create a JWT token
    const token = jwt.sign(
      { id: deliveryPerson._id, nic: deliveryPerson.nic },
      process.env.JWT_SECRET, // Make sure to set this in your .env file
      { expiresIn: "1d" } // Token expires in 1 day
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        deliveryPerson: {
          id: deliveryPerson._id,
          firstName: deliveryPerson.firstName,
          lastName: deliveryPerson.lastName,
          nic: deliveryPerson.nic,
          email: deliveryPerson.email,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error during login" });
  }
};

export const createDeliveryPerson = async (req, res) => {
  try {
    const newDeliveryPerson = new DeliveryPersonModel(req.body);
    await newDeliveryPerson.save();
    res.status(201).json({ success: true, data: newDeliveryPerson });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllDeliveryPersons = async (req, res) => {
  try {
    const deliveryPersons = await DeliveryPersonModel.find();
    res.status(200).json({ success: true, data: deliveryPersons });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDeliveryPerson = async (req, res) => {
  try {
    const updatedDeliveryPerson = await DeliveryPersonModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedDeliveryPerson) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery person not found" });
    }
    res.status(200).json({ success: true, data: updatedDeliveryPerson });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteDeliveryPerson = async (req, res) => {
  try {
    const deletedDeliveryPerson = await DeliveryPersonModel.findByIdAndDelete(
      req.params.id
    );
    if (!deletedDeliveryPerson) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery person not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Delivery person deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
