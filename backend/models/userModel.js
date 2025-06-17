import mongoose from "mongoose";

// Define the user schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    uid: {
      type: String,
      unique: true, // Ensure uid is unique
    },
    role: {
      type: String,
      default: "user",
    },
  },
  { timestamps: true }
);

// Pre-save middleware to auto-generate the uid field
userSchema.pre("save", async function (next) {
  const doc = this;
  if (doc.isNew) {
    const today = new Date();
    const formattedDate = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD format

    // Find the last user created today
    const lastUser = await mongoose
      .model("user")
      .findOne({ uid: new RegExp(`^${formattedDate}`) })
      .sort({ uid: -1 });

    let sequenceNumber = "001"; // Default sequence number if no previous users

    if (lastUser) {
      // Extract the sequence number from the last user's uid
      const lastSequence = parseInt(lastUser.uid.slice(-3), 10);
      sequenceNumber = (lastSequence + 1).toString().padStart(3, "0");
    }

    // Set the uid field in the format YYYYMMDD001
    doc.uid = `${formattedDate}${sequenceNumber}`;
  }
  next();
});

// Create the user model using the schema
const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
