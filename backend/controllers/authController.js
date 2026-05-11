const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, poolPromise } = require("../db");

// STUDENT REGISTER
exports.registerStudent = async (req, res) => {
  const {
    name,
    email,
    password,
    year_of_study,
    branch,
    skills,
    projects,
    interests,
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await poolPromise;

    await pool
      .request()
      .input("name", sql.VarChar, name)
      .input("email", sql.VarChar, email)
      .input("password", sql.VarChar, hashedPassword)
      .input("year_of_study", sql.VarChar, year_of_study)
      .input("branch", sql.VarChar, branch)
      .input("skills", sql.VarChar(sql.MAX), skills)
      .input("projects", sql.VarChar(sql.MAX), projects)
      .input("interests", sql.VarChar(sql.MAX), interests)
      .query(`
        INSERT INTO students
        (name, email, password, year_of_study, branch, skills, projects, interests)
        VALUES (@name, @email, @password, @year_of_study, @branch, @skills, @projects, @interests)
      `);

    res.status(201).json({
      message: "Student registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Student registration failed",
      error: error.message,
    });
  }
};

// STUDENT LOGIN
exports.loginStudent = async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT * FROM students
        WHERE email = @email
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const student = result.recordset[0];

    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: student.student_id,
        email: student.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      student,
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

// ALUMNI REGISTER
exports.registerAlumni = async (req, res) => {
  const {
    name,
    email,
    password,
    graduation_year,
    branch,
    linkedin_url,
    college_email,
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await poolPromise;

    await pool
      .request()
      .input("name", sql.VarChar, name)
      .input("email", sql.VarChar, email)
      .input("password", sql.VarChar, hashedPassword)
      .input("graduation_year", sql.VarChar, graduation_year)
      .input("branch", sql.VarChar, branch)
      .input("linkedin_url", sql.VarChar, linkedin_url)
      .input("college_email", sql.VarChar, college_email)
      .query(`
        INSERT INTO alumni
        (name, email, password, graduation_year, branch, linkedin_url, college_email)
        VALUES (@name, @email, @password, @graduation_year, @branch, @linkedin_url, @college_email)
      `);

    res.status(201).json({
      message: "Alumni registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Alumni registration failed",
      error: error.message,
    });
  }
};

// ALUMNI LOGIN
exports.loginAlumni = async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT * FROM alumni
        WHERE email = @email
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "Alumni not found",
      });
    }

    const alumni = result.recordset[0];

    const isMatch = await bcrypt.compare(password, alumni.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: alumni.alumni_id,
        email: alumni.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      alumni,
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};