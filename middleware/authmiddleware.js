const jwt=require('jsonwebtoken');

function verifytoken(req,res,next){
    const token=req.header('Authorization');
    if(!token)
        return res.status(401).json({
            error:'Acess denied'
        })
    try{
     const decoded=jwt.verify(token,'');
     req.userId=decoded.userId;
     next();
     
    }catch(error){
        res.status(401).json({
            
        })
    }
}

 
module.exports=verifytoken