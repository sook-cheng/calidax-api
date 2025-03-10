"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoute = authRoute;
const login_1 = require("../auth/login");
async function authRoute(fastify) {
    fastify.post("/login", async (request, reply) => {
        await (0, login_1.login)(fastify, request, reply);
    });
    fastify.post("/logout/:id", async (request, reply) => {
        await (0, login_1.logout)(fastify, request, reply);
    });
}
//# sourceMappingURL=auth.route.js.map