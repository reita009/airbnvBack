const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Place = require("./models/Place");
require("dotenv").config();
const app = express();
const cookieParser = require("cookie-parser");
const multer = require("multer");
const fs = require("fs");
const Booking = require("./models/Book");

const salt = bcrypt.genSaltSync(10);

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.static("uploads"));
app.use("/uploads", express.static("uploads"));

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
  const uploadedFiles = [];
  for (i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace("uploads\\", ""));
  }
  res.json({
    message: "prueba:",
    files: uploadedFiles.map((file) => file),
  });
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("se deslogueó");
});

app.post("/places", (req, res) => {
  const { token } = req.cookies;
  const {
    extraInfo,
    photosList,
    servicios,
    title,
    address,
    description,
    guestsNumber,
    selectedCheckIn,
    selectedCheckOut,
    price,
  } = req.body;
  jwt.verify(token, process.env.JWTSECRET, {}, async (error, userData) => {
    if (error) throw error;

    const placeDoc = await Place.create({
      owner: userData.id,
      description,
      title: title,
      perks: servicios,
      addres: address,
      maxGuest: guestsNumber,
      checkIn: selectedCheckIn,
      checkOut: selectedCheckOut,
      photos: photosList,
      extraInfo: extraInfo,
      price,
    });
    res.json(placeDoc);
  });
});

app.get("/user-places", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, process.env.JWTSECRET, {}, async (err, userdata) => {
    const { id } = userdata;
    res.json(await Place.find({ owner: id }));
  });
});
app.get("/places", async (req, res) => {
  res.json(await Place.find());
});
app.get("/places/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Recibida solicitud para id:", { id });
  res.json(await Place.findById(id));
});
app.put("/places", async (req, res) => {
  const { token } = req.cookies;
  const {
    id,
    extraInfo,
    photosList,
    servicios,
    title,
    address,
    description,
    guestsNumber,
    selectedCheckIn,
    selectedCheckOut,
    price,
  } = req.body;
  jwt.verify(token, process.env.JWTSECRET, {}, async (error, userData) => {
    const placeDoc = await Place.findById(id);

    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        description,
        title: title,
        perks: servicios,
        addres: address,
        maxGuest: guestsNumber,
        checkIn: selectedCheckIn,
        checkOut: selectedCheckOut,
        photos: photosList,
        extraInfo: extraInfo,
        price,
      });
      await placeDoc.save();
      res.json("ok");
    }
  });
});

app.post("/booking", async (req, res) => {
  const {
    place,
    totalPrice,
    clientName,
    clientSurname,
    checkIn,
    checkOut,
    phone,
    email,
    numGuest,
    reservedDays,
  } = req.body;
  try {
    const book = await Booking.create({
      clientName: clientName,
      clientSurname: clientSurname,
      numGuest: numGuest,
      reservedDays: reservedDays,
      phone: phone,
      email: email,
      place: place,
      checkIn: checkIn,
      checkOut: checkOut,
      price: totalPrice,
    });

    res.json(book);
  } catch (err) {
    res.status(422).json(err);
  }
});

app.listen(4000);
