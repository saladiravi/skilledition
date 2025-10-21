const pool= require('../db/db');
const crypto = require("crypto");
const axios = require("axios");
const uniqid = require("uniqid");
const dotenv = require("dotenv");
const { Cashfree, CFEnvironment } = require("cashfree-pg");
 

dotenv.config();

console.log("CASHFREE_APP_ID:", process.env.CASHFREE_APP_ID);
console.log("CASHFREE_SECRET_KEY:", process.env.CASHFREE_SECRET_KEY);

const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION, // change to CFEnvironment.SANDBOX for testing
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);


if (cashfree) {
  console.log("✅ Cashfree SDK initialized successfully");
} else {
  console.log("❌ Cashfree SDK failed to initialize");
}
 

exports.initiatePayment = async (req, res) => {
  try {
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "student_id and course_id are required",
      });
    }

    // 1️⃣ Fetch student details
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

    // 2️⃣ Create a unique order ID
    const orderId = uniqid("CF_");

    // 3️⃣ Save initial order in your DB
    await pool.query(
      `INSERT INTO tbl_student_course 
       (student_id, course_id, purchase_date, transaction_id, status) 
       VALUES ($1, $2, CURRENT_DATE, $3, 'PENDING')`,
      [student_id, course_id, orderId]
    );

    // 4️⃣ Prepare Cashfree order request
    const request = {
      order_amount: 1.0, // set dynamic course price if available
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: `STU_${student_id}`,
        customer_email: student.email,
        customer_phone: student.phnumber,
      },
    order_meta: {
      return_url: `https://skilledition.in/payment/success/${orderId}`,
      notify_url: `https://skilledition.in/studentcourse/payment/callback`,
      payment_methods: "cc,dc,upi"
    }


    };

    // 5️⃣ Create order using Cashfree SDK
    const response = await cashfree.PGCreateOrder(request);

    console.log("✅ Cashfree Order Created:", response.data);

    // 6️⃣ Return payment details to frontend
    return res.json({
      statusCode: 200,
      paymentSessionId: response.data.payment_session_id,
      orderId: response.data.order_id,
      studentName: `${student.first_name} ${student.last_name}`,
      paymentLink: response.data.payment_link, // optional
    });
  } catch (error) {
    console.error("❌ Error in initiatePayment:", error.response?.data || error.message);
    return res.status(500).json({
      statusCode: 500,
      error: error.response?.data || error.message,
    });
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
