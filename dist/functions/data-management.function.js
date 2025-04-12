"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCSVAndSaveToFirestore = void 0;
const helpers_1 = require("../helpers");
const fast_csv_1 = require("fast-csv");
const promises_1 = require("node:stream/promises");
const fs_1 = __importDefault(require("fs"));
const node_stream_1 = require("node:stream");
const convertChineseDateToEnglish = (dateString) => {
    return dateString.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, "$1-$2-$3");
};
const serverFolder = '/home/apicalidaxtech/public_html/documents/csv';
const uploadCSVAndSaveToFirestore = async (fastify, request, reply) => {
    try {
        const file = await request.file();
        if (!file) {
            return reply.code(400).send({ message: "No file uploaded" });
        }
        const { type, userId } = request.params;
        const fileBuffer = await file.toBuffer();
        // Upload file to storage
        (0, promises_1.pipeline)(file.file, fs_1.default.createWriteStream(`${serverFolder}/${file.filename}`, { highWaterMark: 10 * 1024 * 1024 }));
        const records = [];
        node_stream_1.Readable.from(fileBuffer)
            .pipe((0, fast_csv_1.parse)({ headers: true }))
            .on("data", (row) => {
            for (const key in row) {
                if (typeof row[key] === "string" && row[key].match(/\d{4}年\d{1,2}月\d{1,2}日/)) {
                    row[key] = convertChineseDateToEnglish(row[key]);
                }
                if (row["New Field"] && row["New Field"].toLowerCase().includes("de rantau - clicks")) {
                    row.CampaignSubText = "Click";
                    row.SubCampaignSubText = "CPC";
                }
                else if (row["New Field"] && row["New Field"].toLowerCase().includes("de rantau - leads")) {
                    row.CampaignSubText = "Leads";
                    row.SubCampaignSubText = "CPL";
                }
                else if (row["New Field"] && row["New Field"].toLowerCase().includes("invesment")) {
                    row.CampaignSubText = "Impressions";
                    row.SubCampaignSubText = "CPM";
                }
                else if (row["New Field"] && row["New Field"].toLowerCase().includes("thematic")) {
                    row.CampaignSubText = "Views";
                    row.SubCampaignSubText = "CPV";
                }
                else {
                    row.CampaignSubText = "Campaign name";
                    row.SubCampaignSubText = "Other";
                }
            }
            // Hardcode campaign ID
            const campaignId = row["New Field"].includes('RANTAU')
                ? 488313
                : row["New Field"].includes('INVESMENT') ? 240668 : 482403;
            records.push({ ...row, status: "", campaignId });
        })
            .on("end", async () => {
            await (0, helpers_1.truncateCsvTable)(fastify);
            const result = await (0, helpers_1.saveCSVDataToDB)(fastify, records, type, file.filename, userId);
            return reply.code(result?.code).send({ message: result?.message, id: result?.id });
        })
            .on("error", (err) => {
            console.log("Failed to upload csv error: ", err);
            return reply.code(500).send({ message: "INTERNAL_SERVER_EEROR" });
        });
    }
    catch (error) {
        console.log("Failed to upload csv error: ", error);
        return reply.code(500).send({ message: "INTERNAL_SERVER_EEROR" });
    }
};
exports.uploadCSVAndSaveToFirestore = uploadCSVAndSaveToFirestore;
//# sourceMappingURL=data-management.function.js.map