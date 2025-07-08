const express=require('express');
const routes=express.Router();
const  admincontroller=require('../Controller/admincontroller');

routes.post('/registration', admincontroller.register);
routes.post('/adminlogin',admincontroller.adminLogin);

module.exports=routes

