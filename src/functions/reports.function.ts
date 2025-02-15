import dayjs from "dayjs";
import { createNewDocument, uploadToGoogleDrive } from "../helpers";

export const uploadReport = async (file: any) => {
    let res: { code: number, message: string } = { code: 500, message: "INTERNAL_SERVER_ERROR" };
    
    try {
        if (file.type === 'file') {
            const fileId = await uploadToGoogleDrive(file.file, file.filename, file.mimetype, process.env.GOOGLE_DRIVE_CALIDAX_FOLDER_ID ?? '');
            if (fileId) {
                const today = dayjs().format('YYYYMMDDHHmmss');
                await createNewDocument('reports', today, {
                    url: `https://drive.google.com/open?id=${fileId}`,
                    driveId: fileId
                });
            }
            res = {
                code: 201,
                message: 'UPLOAD_SUCCESSFUL'
            };
        }
    }
    catch (error: any) {
        throw new Error(`Failed to upload report: ${error?.message}`);
    }
    finally {
        return res;
    }
}