const express=require('express');
const routes=express.Router();
const examcontroller=require('../Controller/examController');


routes.post('/addExam',examcontroller.addexam);
routes.get('/getExams',examcontroller.getAllExams);
routes.post('/deletExam',examcontroller.deleteExam);
routes.post('/updateExam',examcontroller.updateExam);



module.exports=routes;
