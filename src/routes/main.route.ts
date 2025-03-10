import { FastifyInstance } from "fastify";
import { filterReports, getReports, uploadReport } from "../functions";
import { getUserData, updateUserPassword } from "../functions/user.function";
import { uploadCSVAndSaveToFirestore } from "../functions/data-management.function";
import { fetchCSVData, updateCampaign } from "../functions/campaigns.function";

export async function mainRoute(fastify: FastifyInstance) {
    fastify.post("/upload-report/:id", async (request, reply) => {
        const { id }: any = request.params;
        const file = await request.file();
        const result = await uploadReport(fastify, file, id);
        reply.code(result?.code!).send({ message: result?.message, url: result?.url });
    });

    fastify.post("/filter-report", async (request, reply) => {
        const body: any = request.body;
        const result = await filterReports(fastify, body);
        reply.code(result?.code!).send({ message: result?.message, reportId: result?.reportId, records: result?.records });
    });

    fastify.get("/all-reports", async (request, reply) => {
        return await getReports(fastify);
    });

    fastify.get('/user/:userId', async (request, reply) => {
        return await getUserData(fastify, request, reply);
    });

    fastify.post("/user/:userId/update-password", async (request, reply) => {
        const result = await updateUserPassword(fastify, request);
        reply.code(result?.code!).send({ message: result?.message });
    });

    fastify.post("/upload-csv/:type/:userId", async (request, reply) => {
        const result = await uploadCSVAndSaveToFirestore(fastify, request);
        reply.code(result?.code!).send({ message: result?.message, id: result?.id });
    });

    fastify.get("/fetch-csv-record", async (request, reply) => {
        return await fetchCSVData(fastify, request, reply);
    });

    fastify.post("/update-campaign", async (request, reply) => {
        const result = await updateCampaign(fastify, request);
        reply.code(result?.code!).send({ message: result?.message });
    });
}