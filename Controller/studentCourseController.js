const pool= require('../db/db');
const crypto = require("crypto");
const axios = require("axios");
require("dotenv").config();

// exports.buyStudentCourse = async (req, res) => {
//   try {
//     const { student_id, course_id, purchase_date } = req.body;

//     if (!student_id || !course_id) {
//       return res.status(400).json({
//         statusCode: 400,
//         message: 'Student ID and Course ID are required',
//       });
//     }

//     const coursestudent = await pool.query(
//       `INSERT INTO public.tbl_student_course (student_id, course_id, purchase_date) 
//        VALUES ($1, $2, $3) 
//        RETURNING *`,
//       [student_id, course_id, purchase_date]
//     );

//     if (coursestudent.rows.length > 0) {
//       return res.status(200).json({
//         statusCode: 200,
//         message: 'Course purchased successfully',
//         buycourse: coursestudent.rows[0],  // returning the inserted row
//       });
//     } else {
//       return res.status(500).json({
//         statusCode: 500,
//         message: 'Course purchase failed',
//       });
//     }
//   } catch (error) {
//     console.error('Error in buyStudentCourse:', error);
//     return res.status(500).json({
//       statusCode: 500,
//       message: 'Internal Server Error',
//     });
//   }
// };

exports.buyStudentCourse = async (req, res) => {
  try {
    const { student_id, course_id, amount } = req.body;

    if (!student_id || !course_id || !amount) {
      return res.status(400).json({
        statusCode: 400,
        message: "Student ID, Course ID, and Amount are required",
      });
    }

    // Step 1: Generate a unique transaction ID
    const merchantTransactionId = "TXN" + Date.now();

    // Step 2: Create a pending record in DB (status = INITIATED)
    await pool.query(
      `INSERT INTO public.tbl_student_course (student_id, course_id, purchase_date, status, transaction_id)
       VALUES ($1, $2, NOW(), $3, $4)`,
      [student_id, course_id, "INITIATED", merchantTransactionId]
    );

    // Step 3: Create payload for PhonePe API
    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: student_id.toString(),
      amount: amount * 100, // convert ₹ to paise
      redirectUrl: `${process.env.BASE_URL}/payment/callback`,
      redirectMode: "POST",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const data = Buffer.from(JSON.stringify(payload)).toString("base64");

    const stringToSign = data + "/pg/v1/pay" + process.env.PHONEPE_SALT_KEY;
    const checksum =
      crypto.createHash("sha256").update(stringToSign).digest("hex") +
      "###" +
      process.env.PHONEPE_SALT_INDEX;

    // Step 4: Initiate payment request to PhonePe
    const response = await axios.post(
      `${process.env.PHONEPE_BASE_URL}/pg/v1/pay`,
      { request: data },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID,
        },
      }
    );

    // Step 5: Return payment URL to frontend
    const paymentUrl = response.data?.data?.instrumentResponse?.redirectInfo?.url;
    if (paymentUrl) {
      return res.status(200).json({
        statusCode: 200,
        message: "Redirect to PhonePe Payment Page",
        paymentUrl,
        transactionId: merchantTransactionId,
      });
    } else {
      return res.status(500).json({
        statusCode: 500,
        message: "Unable to get payment URL",
      });
    }
  } catch (error) {
    console.error("Error in buyStudentCourse:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
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
      message:'Fetched Sucessfully',
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


   

exports.getCourses = async (req, res) => {
  try {
    const { student_id } = req.body; // pass student_id from frontend
  
    if (!student_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "student is required"
      });
    }

    // 🔍 Step 1: Check if student exists
    const checkStudentQuery = `SELECT 1 FROM tbl_student WHERE student_id = $1 LIMIT 1`;
    const studentCheck = await pool.query(checkStudentQuery, [student_id]);

    if (studentCheck.rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Student not found"
      });
    }
    
    const query = `
      SELECT 
        tc.course_id,
        tc.course_image,
        tc.course_title,
        tc.course_type,
        tc.course_description,
        tc.course_price,
        tc.tutor_id,
        t.name AS tutor_name,
        tvc.course_video_title,
        tvc.course_video,
        tvc.duration,
        tvc.course_video_id
      FROM tbl_course tc
      INNER JOIN tbl_course_videos tvc ON tc.course_id = tvc.course_id
      LEFT JOIN tbl_tutor t ON tc.tutor_id = t.tutor_id
      WHERE NOT EXISTS (
        SELECT 1 
        FROM tbl_student_course sc 
        WHERE sc.course_id = tc.course_id 
        AND sc.student_id = $1
      )
      ORDER BY tc.course_id;
    `;

    const result = await pool.query(query, [student_id]);

    // Group by course
    const coursesMap = {};

    for (let row of result.rows) {
      if (!coursesMap[row.course_id]) {
        coursesMap[row.course_id] = {
          course_id: row.course_id,
          course_image: row.course_image,
          course_title: row.course_title,
          course_type: row.course_type,
          course_description: row.course_description,
          course_price: row.course_price,
          tutor: {
            tutor_id: row.tutor_id,
            tutor_name: row.tutor_name
          },
          videos: []
        };
      }
      coursesMap[row.course_id].videos.push({
        course_video_id: row.course_video_id,
        course_video_title: row.course_video_title,
        course_video: row.course_video,
        duration: row.duration
      });
    }

    const courses = Object.values(coursesMap);

    res.json({
      statusCode: 200,
      message: 'Courses Fetched Successfully',
      course: courses
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error'
    });
  }
};
