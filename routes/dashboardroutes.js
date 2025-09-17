const express= require('express');
const routes=express.Router();
const dashboardController=require('../Controller/dashboardController');



 routes.get('/admindashboard',dashboardController.getAdminDashboardCounts);
 routes.post('/tutordashboard',dashboardController.getTutorDashboardCounts);
 routes.post('/studentdashboard',dashboardController.getStudentDashboardCounts);
 
 


 module.exports=routes