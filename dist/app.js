"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const routes_1 = require("./routes");
const dotenv_1 = __importDefault(require("dotenv"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mysql_1 = __importDefault(require("@fastify/mysql"));
dotenv_1.default.config();
const server = (0, fastify_1.default)();
server.register(mysql_1.default, {
    promise: true,
    connectionString: process.env.NODE_ENV === "development"
        ? `mysql://${process.env.DATABASE_USER_NAME}@${process.env.DATABASE_HOST}:3306/${process.env.DATABASE_NAME}`
        : `mysql://${process.env.DATABASE_USER_NAME}:${process.env.DATABASE_USER_PASSWORD}@${process.env.DATABASE_HOST}:3306/${process.env.DATABASE_NAME}`
});
server.register(cors_1.default, {
    origin: (request, callback) => {
        // TODO: Restrict allowed origin later
        return callback(null, true);
    }
});
server.register(multipart_1.default, {
    throwFileSizeLimit: false,
    // File size limit 10Mb (in bytes)
    limits: {
        fileSize: 100000000
    }
});
server.register(jwt_1.default, {
    secret: {
        private: fs_1.default.readFileSync(path_1.default.join(__dirname, '../keys/access_private.key'), 'utf8'),
        public: fs_1.default.readFileSync(path_1.default.join(__dirname, '../keys/access_public.key'), 'utf8'),
    }
});
// routes
server.register(routes_1.authRoute);
server.register(routes_1.mainRoute);
server.decorate("authenticate", async function (request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.send(err);
    }
});
server.listen({ host: '127.0.0.1', port: +(process.env.PORT || 8888) }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
//# sourceMappingURL=app.js.map