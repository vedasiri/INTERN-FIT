const { sql, poolPromise } = require("../db");

const calculateVerification = (data) => {

  let score = 0;

  const scamKeywords = [
    "registration fee",
    "pay",
    "security deposit",
    "100% placement",
    "confirm seat",
  ];

  const description =
    (data.description || "").toLowerCase();

  const hasScamKeyword =
    scamKeywords.some((word) =>
      description.includes(word)
    );

  if (
    data.company_email &&
    !data.company_email.includes("@gmail.com")
  ) {
    score += 20;
  }

  if (data.website_url && data.linkedin_url) {
    score += 20;
  }

  if (
    !description.includes("fee") &&
    !description.includes("pay")
  ) {
    score += 20;
  }

  if (data.role && data.duration) {
    score += 15;
  }

  score += 10;

  if (hasScamKeyword) {
    score -= 15;
  }

  if (score < 0) score = 0;

  let status = "Scam Suspected";

  if (score >= 80) {
    status = "Verified";
  } else if (score >= 60) {
    status = "Caution";
  }

  return { score, status };
};


// ADD INTERNSHIP
exports.addInternship = async (req, res) => {

  try {

    const {
      company_name,
      role,
      duration,
      required_skills,
      description,
      company_email,
      website_url,
      linkedin_url,
      stipend,
      location,
      mode,
    } = req.body;

    const verification =
      calculateVerification(req.body);

    const pool = await poolPromise;

    await pool.request()

      .input("company_name", sql.VarChar, company_name)
      .input("role", sql.VarChar, role)
      .input("duration", sql.VarChar, duration)
      .input("required_skills", sql.Text, required_skills)
      .input("description", sql.Text, description)
      .input("company_email", sql.VarChar, company_email)
      .input("website_url", sql.VarChar, website_url)
      .input("linkedin_url", sql.VarChar, linkedin_url)
      .input("stipend", sql.VarChar, stipend)
      .input("location", sql.VarChar, location)
      .input("mode", sql.VarChar, mode)
      .input("verification_score", sql.Int, verification.score)
      .input("verification_status", sql.VarChar, verification.status)

      .query(`
        INSERT INTO internships
        (
          company_name,
          role,
          duration,
          required_skills,
          description,
          company_email,
          website_url,
          linkedin_url,
          stipend,
          location,
          mode,
          verification_score,
          verification_status
        )
        VALUES
        (
          @company_name,
          @role,
          @duration,
          @required_skills,
          @description,
          @company_email,
          @website_url,
          @linkedin_url,
          @stipend,
          @location,
          @mode,
          @verification_score,
          @verification_status
        )
      `);

    res.status(201).json({
      message: "Internship added successfully",
      verification_score: verification.score,
      verification_status: verification.status,
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to add internship",
      error: error.message,
    });

  }

};


// GET ALL INTERNSHIPS
exports.getAllInternships = async (req, res) => {

  try {

    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT * FROM internships
      ORDER BY created_at DESC
    `);

    res.status(200).json(result.recordset);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch internships",
      error: error.message,
    });

  }

};


// GET VERIFIED INTERNSHIPS
exports.getVerifiedInternships = async (req, res) => {

  try {

    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT * FROM internships
      WHERE verification_status = 'Verified'
      ORDER BY created_at DESC
    `);

    res.status(200).json(result.recordset);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch verified internships",
      error: error.message,
    });

  }

};