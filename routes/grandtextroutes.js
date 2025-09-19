const express=require('express');
const routes=express.Router();
const grandtext= require('../Controller/grandtextcontroller');


routes.post('/getgrandtextquestion',grandtext.getExamsByCourseId);
routes.post('/submitgrandtext',grandtext.submitGrandTest);
routes.post('/evaluategrandtext',grandtext.evaluateGrandTest);


module.exports=routes