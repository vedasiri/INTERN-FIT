
const { sql, poolPromise } = require("../db");

const calculateScore = (data) => {
  let score = 0;
  let penalty = 0;

  const desc = (data.description || "").toLowerCase();

  if (
    data.company_email &&
    !data.company_email.includes("@gmail.com") &&
    !data.company_email.includes("@yahoo.com")
  ) {
    score += 20;
  }

  if (data.website_url && data.linkedin_url) {
    score += 20;
  }

  if (
    !desc.includes("fee") &&
    !desc.includes("pay") &&
    !desc.includes("deposit")
  ) {
    score += 20;
  }

  if (
    desc.includes("role") ||
    desc.includes("duration") ||
    data.description
  ) {
    score += 15;
  }

  score += 10;

  const scamWords = [
    "registration fee",
    "pay",
    "100% placement",
    "confirm seat",
    "security deposit",
  ];

  if (scamWords.some((word) => desc.includes(word))) {
    penalty = 15;
    score -= 15;
  }

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  let status = "Scam Suspected";

  if (score >= 80) {
    status = "Verified";
  } else if (score >= 60) {
    status = "Caution";
  }

  return { score, status, penalty };
};

// VERIFY EXTERNAL INTERNSHIP
exports.verifyExternalInternship = async (req, res) => {
  try {
    const {
      student_id,
      internship_url,
      company_email,
      website_url,
      linkedin_url,
      description,
    } = req.body;

    const result = calculateScore(req.body);

    const message =
      result.status === "Verified"
        ? "Safe to apply"
        : result.status === "Caution"
        ? "Apply with caution"
        : "Avoid this internship";

    const pool = await poolPromise;

    await pool
      .request()
      .input("student_id", sql.Int, student_id)
      .input("internship_url", sql.VarChar, internship_url)
      .input("company_email", sql.VarChar, company_email)
      .input("website_url", sql.VarChar, website_url)
      .input("linkedin_url", sql.VarChar, linkedin_url)
      .input("description", sql.VarChar(sql.MAX), description)
      .input("final_score", sql.Int, result.score)
      .input("verification_status", sql.VarChar, result.status)
      .input("scam_keyword_penalty", sql.Int, result.penalty)
      .input("result_message", sql.VarChar(sql.MAX), message)
      .query(`
        INSERT INTO external_verifications
        (
          student_id,
          internship_url,
          company_email,
          website_url,
          linkedin_url,
          description,
          final_score,
          verification_status,
          scam_keyword_penalty,
          result_message
        )
        VALUES
        (
          @student_id,
          @internship_url,
          @company_email,
          @website_url,
          @linkedin_url,
          @description,
          @final_score,
          @verification_status,
          @scam_keyword_penalty,
          @result_message
        )
      `);

    res.status(200).json({
      message,
      final_score: result.score,
      verification_status: result.status,
    });
  } catch (error) {
    res.status(500).json({
      message: "Verification failed",
      error: error.message,
    });
  }
};

// GET VERIFICATION HISTORY
exports.getExternalVerifications = async (req, res) => {
  try {
    const { student_id } = req.params;

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("student_id", sql.Int, student_id)
      .query(`
        SELECT *
        FROM external_verifications
        WHERE student_id = @student_id
        ORDER BY checked_at DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch history",
      error: error.message,
    });
  }
};