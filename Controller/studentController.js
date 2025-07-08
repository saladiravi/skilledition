const pool=require('../db/db');
const bycrypt =require('bcryptjs');


exports.studentRegister=async(req,res)=>{
    const {first_name ,last_name,phnumber,email,gender ,date_of_birth,qualification,college,pass_out_year,address,pincode, password}=req.body
    try{
        if(!first_name || !phnumber|| !email ||!password){
           return res.status(400).json({
            statusCode:400,
            message:'ph Number , email ,password are reuired'
           })
        } 
     
        const exitingStudent=await pool.query('SELECT * FROM tbl_student where email =$1 ' ,[email]);
        if(exitingStudent.rows.length >0){
           return res.status(400).json({
                statusCode:400,  
                message:'Student Already Exits'
            })
        } 
       const hashedPassword= await  bycrypt.hash(password,10);
       await pool.query(
        'INSERT INTO public.tbl_student (first_name ,last_name,phnumber,email,gender ,date_of_birth,qualification,college,pass_out_year,address,pincode,password,role_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
        [first_name ,last_name,phnumber,email,gender ,date_of_birth,qualification,college,pass_out_year,address,pincode,hashedPassword,'Student']
       )
       res.status(200).json({
        statusCode:200,
        message:'Registred Sucessfully'
       })
    }catch(error){
        console.error(error)
        res.status(500).json({
            statusCode:500,
            message:'Internal Server Errror'
        })
    }
}


exports.studentlogin=async(req,res)=>{
    const {email,password} =req.body

      if(!email || !password){
           return res.status(400).json({
                statusCode:400,
                message:'email and password are required'
            })
         }
    try{ 
         const result=await pool.query('SELECT * FROM tbl_student WHERE email= $1',[email]);
         if(result.rows.length  === 0){
             return res.status(400).json({
                statusCode:400,
                message:'Student Not Found'
              })
         }
         const student=result.rows[0];
         const isMatch=await bycrypt.compare(password,student.password);
         if(!isMatch){
           return res.status(401).json({message:'Invalid Credentials'})
         }
         res.status(200).json({
            statusCode:200,
            message:'Login Sucessfully',
            
         })
    }catch(error){
        console.error(error)
          res.status(500).json({
            statusCode:500,
            message:'Internal Server error'
        })
    }
}


exports.getallstudents=async(req,res)=>{
    try{
        const result=await pool.query('SELECT * FROM tbl_student');
        if(result){
            res.status(200).json({
                statusCode:200,
                message:'Student List',
                students:result.rows
            })
        }
    }catch(error){
        res.status(500).json({
            statusCode:500,
            message:'Internal Server Error'
        })
    }
}   