import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { login, logout } from "../auth/login";

export async function authRoute(fastify: FastifyInstance) {
    fastify.post("/login", async (request: FastifyRequest, reply: FastifyReply) => {
        await login(fastify, request, reply);
    });

    fastify.post("/logout/:id", async (request: FastifyRequest, reply: FastifyReply) => {
        await logout(fastify, request, reply);
    });
}