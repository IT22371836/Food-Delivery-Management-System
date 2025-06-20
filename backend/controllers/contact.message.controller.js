import CustomerMessage from "../models/contact.message.model.js";

// Add customer message
const addCustomerMessage = async (req, res) => {
  const customerMessage = new CustomerMessage({
    message: req.body.message,
    userId: req.body.userId,
    email: req.body.email,
  });
  try {
    await customerMessage.save();
    res.json({ success: true, message: "Message Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// List all customer messages
const listCustomerMessages = async (req, res) => {
  try {
    const messages = await CustomerMessage.find({});
    res.json({ success: true, data: messages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Remove customer message
const removeCustomerMessage = async (req, res) => {
  try {
    await CustomerMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Message Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Update customer message
const updateCustomerMessage = async (req, res) => {
  try {
    const message = await CustomerMessage.findById(req.params.id);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

    message.message = req.body.message || message.message;
    message.userId = req.body.userId || message.userId;
    message.email = req.body.email || message.email;
    message.status = req.body.status || message.status;
    await message.save();
    res.json({ success: true, message: "Message Updated", data: message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error updating message" });
  }
};

// Export the functions
export {
  addCustomerMessage,
  listCustomerMessages,
  removeCustomerMessage,
  updateCustomerMessage,
};
