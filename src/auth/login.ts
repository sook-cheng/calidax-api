import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { decode } from 'base-64';
import { generateToken } from "./token";

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
export const login = async (fastify: FastifyInstance, data: any) => {
    const connection = await fastify['mysql'].getConnection();
    let res: { code: number, message: string, token?: any, id?: number } = { code: 200, message: "OK." };

    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE email=?', [data.email]);

        if (!rows || rows.length === 0) {
            res = {
                code: 401,
                message: "Invalid email."
            }
        }
        
        if (rows[0].password) {
            const verifyPw = await bcrypt.compare(decode(data.password), rows[0].password);
            if (!verifyPw) {
                res = {
                    code: 401,
                    message: "Invalid password."
                }
            }
        }

        await connection.execute('UPDATE users SET lastLoginDate=CURRENT_TIMESTAMP(), isLoggedIn=? WHERE email=?',[1, data.email]);
        const token = generateToken({
            ...rows[0],
            lastLoginDate: Date.now()
        }, fastify);

        res = {
            code: 200,
            message: "Login successful.",
            token,
            id: rows[0].id,
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