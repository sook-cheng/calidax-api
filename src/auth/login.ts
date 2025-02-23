import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { decode } from 'base-64';
import { generateToken } from "./token";
import { getUserByEmail, updateUserLastLogin } from "../helpers/firestore.helper";

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
    
        const user = await getUserByEmail(email);
        if (!user || user.length === 0) {
            return reply.code(401).send({ message: "Invalid email" });
        }
    
        if (userPassword != user.password) {
            return reply.code(401).send({ message: "Invalid password" });
        }
    
        // Update last login
        await updateUserLastLogin(user.id);
    
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
export const logout = async (fastify: FastifyInstance, id: number) => {
    const connection = await fastify['mysql'].getConnection();
    let res: { code: number, message: string, token?: any } = { code: 200, message: "OK." };

    try {
        const [result] = await connection.execute('UPDATE users SET isLoggedIn=? WHERE id=?',[0, id]);
        res = result?.affectedRows > 0 ? {
            code: 200,
            message: "Logout successful.",
        } : {
            code: 400,
            message: 'User not found.',
        }
    }
    catch (err) {
        console.error(err);
        res = {
            code: 500,
            message: "Internal Server Error."
        };
    }
    finally {
        connection.release();
        return res;
    }
}