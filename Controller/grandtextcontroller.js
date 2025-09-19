const pool = require('../db/db');

exports.getExamsByCourseId = async (req, res) => {
  try {
    const { course_id } = req.body; // or req.params.course_id if you prefer

    if (!course_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "course_id is required",
      });
    }

    const query = `
      SELECT 
          e.exam_id,
          e.exam_name,
          e.course_id,
          e.course_video_id,
          e.tutor_id,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'question_id', q.question_id,
                'question', q.question,
                'a', q.a,
                'b', q.b,
                'c', q.c,
                'd', q.d
              
              )
            ) FILTER (WHERE q.question_id IS NOT NULL), '[]'
          ) AS questions
      FROM tbl_exam e
      LEFT JOIN tbl_exam_question q ON e.exam_id = q.exam_id
      WHERE e.course_id = $1
      GROUP BY e.exam_id, e.exam_name, e.course_id, e.course_video_id, e.tutor_id;
    `;

    const result = await pool.query(query, [course_id]);

    return res.status(200).json({
      statusCode: 200,
      message: "Exam list with questions",
      exams: result.rows,
    });

  } catch (error) {
    console.error("Error in getExamsByCourseId:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};


exports.submitGrandTest = async (req, res) => {
  try {
    const { student_id, exam_id, answers } = req.body;

    // answers = [{ question_id: 1, student_answer: "a" }, { question_id: 2, student_answer: "c" }]

    if (!student_id || !exam_id || !answers || answers.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "student_id, exam_id, and answers are required",
      });
    }

    // Insert answers into tbl_grandtext
    const insertQuery = `
      INSERT INTO tbl_grandtext (question_id, student_answer, attempt, exam_id, student_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    for (const ans of answers) {
      await pool.query(insertQuery, [
        ans.question_id,
        ans.student_answer,
        "1", // attempt number, you can make this dynamic
        exam_id,
        student_id,
      ]);
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Answers submitted successfully",
    });

  } catch (error) {
    console.error("Error in submitGrandTest:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};


exports.evaluateGrandTest = async (req, res) => {
  try {
    const { student_id, exam_id } = req.body;

    if (!student_id || !exam_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "student_id and exam_id are required",
      });
    }

    const query = `
      SELECT 
        g.question_id,
        g.student_answer,
        q.answer AS correct_answer,
        CASE WHEN g.student_answer = q.answer THEN 1 ELSE 0 END AS is_correct
      FROM tbl_grandtext g
      INNER JOIN tbl_exam_question q ON g.question_id = q.question_id
      WHERE g.student_id = $1 AND g.exam_id = $2;
    `;

    const result = await pool.query(query, [student_id, exam_id]);

    const totalQuestions = result.rows.length;
    const correctAnswers = result.rows.filter(r => r.is_correct === 1).length;
    const score = `${correctAnswers} / ${totalQuestions}`;

    // Passing rule (e.g., 50% required)
    const passed = correctAnswers >= Math.ceil(totalQuestions * 0.5);

    return res.status(200).json({
      statusCode: 200,
      message: "Exam evaluated",
      result: {
        totalQuestions,
        correctAnswers,
        score,
        passed,
        details: result.rows
      }
    });

  } catch (error) {
    console.error("Error in evaluateGrandTest:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};
