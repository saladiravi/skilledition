const express=require('express');
const routes=express.Router();
const stundentCourse=require('../Controller/studentCourseController');

routes.post('/buyCourse',stundentCourse.buyStudentCourse);
routes.get('/getstudentCourses',stundentCourse.getStudentCourse);
routes.post('/getstudentmycourse',stundentCourse.getStudentCourseByid);
routes.post('/getstudentbuycourses',stundentCourse.getCourses) 
 
module.exports=routes  