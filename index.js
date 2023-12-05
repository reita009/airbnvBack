const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
require("dotenv").config();
const app = express();
const cookieParser = require("cookie-parser");
const multer = require("multer");

const salt = bcrypt.genSaltSync(10);

app.use(cookieParser());
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
    res.status(422).json(err);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  console.log("usuario: ", user);
  if (user) {
    const passConfirmed = bcrypt.compareSync(password, user.password);
    console.log("Contraseña confirmada:", passConfirmed);
    if (passConfirmed) {
      jwt.sign(
        { email: user.email, id: user._id },
        process.env.JWTSECRET,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).json(user);
        }
      );
    } else {
      res.status(401).json({ error: "not found" });
    }
  }
});
app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, process.env.JWTSECRET, {}, async (error, userData) => {
      if (error) throw error;
      const { userName, email, _id } = await User.findById(userData.id).exec();
      res.json({ userName, email, _id });
    });
  } else {
    res.json(null);
  }
});

const photosMiddleware = multer({ dest: "uploads" });
app.post("/upload", photosMiddleware.array("photos", 100), (req, res) => {
  res.json(req.files);
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("se deslogueó");
});
app.listen(4000);
