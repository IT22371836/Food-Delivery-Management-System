import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import "dotenv/config";
import cartRouter from "./routes/cartroute.js";
import orderRouter from "./routes/orderRoute.js";
import deliveryPersonRouter from "./routes/deliveryPersonRoute.js";
import deliverAssaignRouter from "./routes/deliveryRoutes.js";
import reviewsRouter from "./routes/reviewRoutes.js";
import customerMessageRouter from "./routes/contact.message.route.js";
import leaveRequestManager from "./routes/leaveRequestRoutes.js";
import powerbiRouter from "./routes/powerbiRoutes.js";
//app config
const app = express();
const port = 4000;

// midleware
app.use(express.json());
app.use(cors());

//db connection
connectDB();

//api end point
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/delivery-person", deliveryPersonRouter);
app.use("/api/delivery", deliverAssaignRouter);
app.use("/api/review", reviewsRouter);
app.use("/api/customer-message", customerMessageRouter);
app.use("/api/leave-requests", leaveRequestManager);
app.use("/api/powerbi", powerbiRouter);

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`);
});

//mongodb+srv://hewageiroshan3:pasindu123@cluster0.m7as14z.mongodb.net/?
