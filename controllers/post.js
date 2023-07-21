import User from "../models/User";
import Post from "../models/Post";
import cloudinary from 'cloudinary';

//configuring cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})

export const createPost = async (req, res) => {
    const { content, image } = req.body;

    if (!content.length) {
        return res.json({
            error: "Content is required"
        })
    }

    try {
        const post = new Post({ content, image, postedBy: req.auth._id });
        await post.save();

        const sendPost = await Post.findById(post._id).populate('postedBy', '-password -secret');
        console.log(post);
        console.log("this is post with user => ", sendPost);
        res.json(sendPost);
    } catch (err) {
        console.log(err);
        res.sendStatus(400);
    }
}

export const uploadImage = async (req, res) => {
    // console.log("req files => ", req.files);
    try {
        // grabing the file path in client's localstorage and setting it as parameter
        //  inside the upload function
        const result = await cloudinary.uploader.upload(req.files.image.path);
        res.json({
            url: result.secure_url,
            public_id: result.public_id
        })
    } catch (err) {
        console.log(err);
    }
}

export const postsByUser = async (req, res) => {
    try {
        // const posts = await Post.find({ postedBy: req.auth._id })
        const posts = await Post.find()
            .populate("postedBy", "_id username image")
            .sort({ createdAt: -1 })
            .limit(10)

        res.json(posts);
    } catch (err) {
        console.log(err);
    }
}

export const userPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params._id).populate("postedBy", "_id username image").populate("comments.postedBy", "_id  username image");;
        res.json(post);
    } catch (err) {
        console.log(err);
    }
}

export const updatePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params._id, req.body, {
            new: true
        });
        res.json(post);
    } catch (err) {
        console.log(err);
    }
}

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params._id);

        // remove image from cloudinary
        if (post.image && post.image.public_id) {
            const image = await cloudinary.uploader.destroy(post.image.public_id);
        }

        res.json({ ok: true })
    } catch (err) {
        console.log(err);
    }
}

export const newsFeed = async (req, res) => {
    try {
        const user = await User.findById(req.auth._id);
        if (user) {
            let followings = user.followings;
            followings.push(req.auth._id);

            //pagination 
            const { page } = req.query || 1;
            console.log(req.query)
            const limit = 12;
            // this will look for the post from the followings array according to the date postedBy
            const posts = await Post.find({ postedBy: { $in: followings } })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(12)
                .populate("postedBy", "_id username image")
                .populate("comments.postedBy", "_id  username image");

            console.log(posts.length)
            res.json(posts);
        } else {
            return res.sendStatus(401);
        }

    } catch (err) {
        console.log(err);
    }
}


export const likePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.body._id,
            {
                $addToSet: { likes: req.auth._id },
                $inc: { likesCount: 1 }
            },
            { new: true }
        ).populate("postedBy", "_id username image").populate("comments.postedBy", "_id  username image");

        res.json(post);
    } catch (err) {
        console.log(err);
    }
}

export const unlikePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.body._id,
            {
                $pull: { likes: req.auth._id },
                $inc: { likesCount: -1 }
            },
            { new: true }
        ).populate("postedBy", "_id username image").populate("comments.postedBy", "_id  username image");

        res.json(post);
    } catch (err) {
        console.log(err);
    }
}

export const addComment = async (req, res) => {
    try {
        const { postId, comment } = req.body;
        // here we have to populate this post to get the user info that posted this comment
        const post = await Post.findByIdAndUpdate(postId,
            {
                $push: { comments: { text: comment, postedBy: req.auth._id } },
                $inc: { commentsCount: 1 }
            },
            { new: true }
        ).populate("postedBy", "_id username image").populate("comments.postedBy", "_id  username image");

        res.json(post);
    } catch (err) {
        console.log(err);
    }
}

export const removeComment = async (req, res) => {
    try {
        const { postId, comment } = req.body;
        // here we have to populate this post to get the user info that posted this comment
        const post = await Post.findByIdAndUpdate(postId,
            {
                $pull: { comments: { _id: comment._id } },
                $inc: { commentsCount: -1 }
            },
            { new: true }
        ).populate("postedBy", "_id username image").populate("comments.postedBy", "_id  username image");

        res.json(post);
    } catch (err) {
        console.log(err);
    }
}

export const totalPosts = async (req, res) => {
    try {
        const total = await Post.find().estimatedDocumentCount();
        res.json(total);
    } catch (err) {
        console.log(err);
    }
}

export const profilePageTotalPosts = async (req, res) => {
    try {
        const user = await User.findById(req.auth._id);
        if (user) {
            let followings = user.followings;
            followings.push(req.auth._id);
            const total = await Post.countDocuments({ postedBy: { $in: followings } });
            console.log('profile page total posts => ', total);
            res.json(total);
        } else{
            return;
        }
    } catch (err) {
        console.log(err);
    }
}

export const posts = async (req, res) => {
    try {
        const limit = 5;
        const { page } = req.query || 1;

        const posts = await Post.find()
            .skip((page - 1) * limit)
            .populate("postedBy", "_id username image")
            .populate("comments.postedBy", "_id  username image")
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json(posts);
    } catch (err) {
        console.log(err);
    }
}

export const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params._id)
            .populate("postedBy", "_id username image")
            .populate("comments.postedBy", "_id  username image");

        res.json(post);
    } catch (err) {
        console.log(err);
    }
}



export const trendings = async (req, res) => {
    const data = await Post.find().sort({ likesCount: -1, commentsCount: -1 }).limit(10)
        .populate("postedBy", "_id username image")
        .populate("comments.postedBy", "_id  username image");

    res.json(data);
}

export const searchPost = async (req, res) => {
    const query = req.params.query;
    if (!query) return;
    const { page } = req.query || 1;
    console.log('page => ', page)
    const limit = 7;
    console.log(query)
    // $regex is a special method from mongodb
    // $options : 'i' is used for case-insensitive matching
    try {
        const posts = await Post.find({
            $or: [
                { content: { $regex: query, $options: 'i' } }
            ]
        })
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate("postedBy", "_id username image")
            .populate("comments.postedBy", "_id  username image");
        console.log("searched posts => ", posts);
        // to get exact amount of data count in collection with a specific field use use countDocuments otherwise getEstimatedDocumentCount
        const totalPosts = await Post.countDocuments({
            $or: [
                { content: { $regex: query, $options: 'i' } }
            ]
        })
        console.log('totalposts => ', totalPosts)
        res.json({
            data: posts,
            totalPosts: totalPosts
        });
    } catch (err) {
        console.log(err);
    }
}

export const findPostForAdmin = async (req, res) => {
    const id = req.params.id;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        try {

            const post = await Post.findById(id).populate("postedBy", "_id username image")
                .populate("comments.postedBy", "_id  username image");
            res.json(post);


        } catch (err) {
            console.log(err);
        }
    }

}