import fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoute, mainRoute } from './routes';
import dotenv from 'dotenv';
import fastifyMultipart from '@fastify/multipart';
import fastifyJwt from '@fastify/jwt';
import path from 'path';
import fs from 'fs';

dotenv.config();
const server = fastify();

server.register(cors, {
    origin: (request, callback) => {
        // TODO: Restrict allowed origin later
        return callback(null, true);
    }
});

server.register(fastifyMultipart, { 
    throwFileSizeLimit: false, 
    // File size limit 10Mb (in bytes)
    limits: {
        fileSize: 10000000
    }
});
server.register(fastifyJwt, {
    secret: {
        private: fs.readFileSync(path.join(__dirname, '../keys/access_private.key'), 'utf8',),
        public: fs.readFileSync(path.join(__dirname, '../keys/access_public.key'), 'utf8',),
    }
});

// routes
server.register(authRoute);
server.register(mainRoute)

server.decorate("authenticate", async function (request, reply) {
    try {
        await request.jwtVerify()
    } catch (err) {
        reply.send(err)
    }
})

server.listen({ host: '127.0.0.1', port: +(process.env.PORT || 8888) }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});