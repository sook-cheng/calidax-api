import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { saveCSVDataToDB } from "../helpers";
import { parse } from "fast-csv";
import { pipeline } from "node:stream/promises";
import fs from "fs";
import path from "path";

const convertChineseDateToEnglish = (dateString: string): string => {
    return dateString.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, "$1-$2-$3");
};

const serverFolder = './home/dashboardcalidax/public_html/csv';

export const uploadCSVAndSaveToFirestore = async (fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply) => {
    try {
        const file = await request.file();
        if (!file) {
            return reply.status(400).send({ message: "No file uploaded" });
        }
        const { type, userId } = request.params as { type: string, userId: number };
        const tempFilePath = path.join(__dirname, `../../uploads/${file.filename}`);
        const fileBuffer = await file.toBuffer();
        await fs.promises.writeFile(tempFilePath, fileBuffer);

        //  Upload file to storage
        pipeline(file.file, fs.createWriteStream(`${serverFolder}/${file.filename}`, { highWaterMark: 10 * 1024 * 1024 }))
                
        const records: any[] = [];
        fs.createReadStream(tempFilePath)
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
                const result = await saveCSVDataToDB(fastify, records, type, file.filename, userId);
                fs.unlinkSync(tempFilePath); //Delete the temporary file
                reply.code(result?.code!).send({ message: "CSV uploaded and stored successfully", id: result?.id });
            })
            .on("error", (err) => {
                reply.code(500).send({ message: err.message });
            });
    } catch (error) {
        return reply.code(500).send({ message: "Failed to process CSV file" });
    }
};