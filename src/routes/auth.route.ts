import { FastifyInstance } from "fastify";
import { login, logout } from "../auth/login";

export async function authRoute(fastify: FastifyInstance) {
    fastify.post("/login", async (request, reply) => {
        const result = await login(fastify, request.body);
        reply.code(result?.code!).send({ message: result?.message, token: result?.token, id: result?.id });
    });

    fastify.post("/logout/:id", async (request, reply) => {
        const { id }: any = request.params;
        const result = await logout(fastify, id);
        reply.code(result?.code!).send({ message: result?.message });
    });
}