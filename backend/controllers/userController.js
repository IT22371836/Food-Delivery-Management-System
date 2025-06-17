import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Register user
const registerUser = async (req, res) => {
  const { name, email, phoneNumber, password, address } = req.body;
  try {
    // Check if user already exists
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Validate email format & strong password
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a valid email" });
    }

    if (!validator.isMobilePhone(phoneNumber)) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a valid phone number" });
    }

    // Hash user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      address,
    });

    const user = await newUser.save();

    res.status(201).json({
      success: true,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error registering user" });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User doesn't exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error logging in" });
  }
};

// Update user
const updateUser = async (req, res) => {
  const { name, email, phoneNumber, address } = req.body;
  try {
    const updatedUser = await userModel.findByIdAndUpdate(
      req.params.id,
      { name, email, phoneNumber, address },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating user" });
  }
};

// Add address
const addAddress = async (req, res) => {
  const { street, city, state, zipCode } = req.body;
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.addresses.push({ street, city, state, zipCode });
    await user.save();
    res.json({ success: true, message: "Address added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding address" });
  }
};

const deleteUser = async (req, res) => {
  try {
    await userModel.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting user" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({ role: "user" });
    if (!users) {
      return res
        .status(404)
        .json({ success: false, message: "No users found" });
    }
    res.json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error getting users" });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { id, addressId } = req.params;
    const { street, city, state, zipCode } = req.body;

    const user = await userModel.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    address.street = street;
    address.city = city;
    address.state = state;
    address.zipCode = zipCode;

    await user.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating address" });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { id, addressId } = req.params;

    const user = await userModel.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.addresses.pull(addressId);
    await user.save();

    res.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting address" });
  }
};

export {
  registerUser,
  loginUser,
  updateUser,
  addAddress,
  deleteUser,
  getAllUsers,
  updateAddress,
  deleteAddress,
};
