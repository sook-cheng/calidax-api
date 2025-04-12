"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainRoute = mainRoute;
const functions_1 = require("../functions");
const user_function_1 = require("../functions/user.function");
const data_management_function_1 = require("../functions/data-management.function");
const campaigns_function_1 = require("../functions/campaigns.function");
async function mainRoute(fastify) {
    fastify.post("/upload-report/:id", async (request, reply) => {
        const { id } = request.params;
        const file = await request.file();
        const result = await (0, functions_1.uploadReport)(fastify, file, id);
        reply.code(result?.code).send({ message: result?.message, url: result?.url });
    });
    fastify.post("/filter-report", async (request, reply) => {
        const body = request.body;
        const result = await (0, functions_1.filterReports)(fastify, body);
        reply.code(result?.code).send({ message: result?.message, reportId: result?.reportId, records: result?.records });
    });
    fastify.get("/all-reports", async (request, reply) => {
        const data = await (0, functions_1.getReports)(fastify);
        reply.send(data);
    });
    fastify.get('/user/:userId', async (request, reply) => {
        return await (0, user_function_1.getUserData)(fastify, request, reply);
    });
    fastify.post("/user/:userId/update-password", async (request, reply) => {
        const result = await (0, user_function_1.updateUserPassword)(fastify, request);
        reply.code(result?.code).send({ message: result?.message });
    });
    fastify.post("/upload-csv/:type/:userId", async (request, reply) => {
        await (0, data_management_function_1.uploadCSVAndSaveToFirestore)(fastify, request, reply);
    });
    fastify.get("/fetch-csv-record", async (request, reply) => {
        return await (0, campaigns_function_1.fetchCSVData)(fastify, request, reply);
    });
    fastify.post("/update-campaign", async (request, reply) => {
        const result = await (0, campaigns_function_1.updateCampaign)(fastify, request);
        reply.code(result?.code).send({ message: result?.message });
    });
}
//# sourceMappingURL=main.route.js.map