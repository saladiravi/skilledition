const express=require('express');
const routes=express.Router();
const grandtext= require('../Controller/grandtextcontroller');


routes.post('/getgrandtextquestion',grandtext.getQuestionsByCourseId);
routes.post('/submitgrandtext',grandtext.submitGrandTest);
routes.post('/evaluategrandtext',grandtext.evaluateGrandTest);


module.exports=routes