require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db"); // Import DB connection

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// CORS to allow frontend requests
// app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cors());

app.use(express.json()); // Middleware to parse JSON

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cartRoutes");

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes); // Authentication routes
app.use("/api/cart", cartRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
