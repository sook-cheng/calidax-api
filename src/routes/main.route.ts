import { FastifyInstance } from "fastify";
import { getGoogleAuthUrl, setAuthToken } from "../helpers";

export async function mainRoute(fastify: FastifyInstance) {
    // To use Google Drive service
    // 1. Generate OAuth token: getGoogleAuthUrl()
    // 2. Service will return to the callback function, so we set OAuth token: setAuthToken()
    // 3. Use the Google Drive service

    fastify.get("/generate-token", async (request, reply) => {
        return getGoogleAuthUrl();
    });

    fastify.get("/google-callback", async (request, reply) => {
        const { code }: any = request.query;
        if (code) {
            setAuthToken(code);
        }
    });

    fastify.post("/upload-csv/:type", async (request, reply) => {
        const { type }: any = request.params;
        const files = request.files({ limits: { fileSize: 10000000 } });
        // TODO:
        // 1. upload file to google drive
        // 2. store the URL at firestore (collection: csv_reports, document: standard)
        const result = {
            code: 201,
            message: 'UPLOAD_SUCCESSFUL'
        }
        reply.code(result?.code!).send({ message: result?.message });
    });
}