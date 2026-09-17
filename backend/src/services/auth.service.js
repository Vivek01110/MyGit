import bcrypt from "bcrypt";
import User from "../models/user.model.js";

import { generateToken } from "../utils/jwt.js";

const formatUser = (user) => ({
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    name: user.name || "",
    bio: user.bio || "",
    avatar: user.avatar || "",
    location: user.location || "",
    website: user.website || "",
    repositories: user.repositories || [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

export const signupUser = async ({username,email,password}) => {
    
    const existingUser = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    });

    if (existingUser) {

        throw new Error(
            "Username or email already exists."
        );
    }

    const hashedPassword =
        await bcrypt.hash(password, 10);

    const user = await User.create({
        username,
        email,
        password: hashedPassword
    });

    const token = generateToken(
        user._id
    );

    return {
        token,
        userId: user._id.toString(),
        user: formatUser(user)
    };
};

export const loginUser = async ({
    email,
    password
}) => {

    const user = await User
        .findOne({ email })
        .select("+password");

    if (!user) {
        throw new Error(
            "Invalid credentials."
        );
    }

    const passwordMatches =
        await bcrypt.compare(
            password,
            user.password
        );

    if (!passwordMatches) {
        throw new Error(
            "Invalid credentials."
        );
    }

    const token = generateToken(
        user._id
    );

    return {
        token,
        userId: user._id.toString(),
        user: formatUser(user)
    };
};

export const getCurrentUser = async (
    userId
) => {

    const user = await User.findById(
        userId
    );

    if (!user) {
        throw new Error(
            "User not found."
        );
    }

    return formatUser(user);
};

export const updateUserProfile = async (userId, updates) => {
    const { name, bio, avatar, location, website } = updates;

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    if (name !== undefined) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();
    if (location !== undefined) user.location = location.trim();
    if (website !== undefined) user.website = website.trim();

    await user.save();

    return formatUser(user);
};

export const getUserByUsername = async (username) => {
    const user = await User.findOne({ username });

    if (!user) {
        throw new Error("User not found.");
    }

    return formatUser(user);
};