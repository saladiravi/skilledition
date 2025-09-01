const express =require('express');
const routes=express.Router();
const tutorController=require('../Controller/tutorController');


routes.post('/addtutor',tutorController.addtutor);
routes.post('/tutorlogin',tutorController.tutorlogin);
routes.get('/getTutors',tutorController.getTutors);
routes.post('/updatetutor',tutorController.updateTutor);
routes.post('/gettutorbyid',tutorController.getTutorById);



module.exports=routes  