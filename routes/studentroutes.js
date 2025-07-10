const express =require('express');
const routes=express.Router();
const studentController=require('../Controller/studentController');
 

routes.post('/StudentRegister',studentController.studentRegister);
routes.post('/studentlogin',studentController.studentlogin);
routes.get('/getAllstudents',studentController.getallstudents);
routes.post('/updatestudents',studentController.updateStudent);




module.exports=routes