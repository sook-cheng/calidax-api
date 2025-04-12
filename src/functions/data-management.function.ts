import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { saveCSVDataToDB, truncateCsvTable } from "../helpers";
import { parse } from "fast-csv";
import { pipeline } from "node:stream/promises";
import fs from "fs";
import { Readable } from "node:stream";

const convertChineseDateToEnglish = (dateString: string): string => {
    return dateString.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, "$1-$2-$3");
};

const serverFolder = '/home/apicalidaxtech/public_html/documents/csv';

export const uploadCSVAndSaveToFirestore = async (fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply) => {
    try {
        const file = await request.file();
        if (!file) {
            return reply.code(400).send({ message: "No file uploaded" });
        }
        const { type, userId } = request.params as { type: string, userId: number };
        const fileBuffer = await file.toBuffer();

        // Upload file to storage
        pipeline(file.file, fs.createWriteStream(`${serverFolder}/${file.filename}`, { highWaterMark: 10 * 1024 * 1024 }));
                
        const records: any[] = [];
        Readable.from(fileBuffer)
            .pipe(parse({ headers: true }))
            .on("data", (row) => {
                for (const key in row) {
                    if (typeof row[key] === "string" && row[key].match(/\d{4}年\d{1,2}月\d{1,2}日/)) {
                        row[key] = convertChineseDateToEnglish(row[key]);
                    }

                    if (row["New Field"] && row["New Field"].toLowerCase().includes("de rantau - clicks"))
                    {
                        row.CampaignSubText = "Click";
                        row.SubCampaignSubText = "CPC";
                    }
                    else if (row["New Field"] && row["New Field"].toLowerCase().includes("de rantau - leads"))
                    {
                        row.CampaignSubText = "Leads";
                        row.SubCampaignSubText = "CPL";
                    }
                    else if (row["New Field"] && row["New Field"].toLowerCase().includes("invesment"))
                    {
                        row.CampaignSubText = "Impressions";
                        row.SubCampaignSubText = "CPM";
                    }
                    else if (row["New Field"] && row["New Field"].toLowerCase().includes("thematic"))
                    {
                        row.CampaignSubText = "Views";
                        row.SubCampaignSubText = "CPV";
                    }
                    else 
                    {
                        row.CampaignSubText = "Campaign name";
                        row.SubCampaignSubText = "Other";
                    }
                }

                // Hardcode campaign ID
                const campaignId = row["New Field"].includes('RANTAU') 
                    ? 488313 
                    : row["New Field"].includes('INVESMENT') ? 240668 : 482403;

                records.push({...row, status: "", campaignId});
            })
            .on("end", async () => {
                await truncateCsvTable(fastify);
                const result = await saveCSVDataToDB(fastify, records, type, file.filename, userId);
                return reply.code(result?.code!).send({ message: result?.message, id: result?.id });
            })
            .on("error", (err) => {
                console.log("Failed to upload csv error: ", err);
                return reply.code(500).send({ message: "INTERNAL_SERVER_EEROR" });
            });
    } catch (error) {
        console.log("Failed to upload csv error: ", error);
        return reply.code(500).send({ message: "INTERNAL_SERVER_EEROR" });
    }
};