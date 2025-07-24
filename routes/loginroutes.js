const express=require('express');
const routes=express.Router();
const  logincontroller=require('../Controller/loginController');
 
routes.post('/login',logincontroller.userLogin);

module.exports=routes