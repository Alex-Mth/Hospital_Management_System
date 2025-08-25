const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  photo: {
    data: Buffer,
    contentType: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Doctor", doctorSchema);
