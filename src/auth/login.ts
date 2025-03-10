import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { decode } from 'base-64';
import { generateToken } from "./token";
import { getUserByEmailDB, updateUserLastLoginDB, updateUserLogoutDB } from "../helpers";

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

export async function login(fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
    try {
        const { email, password } = request.body as { email: string; password: string };
        const userPassword = decode(password);
    
        const user = await getUserByEmailDB(fastify, email);
        if (!user || user.length === 0) {
            // return reply.code(401).send({ message: "Invalid email" });
        }
    
        if (userPassword != user.password) {
            // return reply.code(401).send({ message: "Invalid password" });
        }
    
        // Update last login
        await updateUserLastLoginDB(fastify, user.id);
    
        // Generate token
        const token = generateToken(user, fastify);
    
        return reply.code(200).send({
            message: 'LOGIN_SUCCESSFUL',
            token,
            id: user.id,
        });
    }
    catch (error: any) {
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
export async function logout(fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = request.params as { id: number };

        await updateUserLogoutDB(fastify, id);

        return reply.code(200).send({ message: "LOGOUT_SUCCESSFUL" });
    } catch (error: any) {
        console.error("Logout error:", error);
        return reply.code(500).send({ message: `Failed to logout: ${error?.message}` });
    }
}