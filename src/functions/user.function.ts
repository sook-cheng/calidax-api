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
export const updateUserPassword = async (fastify: FastifyInstance, request: FastifyRequest) => {
  let res: { code: number, message: string } = { code: 500, message: "INTERNAL_SERVER_ERROR" };
  try {
    const { userId } = request.params as { userId: number };
    const { password } = request.body as { password: string };

    // Validate input
    if (!password || password.length < 6) {
      res = {
        code: 401,
        message: "Password must be at least 6 characters long"
      }
      return;
    }

    // Check if user exists
    const user = await getUserByIdDB(fastify, userId);
    if (!user) {
      res = {
        code: 401,
        message: "User not found"
      }
      return;
    }

    // Update the password
    await updatePasswordDB(fastify, userId, password);

    res = {
      code: 200,
      message: "Password updated successfully"
    }
    return;
  } catch (error) {
    console.error("Error updating password:", error);
    res = {
      code: 500,
      message: "Failed to update password"
    };
  }
  finally {
    return res;
  }
};