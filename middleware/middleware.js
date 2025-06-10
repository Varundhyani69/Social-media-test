const jwt = require('jsonwebtoken');

const cookieData = async(req,res,next)=>{
    const {token} = req.cookies;
    try {
        if(!token){
            return res.json({success:false,message:"Not authorized! Login again"});
        }
        const tokenDecode = jwt.verify(token,process.env.JWT_SECRET);
        if(tokenDecode){
            req.userId = tokenDecode.id;
        }else{
            return res.json({success:false,message:"login again"});
        }
        next();
    } catch (error) {
        return res.json({success:false,message:error.message});
    }
}

module.exports = cookieData;