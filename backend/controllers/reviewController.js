const { sql, poolPromise } = require("../db");

// ADD REVIEW

exports.addReview = async (req, res) => {

  try {

    const {
      alumni_id,
      internship_id,
      rating,
      learning_quality,
      work_pressure,
      certificate_value,
      stipend_reality,
      comments,
    } = req.body;

    const pool = await poolPromise;

    await pool.request()

      .input("alumni_id", sql.Int, alumni_id)
      .input("internship_id", sql.Int, internship_id)
      .input("rating", sql.Int, rating)

      .input("learning_quality", sql.VarChar, learning_quality)
      .input("work_pressure", sql.VarChar, work_pressure)
      .input("certificate_value", sql.VarChar, certificate_value)
      .input("stipend_reality", sql.VarChar, stipend_reality)

      .input("comments", sql.Text, comments)

      .query(`
        INSERT INTO reviews
        (
          alumni_id,
          internship_id,
          rating,
          learning_quality,
          work_pressure,
          certificate_value,
          stipend_reality,
          comments
        )

        VALUES
        (
          @alumni_id,
          @internship_id,
          @rating,
          @learning_quality,
          @work_pressure,
          @certificate_value,
          @stipend_reality,
          @comments
        )
      `);

    res.status(201).json({
      message: "Review added successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to add review",
      error: error.message,
    });

  }

};


// GET REVIEWS BY INTERNSHIP

exports.getReviewsByInternship = async (req, res) => {

  try {

    const { internship_id } = req.params;

    const pool = await poolPromise;

    const result = await pool.request()

      .input("internship_id", sql.Int, internship_id)

      .query(`
        SELECT
          r.*,
          a.name AS alumni_name

        FROM reviews r

        JOIN alumni a
        ON r.alumni_id = a.alumni_id

        WHERE r.internship_id = @internship_id

        ORDER BY r.created_at DESC
      `);

    res.status(200).json(result.recordset);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch reviews",
      error: error.message,
    });

  }

};