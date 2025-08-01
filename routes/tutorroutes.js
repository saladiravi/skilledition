const express =require('express');
const routes=express.Router();
const tutorController=require('../Controller/tutorController');


routes.post('/addtutor',tutorController.addtutor);
routes.post('/tutorlogin',tutorController.tutorlogin);
routes.get('/getTutors',tutorController.getTutors);
routes.post('/updatetutor',tutorController.updateTutor);


module.exports=routes  