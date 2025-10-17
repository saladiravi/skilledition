const pool= require('../db/db');
const crypto = require("crypto");
const axios = require("axios");
require("dotenv").config();
const uniqid = require("uniqid");


const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY
const CASHFREE_BASE_URL = process.env.CASHFREE_BASE_URL

const staticamt=1

exports.initiatePayment = async (req, res) => {
  try {
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id ) {
      return res.status(400).json({
        statusCode: 400,
        message: "student_id, course_id, and amount are required",
      });
    }

    // 1️⃣ Fetch student details from tbl_student
    const studentResult = await pool.query(
      `SELECT first_name, last_name, email, phnumber 
       FROM tbl_student 
       WHERE student_id = $1`,
      [student_id]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Student not found",
      });
    }

    const student = studentResult.rows[0];

    // 2️⃣ Generate unique transaction/order ID
    const orderId = uniqid("CF_");

    // 3️⃣ Insert initial record into tbl_student_course
    await pool.query(
      `INSERT INTO tbl_student_course 
       (student_id, course_id, purchase_date, transaction_id, status) 
       VALUES ($1, $2, CURRENT_DATE, $3, 'PENDING')`,
      [student_id, course_id, orderId]
    );

    // 4️⃣ Build Cashfree order payload
    const payload = {
      order_id: orderId,
      order_amount: 1.00,
      order_currency: "INR",
      customer_details: {
        customer_id: `STU_${student_id}`,
        customer_email: student.email,
        customer_phone: student.phnumber
      },
      order_meta: {
        return_url: `https://api.skilledition.in/studentcourse/payment/redirect/${orderId}`,
        notify_url: `https://api.skilledition.in/payment/callback`
      }
    };

    // 5️⃣ Cashfree API headers
    const headers = {
      accept: "application/json",
      "content-type": "application/json",
      "x-client-id": process.env.CASHFREE_APP_ID,
      "x-client-secret": process.env.CASHFREE_SECRET_KEY,
      "x-api-version": "2025-01-01"
    };

    // 6️⃣ Create order in Cashfree
    const response = await axios.post(process.env.CASHFREE_BASE_URL, payload, { headers });

    console.log("✅ Cashfree Response:", response.data);

    // 7️⃣ Return payment URL to frontend
    return res.json({
      statusCode: 200,
      paymentUrl: response.data.payment_link,
      transactionId: orderId,
      studentName: `${student.first_name} ${student.last_name}`
    });

  } catch (error) {
    console.error("❌ Error in initiatePayment:", error.response?.data || error.message);
    return res.status(500).json({ error: error.response?.data || error.message });
  }
};


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






exports.paymentCallback = async (req, res) => {
  try {
    console.log("📥 Cashfree Callback:", req.body);

    const { order_id, order_status } = req.body.data;

    if (order_status === "PAID") {
      await pool.query(
        `UPDATE tbl_student_course SET status = 'SUCCESS' WHERE transaction_id = $1`,
        [order_id]
      );
    } else {
      await pool.query(
        `UPDATE tbl_student_course SET status = 'FAILED' WHERE transaction_id = $1`,
        [order_id]
      );
    }

    // ✅ Always respond with 200 to acknowledge callback
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error in paymentCallback:", error);
    return res.status(500).json({ success: false });
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
