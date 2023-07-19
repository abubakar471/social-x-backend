import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    password: {
        type: String,
        min: 6,
        max: 32,
        required: true
    },
    phone: {
        type: String
    },
    address: {
        type: String
    },
    secret: {
        type: String,
        required: true
    },
    image: {
        url: String,
        public_id: String
    },
    about: {},
    followings: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    role: {
        type: String,
        default: "Subscriber"
    }
}, {
    timestamps: true
})

export default mongoose.model("User", userSchema);