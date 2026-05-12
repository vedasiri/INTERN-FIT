const { sql, poolPromise } = require("../db");

exports.addReview = async (req, res) => {
  try {
    const {
      alumni_id,
      internship_id,
      company_name,
      role,
      review_text,
      interview_questions,
      preparation_tips,
      is_genuine,
    } = req.body;

    const pool = await poolPromise;

    await pool
      .request()
      .input("alumni_id", sql.Int, alumni_id)
      .input("internship_id", sql.Int, internship_id)
      .input("company_name", sql.VarChar(100), company_name)
      .input("role", sql.VarChar(100), role)
      .input("review_text", sql.VarChar(sql.MAX), review_text)
      .input(
        "interview_questions",
        sql.VarChar(sql.MAX),
        interview_questions || ""
      )
      .input(
        "preparation_tips",
        sql.VarChar(sql.MAX),
        preparation_tips || ""
      )
      .input("is_genuine", sql.VarChar(50), is_genuine)
      .query(`
        INSERT INTO reviews
        (
          alumni_id,
          internship_id,
          company_name,
          role,
          review_text,
          interview_questions,
          preparation_tips,
          is_genuine
        )
        VALUES
        (
          @alumni_id,
          @internship_id,
          @company_name,
          @role,
          @review_text,
          @interview_questions,
          @preparation_tips,
          @is_genuine
        )
      `);

    res.status(201).json({
      message: "Review added successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to add review",
      error: error.message,
    });
  }
};

exports.getReviewsByInternship = async (req, res) => {
  try {
    const { internship_id } = req.params;

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("internship_id", sql.Int, internship_id)
      .query(`
        SELECT r.*, a.name AS alumni_name
        FROM reviews r
        JOIN alumni a
        ON r.alumni_id = a.alumni_id
        WHERE r.internship_id = @internship_id
        ORDER BY r.review_id DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};