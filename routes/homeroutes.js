const express=require('express');
const routes=express.Router();
const hmecontroller=require('../Controller/homeController');

routes.get('/getcourse',hmecontroller.getCoursesWithCount);
routes.post('/getcoursebyid',hmecontroller.getCourseVideos)
routes.post('/getcoursevideos',hmecontroller.getCourseVideoById)



module.exports=routes; 
