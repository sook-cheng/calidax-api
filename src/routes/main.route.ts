import { FastifyInstance } from "fastify";
import { filterReports, getReports, uploadReport } from "../functions";
import { getUserData, updateUserPassword } from "../functions/user.function";

export async function mainRoute(fastify: FastifyInstance) {
    fastify.post("/upload-csv/:type", async (request, reply) => {
        const { type }: any = request.params;
        // File size limit 10Mb (in bytes)
        const file = await request.file();
        // TODO:
        // 1. upload file to google drive
        // 2. store the URL at firestore (collection: csv_reports, document: standard)
        const result = {
            code: 201,
            message: 'UPLOAD_SUCCESSFUL'
        }
        reply.code(result?.code!).send({ message: result?.message });
    });

    fastify.post("/upload-report/:docName", async (request, reply) => {
        const { docName }: any = request.params;
        const file = await request.file();
        const result = await uploadReport(file, docName);
        reply.code(result?.code!).send({ message: result?.message, url: result?.url });
    });

    fastify.post("/filter-report", async (request, reply) => {
        const body: any = request.body;
        const result = await filterReports(body);
        reply.code(result?.code!).send({ message: result?.message, docName: result?.docName });
    });

    fastify.get("/all-reports", async (request, reply) => {
        return await getReports();
    });

    fastify.get('/user/:userId', async (request, reply) => {
        return await getUserData(request, reply);
    });

    fastify.post("/user/:userId/update-password", async (request, reply) => {
        return await updateUserPassword(request, reply);
    });
}