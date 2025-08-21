const express= require('express');
const routes=express.Router();
const examresult=require('../Controller/examresultController');



routes.post('/addexamresult',examresult.addExamResult);
routes.post('/getexamresult',examresult.getExamResult);
 

 module.exports= routes