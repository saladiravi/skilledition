const pool= require('../db/db');
const crypto = require("crypto");
const axios = require("axios");
require("dotenv").config();
const uniqid = require("uniqid");

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





const PHONEPE_HOST_URL = "https://api.phonepe.com/apis/hermes";  // ✅ LIVE URL
const MERCHANT_ID = "M22TWMAY10FVB";
const SALT_KEY = "d1777065-5681-4e66-8c8d-9652b025cb96";
const SALT_INDEX = "1";

const staticamt=100

exports.initiatePayment = async (req, res) => {
  try {
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id ) {
      return res.status(400).json({
        statusCode: 400,
        message: "student_id, course_id, and amount are required",
      });
    }

    const merchantTransactionId = uniqid(); // Unique ID for this payment
    const payEndpoint = "/pg/v1/pay";

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: "MUID" + student_id,
      amount: staticamt * 100, // convert ₹ to paise
      redirectUrl: `https://api.skilledition.in/payment/redirect/${merchantTransactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `https://api.skilledition.in/payment/callback`,
      mobileNumber: "9951196669",
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const stringToSign = base64Payload + payEndpoint + SALT_KEY;
    const xVerify = crypto
      .createHash("sha256")
      .update(stringToSign)
      .digest("hex") + "###" + SALT_INDEX;

    const response = await axios.post(
      `${PHONEPE_HOST_URL}${payEndpoint}`,
      { request: base64Payload },
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
          "X-MERCHANT-ID": MERCHANT_ID,
        },
      }
    );

    console.log("✅ PhonePe Response:", response.data);
    const redirectUrl = response.data.data.instrumentResponse.redirectInfo.url;
    return res.json({ redirectUrl });
  } catch (error) {
    console.error("❌ Error in initiatePayment:", error.response?.data || error.message);
    return res.status(500).json({ error: error.response?.data || error.message });
  }
};

exports.paymentCallback = async (req, res) => {
  console.log("📩 Callback data received:", req.body);
  // TODO: You can verify payment status here or redirect user to success page
  res.send("Payment callback received successfully!");
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
