const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookSchema = new Schema({
  clientName: String,
  clientSurname: String,
  numGuest: Number,
  reservedDays: Number,
  phone: String,
  email: String,
  place: { type: Schema.Types.ObjectId, required: "true" },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  price: Number,
});

const BookModel = mongoose.model("Booking", bookSchema);

module.exports = BookModel;
