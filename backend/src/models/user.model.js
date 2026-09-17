import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        name: {
            type: String,
            default: "",
            trim: true
        },

        bio: {
            type: String,
            default: "",
            trim: true
        },

        avatar: {
            type: String,
            default: ""
        },

        location: {
            type: String,
            default: "",
            trim: true
        },

        website: {
            type: String,
            default: "",
            trim: true
        },

        repositories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Repository"
            }
        ],

        followedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        starredRepositories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Repository"
            }
        ]
    },

    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);
export default User;