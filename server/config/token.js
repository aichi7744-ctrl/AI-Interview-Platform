import jwt from "jsonwebtoken"

const getToken = (userId) => {
    try {
        const token = jwt.sign({userId}, process.env.JWT_SECRET, 
    {expiresIn:"7d"})
    console.log("get token:", typeof token)
    return token;
    } catch (error) {
        console.log(error);
    }

}

export default getToken;
  