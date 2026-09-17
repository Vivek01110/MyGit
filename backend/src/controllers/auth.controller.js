import {
    signupUser,
    loginUser
} from "../services/auth.service.js";

export const signup = async (
    req,
    res
) => {

    try {

        const {
            username,
            email,
            password
        } = req.body;

        if (
            !username ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                message:
                    "Username, email and password are required."
            });
        }

        const result =
            await signupUser({
                username,
                email,
                password
            });

        return res.status(201).json(
            result
        );

    } catch (error) {

        console.error(
            "Signup error:",
            error.message
        );

        return res.status(400).json({
            message: error.message
        });
    }
};

export const login = async (
    req,
    res
) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                message:
                    "Email and password are required."
            });
        }

        const result =
            await loginUser({
                email,
                password
            });

        return res.status(200).json(
            result
        );

    } catch (error) {

        console.error(
            "Login error:",
            error.message
        );

        return res.status(401).json({
            message: error.message
        });
    }
};