import { verifyToken } from "../utils/jwt.js";

export const authenticate = (req, res, next) => {

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({
                message: "Authentication required."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = verifyToken(token);

        req.userId = decoded.id;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
};

export const optionalAuthenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = verifyToken(token);
            req.userId = decoded.id;
        }
    } catch {
        // Continue unauthenticated if token is invalid
        req.userId = undefined;
    }

    next();
};

// GET /api/users/me
//         │
//         ▼
// auth.middleware
//         │
//    verify JWT
//         │
//         ▼
// controller