const express= require('express');
const routes=express.Router();
const dashboardController=require('../Controller/dashboardController');



 routes.get('/totalcoursecount',dashboardController.getTotalCoursesCount);
 routes.post('/mycoursecount',dashboardController.getMyCoursesCount);
 routes.post('/tutorscoursecount',dashboardController.getTutorCoursesCount);
 routes.get('/studentcount',dashboardController.getStudentCount);


 module.exports=routes