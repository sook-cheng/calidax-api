import { FastifyRequest, FastifyReply } from 'fastify';
import { getUserById, updatePassword } from '../helpers/firestore.helper';

export const getUserData = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
  
      if (!userId) {
        return reply.code(400).send({ error: "User ID is required" });
      }
  
      const userData = await getUserById(userId);
  
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
export const updateUserPassword = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      const { password } = request.body as { password: string };
  
      // Validate input
      if (!password || password.length < 6) {
        return reply.code(401).send({ message: "Password must be at least 6 characters long" });
      }
  
      // Check if user exists
      const user = await getUserById(userId);
      if (!user) {
        return reply.code(401).send({ message: "User not found" });
      }
  
      // Update the password
      await updatePassword("users", userId, { password });
  
      return reply.code(200).send({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      return reply.code(500).send({ message: "Failed to update password" });
    }
};