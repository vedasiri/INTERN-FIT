const { sql, poolPromise } = require("../db");

exports.uploadResume = async (req, res) => {

  try {

    const { student_id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        message: "No resume uploaded",
      });
    }

    const resumePath = req.file.path;

    const pool = await poolPromise;

    await pool.request()

      .input("resume_url", sql.VarChar, resumePath)
      .input("student_id", sql.Int, student_id)

      .query(`
        UPDATE students
        SET resume_url = @resume_url
        WHERE student_id = @student_id
      `);

    res.status(200).json({
      message: "Resume uploaded successfully",
      resume_url: resumePath,
    });

  } catch (error) {

    res.status(500).json({
      message: "Resume upload failed",
      error: error.message,
    });

  }

};