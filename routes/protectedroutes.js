const express=require('express');
const routes=express.Router();
const verifytoken=require('../middleware/authmiddleware');

routes.get('/',verifytoken,(req,res)=>{
    res.status(200).json({
        message:'protected routes'
    })
})

module.exports=routes;
