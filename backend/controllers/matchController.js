const { sql, poolPromise } = require("../db");

const resourceMap = {
  react: "https://www.youtube.com/results?search_query=react+tutorial",
  javascript: "https://www.youtube.com/results?search_query=javascript+tutorial",
  nodejs: "https://www.youtube.com/results?search_query=nodejs+tutorial",
  sql: "https://www.youtube.com/results?search_query=sql+tutorial",
  java: "https://www.youtube.com/results?search_query=java+tutorial",
};

exports.calculateMatch = async (req, res) => {
  try {
    const { student_id, internship_id } = req.params;

    const pool = await poolPromise;

    const studentResult = await pool
      .request()
      .input("student_id", sql.Int, student_id)
      .query(`
        SELECT * FROM students
        WHERE student_id = @student_id
      `);

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const internshipResult = await pool
      .request()
      .input("internship_id", sql.Int, internship_id)
      .query(`
        SELECT * FROM internships
        WHERE internship_id = @internship_id
      `);

    if (internshipResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Internship not found",
      });
    }

    const student = studentResult.recordset[0];
    const internship = internshipResult.recordset[0];

    const studentSkills = (student.skills || "")
      .toLowerCase()
      .split(",")
      .map((skill) => skill.trim());

    const requiredSkills = (internship.required_skills || "")
      .toLowerCase()
      .split(",")
      .map((skill) => skill.trim());

    let matched = [];
    let missing = [];

    requiredSkills.forEach((skill) => {
      if (studentSkills.includes(skill)) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    const skillMatch =
      requiredSkills.length > 0
        ? (matched.length / requiredSkills.length) * 80
        : 0;

    const projectScore = student.projects ? 10 : 0;

    const yearScore =
      student.year_of_study &&
      student.year_of_study.includes("2")
        ? 5
        : 10;

    let finalScore = Math.round(
      skillMatch + projectScore + yearScore
    );

    if (finalScore > 100) finalScore = 100;

    const suggestedResources = missing.map((skill) => ({
      skill,
      resource: resourceMap[skill] || "https://www.youtube.com/",
    }));

    const estimatedTime = `${missing.length * 1} week(s)`;

    res.status(200).json({
      match_percentage: finalScore,
      matched_skills: matched,
      missing_skills: missing,
      suggested_resources: suggestedResources,
      estimated_preparation_time: estimatedTime,
      apply_allowed:
        finalScore >= 80 &&
        internship.verification_status === "Verified",
    });
  } catch (error) {
    res.status(500).json({
      message: "Match calculation failed",
      error: error.message,
    });
  }
};
