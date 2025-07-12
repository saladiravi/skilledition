const express=require('express');
const routes=express.Router();
const exmcontroller=require('../Controller/examController');

routes.post('/addExam',exmcontroller.addExam);
routes.get('/getExams',exmcontroller.getExams);
routes.post('/deletExam',exmcontroller.deleteExam);
routes.post('/updateExam',exmcontroller.updateExam);



module.exports=routes;
