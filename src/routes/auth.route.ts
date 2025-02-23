import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { login, logout } from "../auth/login";

export async function authRoute(fastify: FastifyInstance) {
    fastify.post("/login", async (request: FastifyRequest, reply: FastifyReply) => {
        const result = await login(fastify, request, reply);
    });

    //TODO: logout function
    fastify.post("/logout/:id", async (request: FastifyRequest, reply: FastifyReply) => {
        // const { id } = request.params as { id: string };
        // const result = await logout(fastify, id);
        // reply.code(result?.code || 500).send({ message: result?.message });
    });
}