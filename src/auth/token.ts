import { FastifyInstance } from 'fastify';

export interface ITokenInfo {
    id: number;
    email: string;
    lastLoginDate: string;
}

export const generateToken = (user: any, fastify: FastifyInstance) => {
    const payload: ITokenInfo = {
        lastLoginDate: user.lastLoginDate,
        email: user.email,
        id: user.id
    };
    const signOptions: any = {
        issuer: 'Calidax',
        subject: user.email,
        audience: 'calidaxtech.com',
        algorithm: 'RS256',
        expiresIn: '8h',
    };

    // Access token
    return fastify.jwt.sign(payload, signOptions);
};
