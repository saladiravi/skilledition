const pool=require('../db/db');
 

exports.addExam = async (req, res) => {
  const { course_id, course_video_id, questions } = req.body;

  if (!course_id || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: "course_id and questions array are required" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let q of questions) {
      await client.query(
        `INSERT INTO tbl_exam 
         (course_id, course_video_id, question, a, b, c, d, answer)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          course_id,
          course_video_id || null,
          q.question,
          q.a,
          q.b,
          q.c,
          q.d,
          q.answer
        ]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({ message: "Exam questions added successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: err.message || "Internal Server Error" });
  } finally {
    client.release();
  }
};


exports.updateExam = async (req, res) => {
  const { exam_id, question, a, b, c, d, answer } = req.body;

  if (!exam_id) {
    return res.status(400).json({ message: "exam_id is required" });
  }

  try {
    await pool.query(
      `UPDATE tbl_exam
       SET question = $1, a = $2, b = $3, c = $4, d = $5, answer = $6
       WHERE exam_id = $7`,
      [question, a, b, c, d, answer, exam_id]
    );

    res.status(200).json({ message: "Exam question updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal Server Error" });
  }
};


exports.deleteExam = async (req, res) => {
  const { exam_id } = req.params;

  if (!exam_id) {
    return res.status(400).json({ message: "exam_id is required" });
  }

  try {
    await pool.query(`DELETE FROM tbl_exam WHERE exam_id = $1`, [exam_id]);
    res.status(200).json({ message: "Exam question deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal Server Error" });
  }
};

 
exports.getExams = async (req, res) => {
  const { course_id } = req.query;
  
  let query = `SELECT * FROM tbl_exam`;
  let params = [];

  if (course_id) {
    query += ` WHERE course_id = $1`;
    params.push(course_id);
  }

  try {
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal Server Error" });
  }
};
