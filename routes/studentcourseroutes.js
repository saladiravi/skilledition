const express=require('express');
const routes=express.Router();
const stundentCourse=require('../Controller/studentCourseController');

routes.post('/buyCourse',stundentCourse.buyStudentCourse);
routes.get('/getstudentCourses',stundentCourse.getStudentCourse);
routes.post('/getstudentmycourse',stundentCourse.getStudentCourseByid);
routes.post('/getstudentcourse',stundentCourse.getCourses);



routes.post('/payment',stundentCourse.initiatePayment);
routes.post('/callback',stundentCourse.paymentCallback);

// For showing user a success/failure page after payment
routes.get('/payment/redirect/:transactionId', async (req, res) => {
  const { transactionId } = req.params;

  try {
    const result = await pool.query(
      'SELECT status FROM tbl_student_course WHERE transaction_id = $1',
      [transactionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Transaction not found");
    }

    const status = result.rows[0].status;

    if (status === "SUCCESS") {
      return res.send("🎉 Payment Successful!");
    } else if (status === "FAILED") {
      return res.send("❌ Payment Failed. Please try again.");
    } else {
      return res.send("⏳ Payment is pending...");
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
});

 
 
module.exports=routes  