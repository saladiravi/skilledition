const pool = require('../db/db');

exports.getTotalCoursesCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS total_courses FROM public.tbl_course`
    );

    return res.status(200).json({
      statusCode: 200,
      message: "Total courses count fetched successfully",
      total_courses: parseInt(result.rows[0].total_courses, 10),
    });
  } catch (error) {
    console.error("Error in getTotalCoursesCount:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};


exports.getMyCoursesCount = async (req, res) => {
  try {
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "Student ID is required",
      });
    }

    const result = await pool.query(
      `SELECT COUNT(*) AS my_courses 
       FROM public.tbl_student_course 
       WHERE student_id = $1`,
      [student_id]
    );

    return res.status(200).json({
      statusCode: 200,
      message: "My courses count fetched successfully",
      my_courses: parseInt(result.rows[0].my_courses, 10),
    });
  } catch (error) {
    console.error("Error in getMyCoursesCount:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};



exports.getTutorCoursesCount = async (req, res) => {
  try {
    const { tutor_id } = req.body;

    if (!tutor_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "Tutor ID is required",
      });
    }

    const result = await pool.query(
      `SELECT COUNT(*) AS tutor_courses 
       FROM public.tbl_course 
       WHERE tutor_id = $1`,
      [tutor_id]
    );

    return res.status(200).json({
      statusCode: 200,
      message: "Tutor courses count fetched successfully",
      tutor_courses: parseInt(result.rows[0].tutor_courses, 10),
    });
  } catch (error) {
    console.error("Error in getTutorCoursesCount:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};


exports.getStudentCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS student_count FROM public.tbl_student`
    );

    return res.status(200).json({
      statusCode: 200,
      message: "Student count fetched successfully",
      student_count: parseInt(result.rows[0].student_count, 10),
    });
  } catch (error) {
    console.error("Error in getStudentCount:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};
