// backend/routes/departmentRoutes.js
const express = require("express");
const Department = require("../models/Department");
const Doctor = require("../models/Doctor.js");

const router = express.Router();

// Add Department
router.post("/add", async (req, res) => {
  try {
    const { name } = req.body;
    const newDept = new Department({ name });
    await newDept.save();
    res.status(201).json({ message: "Department added successfully", department: newDept });
  } catch (error) {
    res.status(500).json({ message: "Error adding department", error: error.message });
  }
});

// ✅ Get all Departments (for dropdown in frontend)
router.get("/alldept", async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);  // <-- sends JSON array of departments
  } catch (error) {
    res.status(500).json({ message: "Error fetching departments", error: error.message });
  }
});

// Get all Departments with Doctor Count
router.get("/count", async (req, res) => {
  try {
    const departments = await Department.aggregate([
      {
        $lookup: {
          from: "doctors", // collection name in MongoDB
          localField: "_id",
          foreignField: "department",
          as: "doctors"
        }
      },
      {
        $project: {
          name: 1,
          doctorCount: { $size: "$doctors" }
        }
      }
    ]);
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching departments", error: error.message });
  }
});

// Delete Department
router.delete("/:id", async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting department", error: error.message });
  }
});

module.exports = router;
