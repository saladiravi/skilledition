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
        [first_name ,last_name,phnumber,email,gender ,date_of_birth,qualification,college,pass_out_year,address,pincode,hashedPassword,'student']
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
            students:result.rows[0]
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



exports.updateStudent = async (req, res) => {
    const { student_id } = req.body;
    const { 
        first_name, last_name, phnumber, email, gender, 
        date_of_birth, qualification, college, pass_out_year, 
        address, pincode, password 
    } = req.body;

    try {
        if (!student_id) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Student  is required'
            });
        } 

        // Check if student exists
        const existingStudent = await pool.query('SELECT * FROM tbl_student WHERE student_id = $1', [student_id]);
        if (existingStudent.rows.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: 'Student not found'
            });
        }

        // Validate required fields
        if (!first_name || !phnumber || !email) {
            return res.status(400).json({
                statusCode: 400,
                message: 'first_name, phnumber, email are required'
            });
        }

        // Handle password
        let hashedPassword = existingStudent.rows[0].password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Update student
        await pool.query(
            `UPDATE tbl_student SET 
                first_name = $1,
                last_name = $2,
                phnumber = $3,
                email = $4,
                gender = $5,
                date_of_birth = $6,
                qualification = $7,
                college = $8,
                pass_out_year = $9,
                address = $10,
                pincode = $11,
                password = $12
             WHERE  student_id= $13`,
            [
                first_name, last_name, phnumber, email, gender, 
                date_of_birth, qualification, college, pass_out_year,
                address, pincode, hashedPassword, student_id
            ]
        );

        res.status(200).json({
            statusCode: 200,
            message: 'Student updated successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            statusCode: 500,
            message: 'Internal Server Error'
        });
    }
}
