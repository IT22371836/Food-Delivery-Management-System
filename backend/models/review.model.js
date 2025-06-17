import mongoose from "mongoose";

// Define the schema for Review
const reviewSchema = new mongoose.Schema(
  {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    review: {
      type: String,
      required: true,
    },
    rate: {
      type: String,
      enum: ["😞", "😐", "🙂", "😊", "😄"],
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      required: true,
    },
    rid: {
      type: String,
      unique: true, // Ensure rid is unique
    },
  },
  { timestamps: true }
);

// Query middleware to populate 'oid' from the associated order 
reviewSchema.pre("findOne", populateOidFromOrder);
reviewSchema.pre("find", populateOidFromOrder);

function populateOidFromOrder(next) {
  this.populate({
    path: "orderId",
    select: "oid", // Select only the 'oid' from the order 
  });
  next();
}

// Pre-save middleware to auto-generate the rid field
reviewSchema.pre("save", async function (next) {
  const doc = this;
  if (doc.isNew) {
    const today = new Date();
    const formattedDate = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD format

    // Find the last review created today
    const lastReview = await mongoose
      .model("Review") // Make sure this model name is correct
      .findOne({ rid: new RegExp(`^${formattedDate}`) })
      .sort({ rid: -1 });

    let sequenceNumber = 1; // Start with 1 
    if (lastReview) {
      // Extract the sequence number from the last review's rid
      sequenceNumber = parseInt(lastReview.rid.slice(-3), 10) + 1; 
    }

    // Set the rid field in the format YYYYMMDD001
    doc.rid = `${formattedDate}${sequenceNumber.toString().padStart(3, "0")}`;
  }
  next();
});

// Create the review model using the schema
const ReviewModel = mongoose.model("Review", reviewSchema);

export default ReviewModel;