import jwt from "jsonwebtoken"

const isAuth = async (req, res, next) => {
    try {
        const {token} = req.cookies;

        if(!token  || typeof token !== "string") {
            return res.status(400).json({
                message:"user does not have a token or not in string format"
            })
        }
        const verifyToken= jwt.verify(token, process.env.JWT_SECRET)
        // console.log("Verify Token:", verifyToken);

        if(!verifyToken) {
            return res.status(400).json({
                message:"user does not have a valid token"
            })
        }
        req.userId = verifyToken.userId;
        next();
    } catch (error) {
        return res.status(500).json({
            message: `isAuth error ${error}`
        })
    }
}

export default isAuth;