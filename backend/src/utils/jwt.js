import jwt from "jsonwebtoken";

import { JWT_SECRET_KEY, JWT_EXPIRES_IN } from "../config/env.js";

export const generateToken = (userId) => {

    return jwt.sign(
        {
            id: userId.toString()
        },

        JWT_SECRET_KEY,
        {
            expiresIn: JWT_EXPIRES_IN
        }
    );
};

export const verifyToken = (token) => {

    return jwt.verify(
        token,
        JWT_SECRET_KEY
    );
};