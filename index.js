const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

mongoose.connect(process.env.DATABASE_URL);

app.get("/test", (req, res) => {
  res.json("test ok");
});

app.post("/register", (req, res) => {
  const { userName, email, password } = req.body;
  res.json({ userName, email, password });
});

app.listen(4000);
