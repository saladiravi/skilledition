const jwt=require('jsonwebtoken');
 
  

exports.genjwt=(payload)=>{
    
   return jwt.sign(payload,process.env.JWT_SECRET_KEY,{expiresIn:'1h'});
   
}


