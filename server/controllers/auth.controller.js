import User from "../models/user.model.js"
import getToken from "../config/token.js";

export const googleAuth = async(req,res)=>{
    try {
        let {name, email} = req.body;
        const user = await User.findOne({email});
        if(!user) {
            user = User.create({
                name,
                email
            })
        }

        let token = getToken(user._id);
        console.log("auth controller", token);
        res.cookie("token", token, {
           httpOnly: true,
           sameSite:"lax",
           secure:false,
           maxAge:7*24*60*60*1000
        })

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({message:`Google 
            auth error ${error}`})
    }
}

export const logOut = async (req,res)=> {
    try {
        await res.clearCookie("token");
        return res.status(200).json({messge:"Logout Successfully"});
    } catch (error) {
        return res.status(500).json({
            message:`Logout error ${error}`
        })
    }
}