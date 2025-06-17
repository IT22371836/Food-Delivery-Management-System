// foodControllers.js
import foodModel from "../models/foodModel.js";
import fs from "fs";

const addFood = async (req, res) => {
  let image_filename = `${req.file.filename}`;

  const food = new foodModel({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    image: image_filename,
    ingredients: JSON.parse(req.body.ingredients),
    dietaryInfo: {
      isVegetarian: req.body.isVegetarian === "true",
      isGlutenFree: req.body.isGlutenFree === "true",
      isVegan: req.body.isVegan === "true",
    },
    specialOffer: {
      isOnOffer: req.body.isOnOffer === "true",
      offerDescription: req.body.offerDescription,
      discountPercentage: req.body.discountPercentage,
    },
  });

  try {
    await food.save();
    res.json({ success: true, message: "Food Added" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error adding food" });
  }
};

// const listFood = async (req, res) => {
//   try {
//     const foods = await foodModel.find({});
//     res.json({ success: true, data: foods });
//   } catch (error) {
//     console.log(error);
//     res
//       .status(500)
//       .json({ success: false, message: "Error fetching food list" });
//   }
// };



const listFood = async (req, res) => {
  const { category } = req.query;  // Extract category from query params

  try {
    // If category is provided, filter by category. Otherwise, return all food items.
    const query = category ? { category: category } : {};
    const foods = await foodModel.find(query);

    if (foods.length === 0) {
      return res.status(404).json({ success: false, message: "No food items found for this category" });
    }

    res.json({ success: true, data: foods });
  } catch (error) {
    console.log('Error fetching food list:', error);
    res.status(500).json({ success: false, message: "Error fetching food list" });
  }
};

const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.params.id);
    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found" });
    }
    fs.unlink(`uploads/${food.image}`, () => {});

    await foodModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Food Removed" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error removing food" });
  }
};

const updateFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.params.id);
    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found" });
    }

    if (req.file) {
      fs.unlink(`uploads/${food.image}`, () => {});
      food.image = req.file.filename;
    }

    food.name = req.body.name || food.name;
    food.description = req.body.description || food.description;
    food.price = req.body.price || food.price;
    food.category = req.body.category || food.category;
    food.ingredients = req.body.ingredients
      ? JSON.parse(req.body.ingredients)
      : food.ingredients;

    if (req.body.isVegetarian !== undefined)
      food.dietaryInfo.isVegetarian = req.body.isVegetarian === "true";
    if (req.body.isGlutenFree !== undefined)
      food.dietaryInfo.isGlutenFree = req.body.isGlutenFree === "true";
    if (req.body.isVegan !== undefined)
      food.dietaryInfo.isVegan = req.body.isVegan === "true";

    if (req.body.isOnOffer !== undefined)
      food.specialOffer.isOnOffer = req.body.isOnOffer === "true";
    food.specialOffer.offerDescription =
      req.body.offerDescription || food.specialOffer.offerDescription;
    food.specialOffer.discountPercentage =
      req.body.discountPercentage || food.specialOffer.discountPercentage;

    await food.save();
    res.json({ success: true, message: "Food Updated", data: food });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error updating food" });
  }
};

export { addFood, listFood, removeFood, updateFood };
