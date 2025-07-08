const pool= require('../db/db');

exports.buyStudentCourse = async (req, res) => {
  try {
    const { student_id, course_id, purchase_date } = req.body;

    if (!student_id || !course_id) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Student ID and Course ID are required',
      });
    }

    const coursestudent = await pool.query(
      `INSERT INTO public.tbl_student_course (student_id, course_id, purchase_date) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [student_id, course_id, purchase_date]
    );

    if (coursestudent.rows.length > 0) {
      return res.status(200).json({
        statusCode: 200,
        message: 'Course purchased successfully',
        buycourse: coursestudent.rows[0],  // returning the inserted row
      });
    } else {
      return res.status(500).json({
        statusCode: 500,
        message: 'Course purchase failed',
      });
    }
  } catch (error) {
    console.error('Error in buyStudentCourse:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
};


exports.getStudentCourse =async(req,res)=>{
    try{
        const query=`SELECT tc.*,ts.first_name 
        FROM tbl_student_course tsc
         INNER JOIN tbl_course tc ON  tsc.course_id=tc.course_id
         INNER JOIN tbl_student ts ON  tsc.student_id=ts.student_id`;

         const studentCourse=await pool.query(query);
         res.json(studentCourse.rows);

    }catch(error){
        console.error(error)
        res.status(500).json({
            statusCode:500,
            message:'Internal Server Error'
        })
    }
}

exports.getStudentCourseByid = async (req, res) => {
  try {
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Student ID is required',
      });
    }

    const query = `
      SELECT 
        tc.*, 
        tsc.purchase_date 
      FROM 
        tbl_student_course tsc
      INNER JOIN 
        tbl_course tc ON tsc.course_id = tc.course_id
      WHERE 
        tsc.student_id = $1
    `;

    const result = await pool.query(query, [student_id]);

    return res.status(200).json({
      statusCode: 200,
      courses: result.rows,
    });

  } catch (error) {
    console.error('Error fetching student course by ID:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
};


   