// foodModel.js
import mongoose from "mongoose";

// Define the schema for Food
const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    ingredients: { type: [String], required: true },
    dietaryInfo: {
      isVegetarian: { type: Boolean, default: false },
      isGlutenFree: { type: Boolean, default: false },
      isVegan: { type: Boolean, default: false },
    },
    specialOffer: {
      isOnOffer: { type: Boolean, default: false },
      offerDescription: String,
      discountPercentage: Number,
    },
    fid: {
      type: String,
      unique: true, // Ensure fid is unique
    },
  },
  { timestamps: true }
);

// Pre-save middleware to auto-generate the fid field
foodSchema.pre("save", async function (next) {
  const doc = this;
  if (doc.isNew) {
    const today = new Date();
    const formattedDate = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD format

    // Find the last food item created today
    const lastFood = await mongoose
      .model("food")
      .findOne({ fid: new RegExp(`^${formattedDate}`) })
      .sort({ fid: -1 });

    let sequenceNumber = "001"; // Default sequence number if no previous food items

    if (lastFood) {
      // Extract the sequence number from the last food's fid
      const lastSequence = parseInt(lastFood.fid.slice(-3), 10);
      sequenceNumber = (lastSequence + 1).toString().padStart(3, "0");
    }

    // Set the fid field in the format YYYYMMDD001
    doc.fid = `${formattedDate}${sequenceNumber}`;
  }
  next();
});

// Create the food model using the schema
const foodModel = mongoose.models.food || mongoose.model("food", foodSchema);

export default foodModel;
