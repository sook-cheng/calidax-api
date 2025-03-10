"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
const base_64_1 = require("base-64");
const token_1 = require("./token");
const helpers_1 = require("../helpers");
// import { getUserByEmail, updateUserLastLogin, updateUserLogout  } from "../helpers/firestore.helper";
/**
 *
 * @param fastify
 * @param data {
 *  email: string
 *  password: string
 * }
 * @returns {
 *  code: number
 *  message: string
 *  token: ITokenInfo
 * }
 */
async function login(fastify, request, reply) {
    try {
        const { email, password } = request.body;
        const userPassword = (0, base_64_1.decode)(password);
        const user = await (0, helpers_1.getUserByEmailDB)(fastify, email);
        if (!user || user.length === 0) {
            return reply.code(401).send({ message: "Invalid email" });
        }
        if (userPassword != user.password) {
            return reply.code(401).send({ message: "Invalid password" });
        }
        // Update last login
        await (0, helpers_1.updateUserLastLoginDB)(fastify, user.id);
        // Generate token
        const token = (0, token_1.generateToken)(user, fastify);
        return reply.code(200).send({
            message: 'LOGIN_SUCCESSFUL',
            token,
            id: user.id,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return reply.code(500).send({ message: `Failed to login: ${error?.message}` });
    }
}
/**
 *
 * @param fastify
 * @param id
 * @returns {
 *  code: number
 *  message: string
 * }
 */
async function logout(fastify, request, reply) {
    try {
        const { id } = request.params;
        await (0, helpers_1.updateUserLogoutDB)(fastify, id);
        return reply.code(200).send({ message: "LOGOUT_SUCCESSFUL" });
    }
    catch (error) {
        console.error("Logout error:", error);
        return reply.code(500).send({ message: `Failed to logout: ${error?.message}` });
    }
}
//# sourceMappingURL=login.js.map