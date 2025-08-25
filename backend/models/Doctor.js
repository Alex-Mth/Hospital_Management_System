// backend/models/Doctor.js
const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Department", 
    required: true 
  }, // ✅ Reference Department collection
  email: { type: String, required: true },
  phone: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  photo: { type: Buffer },
  photoType: { type: String }
});

module.exports = mongoose.model("Doctor", doctorSchema);
