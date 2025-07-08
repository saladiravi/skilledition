const pool= require('../db/db');
const bycrypt = require('bcryptjs')

exports.addtutor=async(req,res)=>{
    const {name ,email, phnumber, qualification, designation ,address ,password}=req.body
    try{
         if(!name || !email || !phnumber){
            return res.status(400).json({
                statusCode:400,
                message:'name ,email, phnumber are required'
            })
         }

         const existingtutor =await pool.query('SELECT * FROM tbl_tutor where email =$1', [email]);
         
         if(existingtutor.rows.length> 0){
            return res.status(400).json({
                statusCode:400,
                message:'Tutor Already Exits'   
            })
         }

         const hashedPassword=await bycrypt.hash(password,10);
         await pool.query(
            'INSERT INTO public.tbl_tutor (name ,email, phnumber, qualification, designation ,address, password,role_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
            [name ,email, phnumber, qualification, designation ,address,hashedPassword ,'Tutor']
         )
         res.status(200).json({
            statusCode:200,
            message:'Tutor added Sucessfully',
          
        })
    }catch(error){ 
        console.error(error)
        res.status(500).json({
            statusCode:500,
            message:'Internal Server Error'
           })
    }
}


exports.tutorlogin=async(req,res)=>{
    const {email, password} = req.body
       if(!email,!password){
        return res.status(400).json({
            statusCode:400,
            message:'Email and Password are Required'
        })
       }
    try{
       const result=await pool.query('SELECT * FROM tbl_tutor WHERE email=$1',[email])
       if(result.rows.length === 0){
         return res.status(400).json({
            statusCode:400,
            message:'Tutor Not Found'
         })
       }
       const tutor =result.rows[0];
       const isMatch=await bycrypt.compare(password,tutor.password);
       if(!isMatch){
        return res.status(401).json({
            statusCode:401,
            message:'Invalid Credentials'
        })
       }
       res.status(200).json({
        statusCode:200,
        message:'Login Sucessfully'
       })
    }catch(error){
        res.status(500).json({
            statusCode:500,
            message:'Internal Server error'
        })
    }
}



exports.getTutors=async(req,res)=>{
    try{
      const  result=await pool.query('SELECT * FROM tbl_tutor');
      if(result){
        return res.status(200).json({
            statusCode:200,
            message:'Tutor List',
            tutor:result.rows
        })
      }
    }catch(error){
        res.status(500).json({
            statusCode:500,
            message:'Internal Server Error'
        })
    }
}