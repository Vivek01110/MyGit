import {
    getCurrentUser,
    updateUserProfile,
    getUserByUsername
} from "../services/auth.service.js";
import Repository from "../models/repository.model.js";

export const getMe = async (req, res) => {
    try {
        const user = await getCurrentUser(req.userId);
        const repositories = await Repository.find({ owner: req.userId }).sort({ updatedAt: -1 });

        return res.status(200).json({
            user,
            repositories
        });
    } catch (error) {
        return res.status(404).json({
            message: error.message
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, bio, avatar, location, website } = req.body;

        const updatedUser = await updateUserProfile(req.userId, {
            name,
            bio,
            avatar,
            location,
            website
        });

        return res.status(200).json({
            message: "Profile updated successfully.",
            user: updatedUser
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await getUserByUsername(username);

        // Fetch repositories for this user
        const isOwner = req.userId && req.userId === user.id;
        const query = { owner: user.id };
        if (!isOwner) {
            query.visibility = "public";
        }

        const repositories = await Repository.find(query).sort({ updatedAt: -1 });

        return res.status(200).json({
            user,
            repositories,
            isOwner: !!isOwner
        });
    } catch (error) {
        return res.status(404).json({
            message: error.message
        });
    }
};