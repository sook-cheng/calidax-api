import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { getUserByIdDB, updatePasswordDB } from '../helpers';

export const getUserData = async (fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: number };
  
      if (!userId) {
        return reply.code(400).send({ error: "User ID is required" });
      }
  
      const userData = await getUserByIdDB(fastify, userId);
  
      if (!userData) {
        return reply.status(404).send({ error: "User not found" });
      }
  
      return reply.send(userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      return reply.status(500).send({ error: "Failed to fetch user data" });
    }
};

// Update user password
export const updateUserPassword = async (fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: number };
      const { password } = request.body as { password: string };
  
      // Validate input
      if (!password || password.length < 6) {
        return reply.code(401).send({ message: "Password must be at least 6 characters long" });
      }
  
      // Check if user exists
      const user = await getUserByIdDB(fastify, userId);
      if (!user) {
        return reply.code(401).send({ message: "User not found" });
      }
  
      // Update the password
      await updatePasswordDB(fastify, userId, password);
  
      return reply.code(200).send({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      return reply.code(500).send({ message: "Failed to update password" });
    }
};