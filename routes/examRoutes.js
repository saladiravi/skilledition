const express=require('express');
const routes=express.Router();
const exmcontroller=require('../Controller/examController');

routes.post('/addExam',exmcontroller.addExam);
routes.get('/getallExams',exmcontroller.getAllExams);
routes.post('/deleteExam',exmcontroller.deleteExam);
routes.post('/updateExam',exmcontroller.updateExam);
routes.post('/getexambyid',exmcontroller.getExamById);
routes.post('/getexambycoursevideos',exmcontroller.getExamcoursecoursevideoById);


module.exports=routes;
