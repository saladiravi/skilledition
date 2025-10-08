const express=require('express');
const routes=express.Router();
const stundentCourse=require('../Controller/studentCourseController');

routes.post('/buyCourse',stundentCourse.buyStudentCourse);
routes.get('/getstudentCourses',stundentCourse.getStudentCourse);
routes.post('/getstudentmycourse',stundentCourse.getStudentCourseByid);
routes.post('/getstudentcourse',stundentCourse.getCourses);



// routes.post('/payment',stundentCourse.initiatePayment);
routes.post('/callback',stundentCourse.paymentCallback);


 
 
module.exports=routes  