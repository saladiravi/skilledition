const pool = require('../db/db');

// exports.addExamResult = async (req, res) => {
//   const client = await pool.connect();
//   try {
//     const { exam_id, results } = req.body;

//     if (!exam_id || !Array.isArray(results) || results.length === 0) {
//       return res.status(400).json({
//         statusCode: 400,
//         message: "exam_id and results array are required",
//       });
//     }

//     await client.query("BEGIN");

//     const insertQuery = `
//       INSERT INTO tbl_exam_result (exam_id, question_id, student_answer, attempt, created_at)
//       VALUES ($1, $2, $3, $4, NOW())
//       RETURNING exam_result_id, exam_id, question_id, student_answer, attempt, created_at
//     `;

//     let insertedRows = [];

//     for (const row of results) {
//       const { question_id, student_answer, attempt } = row;

//       if (!question_id || !student_answer || !attempt) {
//         continue; // skip invalid entries
//       }

//       const values = [exam_id, question_id, student_answer, attempt];
//       const result = await client.query(insertQuery, values);
//       insertedRows.push(result.rows[0]);
//     }

//     await client.query("COMMIT");

//     res.status(200).json({
//       statusCode: 200,
//       message: "Exam results added successfully",
//       data: insertedRows,
//     });

//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error("Error inserting exam results:", error);
//     res.status(500).json({
//       statusCode: 500,
//       message: "Internal Server Error",
//     });
//   } finally {
//     client.release();
//   }
// };


exports.addExamResult = async (req, res) => {
  const client = await pool.connect();
  try {
    const { exam_id, student_id, results } = req.body;

    if (!exam_id || !student_id || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "exam_id, student_id and results array are required",
      });
    }

    await client.query("BEGIN");

    const insertQuery = `
      INSERT INTO tbl_exam_result (exam_id, student_id, question_id, student_answer, attempt, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING exam_result_id, exam_id, student_id, question_id, student_answer, attempt, created_at
    `;

    let insertedRows = [];

    for (const row of results) {
      const { question_id, student_answer, attempt } = row;

      if (!question_id || !student_answer || !attempt) {
        continue; // skip invalid entries
      }

      const values = [exam_id, student_id, question_id, student_answer, attempt];
      const result = await client.query(insertQuery, values);
      insertedRows.push(result.rows[0]);
    }

    await client.query("COMMIT");

    res.status(200).json({
      statusCode: 200,
      message: "Exam results added successfully",
      data: insertedRows,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error inserting exam results:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  } finally {
    client.release();
  }
};

// exports.getExamResult = async (req, res) => {
//   try {
//     const { exam_id } = req.body; // or use req.params.exam_id

//     if (!exam_id) {
//       return res.status(400).json({
//         statusCode: 400,
//         message: "exam_id is required",
//       });
//     }

//     const query = `
//       SELECT 
//           r.exam_result_id,
//           r.exam_id,
//           q.question_id,
//           q.question,
//           q.a, q.b, q.c, q.d,
//           q.answer AS student_answer,
//           r.student_answer,
//           CASE 
//               WHEN r.student_answer = q.answer THEN 'Right'
//               ELSE 'Wrong'
//           END AS result_status,
//           r.created_at
//       FROM tbl_exam_result r
//       JOIN tbl_exam_question q ON r.question_id = q.question_id
//       WHERE r.exam_id = $1
//       ORDER BY r.created_at ASC
//     `;

//     const result = await pool.query(query, [exam_id]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         statusCode: 404,
//         message: "No results found for this exam",
//       });
//     }

//     res.status(200).json({
//       statusCode: 200,
//       message:'Fetched Sucessfully',
//       exam_id,
//       results: result.rows,
//     });

//   } catch (error) {
//     console.error("Error fetching exam results:", error);
//     res.status(500).json({
//       statusCode: 500,
//       message: "Internal Server Error",
//     });
//   }
// };


 

// exports.getExamattempts = async (req, res) => {
//   const { exam_id ,student_id} = req.body; // exam_id from request params

//   try {
//     const query = `
//       SELECT 
//         er.attempt,
//         MIN(er.created_at) AS created_at,
//         COUNT(*) FILTER (WHERE er.student_answer = eq.answer) AS correct_answers,
//         COUNT(*) FILTER (WHERE er.student_answer <> eq.answer) AS wrong_answers
//       FROM tbl_exam_result er
//       JOIN tbl_exam_question eq ON er.question_id = eq.question_id
//       WHERE er.exam_id = $1
//       GROUP BY er.attempt
//       ORDER BY er.attempt;
//     `;

//     const { rows } = await pool.query(query, [exam_id]);

//     res.status(200).json({
      
//       statusCode: 200,
//       message:'Fectched Sucessfully',
//       data: rows
//     });

//   } catch (error) {
//     console.error("Error fetching exam results:", error);
//     res.status(500).json({
//       statusCode: 500,
//       message: "Internal Server Error"
//     });
//   }
// };


exports.getExamResult = async (req, res) => {
  try {
    const { exam_id } = req.body; // or use req.params.exam_id

    if (!exam_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "exam_id is required",
      });
    }

    const query = `
      SELECT 
          r.exam_result_id,
          r.exam_id,
          q.question_id,
          q.question,
          q.a, q.b, q.c, q.d,
          q.answer AS correct_answer,       -- ✅ Correct answer from exam questions
          r.student_answer,                 -- ✅ Student’s selected answer
          CASE 
              WHEN r.student_answer = q.answer THEN 'Right'
              ELSE 'Wrong'
          END AS result_status,
          r.created_at
      FROM tbl_exam_result r
      JOIN tbl_exam_question q ON r.question_id = q.question_id
      WHERE r.exam_id = $1
      ORDER BY r.created_at ASC
    `;

    const result = await pool.query(query, [exam_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No results found for this exam",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "Fetched Successfully",
      exam_id,
      results: result.rows,
    });

  } catch (error) {
    console.error("Error fetching exam results:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};

exports.getExamattempts = async (req, res) => {
  const { exam_id, student_id } = req.body;

  try {
    const result = await pool.query(
      `
      SELECT 
        attempt,
        MIN(created_at) AS created_at, -- earliest submission timestamp of that attempt
        SUM(CASE WHEN eq.answer = er.student_answer THEN 1 ELSE 0 END) AS correct_answers,
        SUM(CASE WHEN eq.answer <> er.student_answer THEN 1 ELSE 0 END) AS wrong_answers
      FROM tbl_exam_result er
      JOIN tbl_exam_question eq ON eq.question_id = er.question_id
      WHERE er.exam_id = $1
        AND er.student_id = $2
        AND er.attempt <> '0'
      GROUP BY attempt
      ORDER BY attempt ASC
      `,
      [exam_id, student_id]
    );

    res.json({
      statusCode: 200,
      message: "Exam result fetched successfully",
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching exam result:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};


exports.getCoursesWithExamsAssignment = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.course_id,
        c.course_title,
        e.exam_id,
        e.exam_name
      FROM tbl_course c
      LEFT JOIN tbl_exam e ON c.course_id = e.course_id
      ORDER BY c.course_id, e.exam_id
    `;

    const { rows } = await pool.query(query);

    // Group exams by course
    const courses = [];
    const courseMap = {};

    rows.forEach(row => {
      if (!courseMap[row.course_id]) {
        courseMap[row.course_id] = {
          course_id: row.course_id,
          course_title: row.course_title,
          exams: []
        };
        courses.push(courseMap[row.course_id]);
      }

      if (row.exam_id) {
        courseMap[row.course_id].exams.push({
          exam_id: row.exam_id,
          exam_name: row.exam_name
        });
      }
    });

    res.status(200).json({
      statusCode: 200,
      message: "Courses with exams fetched successfully",
      data: courses
    });

  } catch (error) {
    console.error("Error fetching courses with exams:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Internal server error"
    });
  }
};
