const express = require("express");
const multer = require("multer");
const { sql, poolPromise } = require("../db");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/apply", upload.single("resume"), async (req, res) => {
  try {
    const {
      student_id,
      internship_id,
      full_name,
      email,
      phone,
      cover_letter,
    } = req.body;

    const resume_url = req.file ? req.file.filename : null;

    if (
      !student_id ||
      !internship_id ||
      !full_name ||
      !email ||
      !phone ||
      !resume_url
    ) {
      return res.status(400).json({
        message: "All required fields are missing",
      });
    }

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("student_id", sql.Int, parseInt(student_id))
      .input("internship_id", sql.Int, parseInt(internship_id))
      .input("match_score", sql.Int, null)
      .input("full_name", sql.VarChar(100), full_name)
      .input("email", sql.VarChar(100), email)
      .input("phone", sql.VarChar(20), phone)
      .input("cover_letter", sql.VarChar(sql.MAX), cover_letter || "")
      .input("resume_url", sql.VarChar(255), resume_url)
      .query(`
        INSERT INTO applications
        (
          student_id,
          internship_id,
          match_score,
          full_name,
          email,
          phone,
          cover_letter,
          resume_url
        )
        OUTPUT INSERTED.application_id
        VALUES
        (
          @student_id,
          @internship_id,
          @match_score,
          @full_name,
          @email,
          @phone,
          @cover_letter,
          @resume_url
        )
      `);

    res.status(201).json({
      message: "Application submitted successfully",
      application_id: result.recordset[0].application_id,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Application submission failed",
      error: error.message,
    });
  }
});

module.exports = router;