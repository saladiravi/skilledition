const express= require('express');
const routes=express.Router();
const courseController=require('../Controller/courseController');
const uploads=require('../utils/uploadfile');


routes.post('/addCourse',uploads.fields([{name:'course_image',maxCount:1},{name:'course_video',maxCount:10}]),courseController.addCourseWithVideos);
routes.get('/getCourse',courseController.getCourses);
routes.post(
  '/updateCourse',
  uploads.fields([
    { name: 'course_image', maxCount: 1 },
    { name: 'course_video', maxCount: 10 },
  ]),
  courseController.updateCourseWithVideos
);
routes.post('/deleteCourse',courseController.deleteCourse);
routes.post('/getcoursebyid',courseController.getCourseById);


module.exports=routes