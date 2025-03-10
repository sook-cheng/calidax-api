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
const updateUserPassword = async (fastify, request, reply) => {
    try {
        const { userId } = request.params;
        const { password } = request.body;
        // Validate input
        if (!password || password.length < 6) {
            return reply.code(401).send({ message: "Password must be at least 6 characters long" });
        }
        // Check if user exists
        const user = await (0, helpers_1.getUserByIdDB)(fastify, userId);
        if (!user) {
            return reply.code(401).send({ message: "User not found" });
        }
        // Update the password
        await (0, helpers_1.updatePasswordDB)(fastify, userId, password);
        return reply.code(200).send({ message: "Password updated successfully" });
    }
    catch (error) {
        console.error("Error updating password:", error);
        return reply.code(500).send({ message: "Failed to update password" });
    }
};
exports.updateUserPassword = updateUserPassword;
//# sourceMappingURL=user.function.js.map