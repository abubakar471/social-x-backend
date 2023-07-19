import Post from "../models/Post";
const { expressjwt: expressJWT } = require('express-jwt');

export const requireSignin = expressJWT({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"]
})

export const canEditDeletePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params._id);
        if (req.auth._id != post.postedBy) {
            return res.status(400).send("Unauthorized");
        } else {
            next();
        }
    } catch (err) {
        console.log(err);
    }
}

export const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.auth._id);

        if (user.role !== "Admin") {
            return res.status(400).json("Unauthorized");
        } else {
            next();
        }
    } catch (err) {
        console.log(err);
    }
}