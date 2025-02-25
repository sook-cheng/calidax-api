import { FastifyRequest, FastifyReply } from "fastify";
import { uploadToGoogleDrive, saveCSVDataToFirestore } from "../helpers";
import { parse } from "fast-csv";
import fs from "fs";
import path from "path";

const convertChineseDateToEnglish = (dateString: string): string => {
    return dateString.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, "$1-$2-$3");
};

export const uploadCSVAndSaveToFirestore = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const file = await request.file();
        if (!file) {
            return reply.status(400).send({ message: "No file uploaded" });
        }
        const { type } = request.params as { type: string };
        const tempFilePath = path.join(__dirname, `../../uploads/${file.filename}`);
        const fileBuffer = await file.toBuffer();
        await fs.promises.writeFile(tempFilePath, fileBuffer);

        const googleDriveFileId = await uploadToGoogleDrive(
            fs.createReadStream(tempFilePath),
            file.filename,
            file.mimetype,
            process.env.GOOGLE_DRIVE_CALIDAX_FOLDER_ID ?? ""
        );

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
                records.push({...row, status: ""});
            })
            .on("end", async () => {
                await saveCSVDataToFirestore(type, records, googleDriveFileId || "");
                fs.unlinkSync(tempFilePath); //Delete the temporary file
                reply.code(200).send({ message: "CSV uploaded and stored successfully", googleDriveFileId, records });
            })
            .on("error", (err) => {
                reply.code(500).send({ message: err.message });
            });
    } catch (error) {
        return reply.code(500).send({ message: "Failed to process CSV file" });
    }
};