import { FastifyInstance } from "fastify";
import { uploadReport } from "../functions";

export async function mainRoute(fastify: FastifyInstance) {
    fastify.post("/upload-csv/:type", async (request, reply) => {
        const { type }: any = request.params;
        // File size limit 10Mb (in bytes)
        const file = await request.file({ limits: { fileSize: 10000000 } });
        // TODO:
        // 1. upload file to google drive
        // 2. store the URL at firestore (collection: csv_reports, document: standard)
        const result = {
            code: 201,
            message: 'UPLOAD_SUCCESSFUL'
        }
        reply.code(result?.code!).send({ message: result?.message });
    });

    fastify.post("/upload-report", async (request, reply) => {
        // File size limit 10Mb (in bytes)
        const file = await request.file({ limits: { fileSize: 10000000 } });
        const result = await uploadReport(file);
        reply.code(result?.code!).send({ message: result?.message });
    });
}