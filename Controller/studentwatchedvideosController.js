const pool=require('../db/db');


exports.addStudentVideoProgress=async(req,res)=>{
    try{
       const {student_id,course_id,course_video_id,watched}=req.body

       if(!student_id || course_id || course_video_id){
        res.status(400).json({
            statusCode:400,
            message:'Fields are required'
        })
       }
       const result =await pool.query(`INSERT INTO tbl_video_progress (student_id,course_id,course_video_id,watched) 
        VALUES ($1,$2,$3,$4)`,[student_id,course_id,course_video_id,'true']);
        if(result.rows.length>0){
            res.status(200).json({
                statusCode:200,
                
            })
        }
    }catch(error){
        res.status(500).json({
            statusCode:500,
            message:'Internal Server Error'
            
        })
    }
}
