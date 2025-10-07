const express=require('express');
const routes=express.Router();
const stundentCourse=require('../Controller/studentCourseController');

routes.post('/buyCourse',stundentCourse.buyStudentCourse);
routes.get('/getstudentCourses',stundentCourse.getStudentCourse);
routes.post('/getstudentmycourse',stundentCourse.getStudentCourseByid);
routes.post('/getstudentcourse',stundentCourse.getCourses);


routes.post("/payment/callback", async (req, res) => {
  try {
    const { transactionId, code } = req.body;
     

 
    const path = `/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${transactionId}`;
    const stringToSign = path + process.env.PHONEPE_SALT_KEY;
    const checksum =
      crypto.createHash("sha256").update(stringToSign).digest("hex") +
      "###" +
      process.env.PHONEPE_SALT_INDEX;

    const response = await axios.get(`${process.env.PHONEPE_BASE_URL}${path}`, {
      headers: {
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID,
      },
    });

    const paymentData = response.data;
    if (paymentData.success && paymentData.data.state === "COMPLETED") {
      await pool.query(
        `UPDATE public.tbl_student_course 
         SET status = $1 
         WHERE transaction_id = $2`,
        ["SUCCESS", transactionId]
      );
    } else {
      await pool.query(
        `UPDATE public.tbl_student_course 
         SET status = $1 
         WHERE transaction_id = $2`,
        ["FAILED", transactionId]
      );
    }

    res.status(200).send("Payment callback received");
  } catch (error) {
    console.error("Error in payment callback:", error);
    res.status(500).send("Callback error");
  }
});
 
module.exports=routes  