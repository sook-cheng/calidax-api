
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { FastifyInstance } from "fastify";
dayjs.extend(utc);

/** Users related functions - MySql DB */

export const getUserByEmailDB = async (fastify: FastifyInstance, email: string) => {
    const connection = await fastify['mysql'].getConnection();
    let value: any;

    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE email=?', [email]);

        value = rows;
    }
    finally {
        connection.release();
        return value;
    }
};


export const updateUserLastLoginDB = async (fastify: FastifyInstance, userId: number) => {
    const connection = await fastify['mysql'].getConnection();
    let res: { code: number, message: string } = { code: 200, message: "OK." };

    try {
        await connection.execute('UPDATE users SET lastLoginDate=?, isLoggedIn=? WHERE id=?', [dayjs.utc().format(), true, userId]);

        res = {
            code: 204,
            message: "USER_LOGGED_IN"
        };
    }
    catch (err) {
        console.error(err);
        res = {
            code: 500,
            message: "INTERNAL_SERVER_ERROR"
        };
    }
    finally {
        connection.release();
        return res;
    }
};

export const updateUserLogoutDB = async (fastify: FastifyInstance, userId: number) => {
    const connection = await fastify['mysql'].getConnection();
    let res: { code: number, message: string } = { code: 200, message: "OK." };

    try {
        await connection.execute('UPDATE users SET isLoggedIn=? WHERE id=?', [false, userId]);

        res = {
            code: 204,
            message: "USER_LOGGED_OUT"
        };
    }
    catch (err) {
        console.error(err);
        res = {
            code: 500,
            message: "INTERNAL_SERVER_ERROR"
        };
    }
    finally {
        connection.release();
        return res;
    }
};

export const getUserByIdDB = async (fastify: FastifyInstance, userId: number) => {
    const connection = await fastify['mysql'].getConnection();
    let value: any;

    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE id=?', [userId]);

        value = rows;
    }
    finally {
        connection.release();
        return value;
    }
};

export const updatePasswordDB = async (fastify: FastifyInstance, userId: number, password: string) => {
    const connection = await fastify['mysql'].getConnection();
    let res: { code: number, message: string } = { code: 200, message: "OK." };

    try {
        await connection.execute('UPDATE users SET password=? WHERE id=?', [password, userId]);

        res = {
            code: 204,
            message: "PASSWORD_UPDATED"
        };
    }
    catch (err) {
        console.error(err);
        res = {
            code: 500,
            message: "INTERNAL_SERVER_ERROR"
        };
    }
    finally {
        connection.release();
        return res;
    }
};