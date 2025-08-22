const express= require('express');
const routes=express.Router();
const examresult=require('../Controller/examresultController');



routes.post('/addexamresult',examresult.addExamResult);
routes.post('/getexamresult',examresult.getExamResult);
routes.post('/getexamattempts',examresult.getExamattempts);
routes.get('/getCourseWithExamsAssignment',examresult.getCoursesWithExamsAssignment);

 module.exports= routes