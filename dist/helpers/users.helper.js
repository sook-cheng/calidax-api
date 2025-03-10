"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePasswordDB = exports.getUserByIdDB = exports.updateUserLogoutDB = exports.updateUserLastLoginDB = exports.getUserByEmailDB = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
/** Users related functions - MySql DB */
const getUserByEmailDB = async (fastify, email) => {
    const connection = await fastify['mysql'].getConnection();
    let value;
    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE email=?', [email]);
        value = rows[0];
    }
    finally {
        connection.release();
        return value;
    }
};
exports.getUserByEmailDB = getUserByEmailDB;
const updateUserLastLoginDB = async (fastify, userId) => {
    const connection = await fastify['mysql'].getConnection();
    let res = { code: 200, message: "OK." };
    try {
        await connection.execute('UPDATE users SET lastLoginDate=?, isLoggedIn=? WHERE id=?', [dayjs_1.default.utc().format(), true, userId]);
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
exports.updateUserLastLoginDB = updateUserLastLoginDB;
const updateUserLogoutDB = async (fastify, userId) => {
    const connection = await fastify['mysql'].getConnection();
    let res = { code: 200, message: "OK." };
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
exports.updateUserLogoutDB = updateUserLogoutDB;
const getUserByIdDB = async (fastify, userId) => {
    const connection = await fastify['mysql'].getConnection();
    let value;
    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE id=?', [userId]);
        value = rows[0];
    }
    finally {
        connection.release();
        return value;
    }
};
exports.getUserByIdDB = getUserByIdDB;
const updatePasswordDB = async (fastify, userId, password) => {
    const connection = await fastify['mysql'].getConnection();
    let res = { code: 200, message: "OK." };
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
exports.updatePasswordDB = updatePasswordDB;
//# sourceMappingURL=users.helper.js.map