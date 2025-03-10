"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPassword = exports.getUserData = void 0;
const helpers_1 = require("../helpers");
const getUserData = async (fastify, request, reply) => {
    try {
        const { userId } = request.params;
        if (!userId) {
            return reply.code(400).send({ error: "User ID is required" });
        }
        const userData = await (0, helpers_1.getUserByIdDB)(fastify, userId);
        if (!userData) {
            return reply.status(404).send({ error: "User not found" });
        }
        return reply.send(userData);
    }
    catch (error) {
        console.error("Error fetching user data:", error);
        return reply.status(500).send({ error: "Failed to fetch user data" });
    }
};
exports.getUserData = getUserData;
// Update user password
const updateUserPassword = async (fastify, request) => {
    let res = { code: 500, message: "INTERNAL_SERVER_ERROR" };
    try {
        const { userId } = request.params;
        const { password } = request.body;
        // Validate input
        if (!password || password.length < 6) {
            res = {
                code: 401,
                message: "Password must be at least 6 characters long"
            };
            return;
        }
        // Check if user exists
        const user = await (0, helpers_1.getUserByIdDB)(fastify, userId);
        if (!user) {
            res = {
                code: 401,
                message: "User not found"
            };
            return;
        }
        // Update the password
        await (0, helpers_1.updatePasswordDB)(fastify, userId, password);
        res = {
            code: 200,
            message: "Password updated successfully"
        };
        return;
    }
    catch (error) {
        console.error("Error updating password:", error);
        res = {
            code: 500,
            message: "Failed to update password"
        };
    }
    finally {
        return res;
    }
};
exports.updateUserPassword = updateUserPassword;
//# sourceMappingURL=user.function.js.map