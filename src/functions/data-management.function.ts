import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { saveCSVDataToDB } from "../helpers";
import { parse } from "fast-csv";
import { pipeline } from "node:stream/promises";
import fs from "fs";
import { Readable } from "node:stream";

const convertChineseDateToEnglish = (dateString: string): string => {
    return dateString.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, "$1-$2-$3");
};

const serverFolder = '/home/dashboardcalidax/public_html/documents/csv';

export const uploadCSVAndSaveToFirestore = async (fastify: FastifyInstance, request: FastifyRequest) => {
    let res: { code: number, message: string, id?: number } | undefined = { code: 500, message: "INTERNAL_SERVER_EEROR" };
    
    try {
        const file = await request.file();
        if (!file) {
            res = {
                code: 400,
                message: "No file uploaded"
            }
            return;
        }
        const { type, userId } = request.params as { type: string, userId: number };
        const fileBuffer = await file.toBuffer();

        //  Upload file to storage
        pipeline(file.file, fs.createWriteStream(`${serverFolder}/${file.filename}`, { highWaterMark: 10 * 1024 * 1024 }));
                
        const records: any[] = [];
        Readable.from(fileBuffer)
            .pipe(parse({ headers: true }))
            .on("data", (row) => {
                for (const key in row) {
                    if (typeof row[key] === "string" && row[key].match(/\d{4}年\d{1,2}月\d{1,2}日/)) {
                        row[key] = convertChineseDateToEnglish(row[key]);
                    }

                    if (row.Campaign && row.Campaign.toLowerCase().includes("de rantau - clicks"))
                    {
                        row.CampaignSubText = "Click";
                        row.SubCampaignSubText = "CPC";
                    }
                    else if (row.Campaign && row.Campaign.toLowerCase().includes("de rantau - leads"))
                    {
                        row.CampaignSubText = "Leads";
                        row.SubCampaignSubText = "CPL";
                    }
                    else if (row.Campaign && row.Campaign.toLowerCase().includes("investment"))
                    {
                        row.CampaignSubText = "Impressions";
                        row.SubCampaignSubText = "CPM";
                    }
                    else if (row.Campaign && row.Campaign.toLowerCase().includes("mdec thematic brand campaign"))
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
                res = await saveCSVDataToDB(fastify, records, type, file.filename, userId);
            })
            .on("error", (err) => {
                res = {
                    code: 500,
                    message: err.message
                };
            });
    } catch (error) {
        res = {
            code: 500,
            message: "Failed to process CSV file"
        };
    }
    finally {
        return res;
    }
};