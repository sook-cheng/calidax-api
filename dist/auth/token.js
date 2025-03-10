"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const generateToken = (user, fastify) => {
    const payload = {
        id: user.id.toString(),
        email: user.email,
        lastLoginDate: user.lastLoginDate ?? '',
    };
    const signOptions = {
        issuer: 'Calidax',
        subject: user.email,
        audience: 'calidaxtech.com',
        algorithm: 'RS256',
        expiresIn: '8h',
    };
    // Access token
    return fastify.jwt.sign(payload, signOptions);
};
exports.generateToken = generateToken;
//# sourceMappingURL=token.js.map