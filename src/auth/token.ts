import { FastifyInstance } from 'fastify';

export interface ITokenInfo {
    id: string;
    email: string;
    lastLoginDate?: string;
}

export const generateToken = (user: ITokenInfo, fastify: FastifyInstance): string => {
    const payload: ITokenInfo = {
        id: user.id.toString(),
        email: user.email,
        lastLoginDate: user.lastLoginDate ?? '',
    };

    const signOptions = {
        issuer: 'Calidax',
        subject: user.email,
        audience: 'calidaxtech.com',
        algorithm: 'RS256' as const,
        expiresIn: '8h',
    };

    // Access token
    return fastify.jwt.sign(payload, signOptions);
};
