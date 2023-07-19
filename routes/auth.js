import express from 'express';
const router = express.Router();

import { requireSignin, isAdmin } from "../middlewares/index";
import {
    signup,
    signin,
    forgotPassword,
    currentUser,
    profileUpdate,
    findPeople,
    addFollower,
    userFollow,
    userFollowing,
    removeFollower,
    userUnfollow,
    searchUser,
    getUser
} from '../controllers/auth';

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/forgot-password', forgotPassword);
router.get('/current-user', requireSignin, currentUser);
router.put("/profile-update", requireSignin, profileUpdate);
router.get("/find-people", requireSignin, findPeople);
router.put("/user-follow", requireSignin, addFollower, userFollow);
router.put("/user-unfollow", requireSignin, removeFollower, userUnfollow);
router.get('/user-followings', requireSignin, userFollowing);
router.get('/search-user/:query', searchUser);
router.get('/user/:id', getUser);
router.get('/current-admin', requireSignin, isAdmin, currentUser);

module.exports = router;