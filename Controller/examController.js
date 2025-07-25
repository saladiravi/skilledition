const pool = require('../db/db');



exports.addExam = async (req, res) => {
  const { course_id, course_video_id, tutor_id, exam_name, questions } = req.body;

  if (!course_id || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: "Invalid data. course_id and questions are required." });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const existsQuery = `
      SELECT 1 FROM tbl_exam 
      WHERE course_id = $1 AND course_video_id = $2
    `;
    const existsResult = await client.query(existsQuery, [course_id, course_video_id]);

    if (existsResult.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        statusCode: 400,
        message: "An exam already exists for this course and video."
      });
    }

    const insertExamQuery = `
      INSERT INTO tbl_exam (course_id, course_video_id, tutor_id,exam_name)
      VALUES ($1, $2, $3,$4)
      RETURNING exam_id
    `;
    const examResult = await client.query(insertExamQuery, [course_id, course_video_id, tutor_id, exam_name]);
    const exam_id = examResult.rows[0].exam_id;

    const insertQuestionQuery = `
      INSERT INTO tbl_exam_question (question, a, b, c, d, answer, exam_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    for (const q of questions) {
      const { question, a, b, c, d, answer } = q;
      await client.query(insertQuestionQuery, [question, a, b, c, d, answer, exam_id]);
    }

    await client.query('COMMIT');
    res.status(200).json({
      statusCode: 200,
      message: "Exam and questions added successfully", exam_id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error inserting exam:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Server error"
    });
  } finally {
    client.release();
  }
};



// exports.getAllExams = async (req, res) => {
//   try {
//     const query = `
//       SELECT 
//         e.exam_id,
//         e.exam_name,
//         e.course_id,
//         c.course_title,
//         c.course_type,
//         c.course_image,
//         e.course_video_id,
//         v.course_video_title,
//         v.course_video,
//         v.duration,
//         e.tutor_id,
//         t.name AS tutor_name,
//         t.email AS tutor_email
//       FROM tbl_exam e
//       JOIN tbl_course c ON e.course_id = c.course_id
//       JOIN tbl_course_videos v ON e.course_video_id = v.course_video_id
//       JOIN tbl_tutor t ON e.tutor_id = t.tutor_id
//     `;

//     const result = await pool.query(query);
//     res.json(result.rows);

//   } catch (err) {
//     console.error("Error fetching exams:", err);
//     res.status(500).json({ message: "Failed to fetch exams" });
//   }
// };

exports.getAllExams = async (req, res) => {
  try {
    const query = `
      SELECT 
        e.exam_id,
        e.exam_name,
        e.course_id,
        c.course_title,
        c.course_type,
        c.course_image,
        e.tutor_id,
        t.name AS tutor_name,
        t.email AS tutor_email,
        -- Aggregate all videos for the course
        json_agg(
          json_build_object(
            'course_video_id', v.course_video_id,
            'course_video_title', v.course_video_title,
            'course_video', v.course_video,
            'duration', v.duration
          )
        ) AS course_videos
      FROM tbl_exam e
      JOIN tbl_course c ON e.course_id = c.course_id
      JOIN tbl_tutor t ON e.tutor_id = t.tutor_id
      JOIN tbl_course_videos v ON v.course_id = c.course_id
      GROUP BY 
        e.exam_id, e.exam_name, e.course_id,
        c.course_title, c.course_type, c.course_image,
        e.tutor_id, t.name, t.email
    `;

    const result = await pool.query(query);
    res.json(result.rows);

  } catch (err) {
    console.error("Error fetching exams:", err);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
};


exports.getAllExamsbytutor = async (req, res) => {
  try {
    const { tutor_id } = req.body;

    if (!tutor_id) {
      return res.status(400).json({ message: "tutor is required" });
    }

    const query = `
      SELECT 
        e.exam_id,
        e.exam_name,
        e.course_id,
        c.course_title,
        c.course_type,
        c.course_image,
        e.tutor_id,
        t.name AS tutor_name,
        t.email AS tutor_email,
        -- Aggregate all videos for the course
        json_agg(
          json_build_object(
            'course_video_id', v.course_video_id,
            'course_video_title', v.course_video_title,
            'course_video', v.course_video,
            'duration', v.duration
          )
        ) AS course_videos
      FROM tbl_exam e
      JOIN tbl_course c ON e.course_id = c.course_id
      JOIN tbl_tutor t ON e.tutor_id = t.tutor_id
      JOIN tbl_course_videos v ON v.course_id = c.course_id
      WHERE e.tutor_id = $1
      GROUP BY 
        e.exam_id, e.exam_name, e.course_id,
        c.course_title, c.course_type, c.course_image,
        e.tutor_id, t.name, t.email
    `;

    const result = await pool.query(query, [tutor_id]);
    res.json(result.rows);

  } catch (err) {
    console.error("Error fetching exams by tutor:", err);
    res.status(500).json({ message: "Failed to fetch exams by tutor" });
  }
};

exports.updateExam = async (req, res) => {
  const { exam_id } = req.body;
  const { course_id, course_video_id, tutor_id, exam_name, questions } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Step 1: Check if exam exists
    const examCheck = await client.query(`SELECT 1 FROM tbl_exam WHERE exam_id = $1`, [exam_id]);

    if (examCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        statusCode: 404,
        message: "  Exam not found."
      });
    }

    await client.query(
      `UPDATE tbl_exam 
       SET course_id = $1, course_video_id = $2, tutor_id = $3 ,exam_name=$4
       WHERE exam_id = $5`,
      [course_id, course_video_id, tutor_id, exam_name, exam_id]
    );


    await client.query(`DELETE FROM tbl_exam_question WHERE exam_id = $1`, [exam_id]);


    const insertQuestionQuery = `
      INSERT INTO tbl_exam_question (question, a, b, c, d, answer, exam_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    for (const q of questions) {
      const { question, a, b, c, d, answer } = q;
      await client.query(insertQuestionQuery, [question, a, b, c, d, answer, exam_id]);
    }

    await client.query('COMMIT');
    res.json({
      statusCode: 200,
      message: "Exam and questions updated successfully."
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Update error:", err);
    res.status(500).json({
      statusCode: 500,
      message: "Update failed."
    });
  } finally {
    client.release();
  }
};




exports.deleteExam = async (req, res) => {
  const { exam_id } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');


    await client.query(`DELETE FROM tbl_exam_question WHERE exam_id = $1`, [exam_id]);


    const result = await client.query(`DELETE FROM tbl_exam WHERE exam_id = $1`, [exam_id]);

    await client.query('COMMIT');

    if (result.rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Exam not found"
      });
    }

    res.json({
      statusCode: 200,
      message: "Exam and its questions deleted successfully."

    });

  } catch (err) {
    await client.query('ROLLBACK');

    res.status(500).json({ message: "Delete failed." });
  } finally {
    client.release();
  }
};




exports.getExamById = async (req, res) => {
  const { exam_id } = req.body;

  try {
    const examQuery = `
      SELECT 
        e.exam_id,
        e.exam_name,
        e.course_id,
        c.course_title,
        c.course_type,
        c.course_image,
        e.course_video_id,
        v.course_video_title,
        v.course_video,
        v.duration,
        e.tutor_id,
        t.name AS tutor_name,
        t.email AS tutor_email
      FROM tbl_exam e
      JOIN tbl_course c ON e.course_id = c.course_id
      JOIN tbl_course_videos v ON e.course_video_id = v.course_video_id
      JOIN tbl_tutor t ON e.tutor_id = t.tutor_id
      WHERE e.exam_id = $1
    `;

    const examResult = await pool.query(examQuery, [exam_id]);

    if (examResult.rowCount === 0) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const questionQuery = `
      SELECT question_id, question, a, b, c, d, answer 
      FROM tbl_exam_question 
      WHERE exam_id = $1
    `;
    const questionResult = await pool.query(questionQuery, [exam_id]);

    res.json({
      exam: examResult.rows[0],
      questions: questionResult.rows
    });

  } catch (err) {
    console.error("Error fetching exam by ID:", err);
    res.status(500).json({ message: "Failed to fetch exam" });
  }
};


exports.getExamcoursecoursevideoById = async (req, res) => {
  const { course_id, course_video_id } = req.body;

  try {
    // Step 1: Fetch the exam using course_id and course_video_id
    const examQuery = `
      SELECT 
        e.exam_id,
        e.exam_name,
        e.course_id,
        c.course_title,
        c.course_type,
        c.course_image,
        e.course_video_id,
        v.course_video_title,
        v.course_video,
        v.duration,
        e.tutor_id,
        t.name AS tutor_name,
        t.email AS tutor_email
      FROM tbl_exam e
      JOIN tbl_course c ON e.course_id = c.course_id
      JOIN tbl_course_videos v ON e.course_video_id = v.course_video_id
      JOIN tbl_tutor t ON e.tutor_id = t.tutor_id
      WHERE e.course_id = $1 AND e.course_video_id = $2
      LIMIT 1
    `;

    const examResult = await pool.query(examQuery, [course_id, course_video_id]);

    if (examResult.rowCount === 0) {
      return res.status(404).json({ message: "No exam found for this course and video" });
    }

    const exam = examResult.rows[0];

    // Step 2: Fetch questions using the found exam_id
    const questionQuery = `
      SELECT 
        question_id, question, a, b, c, d, answer 
      FROM tbl_exam_question 
      WHERE exam_id = $1
    `;

    const questionResult = await pool.query(questionQuery, [exam.exam_id]);

    res.json({
      exam,
      questions: questionResult.rows
    });

  } catch (err) {
    console.error("Error fetching exam with questions:", err);
    res.status(500).json({ message: "Failed to fetch exam and questions" });
  }
};

