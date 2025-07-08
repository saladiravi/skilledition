const express=require('express');
const routes=express.Router();
const stundentCourse=require('../Controller/studentCourseController');

routes.post('/buyCourse',stundentCourse.buyStudentCourse);
routes.get('/getstudentCourses',stundentCourse.getStudentCourse);
routes.post('/getCourseBystudent',stundentCourse.getStudentCourseByid);
routes.post('/');
 
module.exports=routes  