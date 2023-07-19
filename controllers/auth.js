import User from "../models/User";
import { hashPassword, comparePassword } from "../helpers/auth";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
    const { username, email, password, secret, phone, address } = req.body;

    if (!username) {
        return res.json({
            error: "Username is required"
        })
    }

    if (!email) {
        return res.json({
            error: "E-mail is required"
        })
    }

    if (!password || password.length < 6) {
        return res.json({
            error: "Password is required and must be minimum of 6 characters long"
        })
    }

    if (!secret) {
        return res.json({
            error: "Answer is required"
        })
    }

    const exist = await User.findOne({ 'email': email });

    if (exist) {
        return res.json({
            error: "E-mail is taken. Try with another email."
        })
    } else {
        const hashedPassword = await hashPassword(password);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            secret, address, phone
        });

        try {
            newUser.save();
            console.log("successfully save user => ", newUser);
            return res.json({
                ok: true
            })
        } catch (err) {
            console.log(err);
            return res.status(400).send("Error Occured. Try Again");
        }

    }

}

export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                error: "No user found!"
            })
        }

        const match = await comparePassword(password, user.password);
        // console.log(match)
        if (!match) {
            return res.json({
                error: "Wrong password"
            })
        }

        // create signed token
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        })

        user.password = undefined;
        user.secret = undefined;

        return res.json({
            token, user
        })
    } catch (err) {
        console.log(err);
        return res.status(500).send("Error. Try Again");
    }
}


export const forgotPassword = async (req, res) => {
    const { email, newPassword, secret } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.json({
            error: "New Password is required and must be minimum of 6 characters long!"
        });
    }

    if (!secret) {
        return res.json({
            error: "Secret is required"
        })
    }

    const user = await User.findOne({ email, secret });

    if (!user) {
        return res.json({
            error: "We can not verify you with those details. Try Again."
        })
    }

    try {
        const hashed = await hashPassword(newPassword);
        await User.findByIdAndUpdate(user._id, { password: hashed });
        return res.json({
            success: "Congrats, Now you can sign in with your new password!"
        })
    } catch (err) {
        console.log(err);
        return res.json({
            error: "Something went wrong. Try Again"
        })
    }
}

export const currentUser = async (req, res) => {
    try {

        // here in req.auth._id, we are grabbing the user from the request body
        // cause while signing in the user in frontend we are saving the user in request body 
        // with jsonwebtoken. in jsonwebtoken they automatically creates an auth object, containing 
        // current user'id and his token expiring infos.
        // console.log(req);
        const user = await User.findById(req.auth._id);
        if (user) {
            return res.json({ ok: true })
        }
    } catch (err) {
        console.log(err);
        return res.sendStatus(400);
    }
}

export const profileUpdate = async (req, res) => {
    try {
        console.log(req.body);
        const data = {};

        if (req.body.username) {
            data.username = req.body.username;
        };

        if (req.body.phone) {
            data.phone = req.body.phone;
        };

        if (req.body.address) {
            data.address = req.body.address;
        };

        if (req.body.about) {
            data.about = req.body.about;
        };
        if (req.body.password) {
            if (req.body.password.length < 6) {
                return res.json({
                    error: "Password is required and should be 6 character long."
                })
            } else {
                data.password = await hashPassword(req.body.password);
            }
        };
        if (req.body.secret) {
            data.secret = req.body.secret;
        };
        if (req.body.image) {
            data.image = req.body.image;
        };
        let user = await User.findByIdAndUpdate(req.auth._id, data, { new: true });
        user.password = undefined;
        user.secret = undefined;

        res.json(user);
    } catch (err) {
        if (err.code === 11000) {
            return res.json({ error: "Duplicate Username" });
        }

        console.log(err);
    }
}

export const findPeople = async (req, res) => {
    try {
        const user = await User.findById(req.auth._id);
        let followings = user.followings;
        followings.push(user._id);

        //find people to follow only without the followings array
        const people = await User.find({ _id: { $nin: followings } }).select("-password -secret").limit(10);
        res.json(people);
    } catch (err) {
        console.log(err);
    }
}

// middlewares
export const addFollower = async (req, res, next) => {
    try {
        // $addToSet is used to avoid duplicate item in an array and "new" method to send the updated response
        const user = await User.findByIdAndUpdate(req.body._id, {
            $addToSet: { followers: req.auth._id }
        });
        next();
    } catch (err) {
        console.log(err);
    }
}

export const userFollow = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.auth._id, {
            $addToSet: { followings: req.body._id }
        }, { new: true }).select("-password -secret");

        res.json(user);
    } catch (err) {
        console.log(err);
    }
}

export const userFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.auth._id);
        const followings = await User.find({ _id: user.followings }).select("-password -secret").limit(100);
        res.json(followings);
    } catch (err) {
        console.log(err);
    }
}

//middleware
export const removeFollower = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.body._id, {
            $pull: { followers: req.auth._id }
        });
        next();
    } catch (err) {
        console.log(err);
    }
}

export const userUnfollow = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.auth._id,
            {
                $pull: { followings: req.body._id }
            },
            { new: true }
        )

        res.json(user);
    } catch (err) {
        console.log(err);
    }
}

export const searchUser = async (req, res) => {
    const { query } = req.params;
    if (!query) return;

    // $regex is a special method from mongodb
    // $options : 'i' is used for case-insensitive matching
    try {
        const user = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } }
            ]
        }).select("-password -secret");
        console.log(user)
        res.json(user);
    } catch (err) {
        console.log(err);
    }
}

export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password -secret");
        res.json(user);
    } catch (err) {
        console.log(err);
    }
}