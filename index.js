const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
require("dotenv").config();
const app = express();

const salt = bcrypt.genSaltSync(10);

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

app.post("/register", async (req, res) => {
  const { userName, email, password } = req.body;

  try {
    const user = await User.create({
      userName,
      email,
      password: bcrypt.hashSync(password, salt),
    });

    res.json(user);
  } catch (err) {
    res.status(422).json(e);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const passConfirmed = bcrypt.compareSync(password, user.password);
    if (passConfirmed) {
      res.json("pass ok");
    } else {
      res.json("not found");
    }
  }
});

app.listen(4000);
