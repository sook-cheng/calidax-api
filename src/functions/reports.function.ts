import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { createNewDocument, getAllDocuments, getDocument, updateDocument, uploadToGoogleDrive } from "../helpers";
dayjs.extend(utc);

/**
 * 
 * @param file (AsyncIterableIterator<fastifyMultipart.MultipartFile>)
 * @param docName string
 * @returns {
 *  code: number
 *  message: string
 *  url: string
 * }
 **/
export const uploadReport = async (file: any, docName: any) => {
    let res: { code: number, message: string, url?: string } = { code: 500, message: "INTERNAL_SERVER_ERROR" };

    try {
        if (file.type === 'file') {
            const fileId = await uploadToGoogleDrive(file.file, file.filename, file.mimetype, process.env.GOOGLE_DRIVE_CALIDAX_FOLDER_ID ?? '');
            if (fileId) {
                const oldData = await getDocument('reports', docName)
                await updateDocument('reports', docName, {
                    ...oldData,
                    url: `https://drive.google.com/open?id=${fileId}`,
                    driveId: fileId,
                })

                res = {
                    code: 201,
                    message: 'UPLOAD_SUCCESSFUL',
                    url: `https://drive.google.com/open?id=${fileId}`
                };
            }
        }
    }
    catch (error: any) {
        throw new Error(`Failed to upload report: ${error?.message}`);
    }
    finally {
        return res;
    }
}

/**
 * 
 * @param data {
 *  startDate: date
 *  endDate: date
 *  client: string
 * }
 * @returns {
 *  code: number
 *  message: string
 *  docName: string
 *  data: any
 * }
 */
export const filterReports = async (data: any) => {
    let res: { code: number, message: string, docName?: string } = { code: 500, message: "INTERNAL_SERVER_ERROR" };

    try {
        // TODO: Filter CSV data to generate PDF
        let startDate = undefined;
        let endDate = undefined;

        if (data?.startDate) {
            const dates = data?.startDate.split('T');
            startDate = dates[0];
        }

        if (data?.endDate) {
            const dates = data?.endDate.split('T');
            endDate = dates[0];
        }

        // Convert local time to UTC time
        // 2019-03-06T09:11:55Z
        const today = dayjs.utc().format();
        const docName = `${data?.client ?? 'null'}_${startDate ?? 'null'}_${endDate ?? 'null'}`;
        await createNewDocument('reports', docName, {
            // url: null,
            // driveId: null,
            createdAt: today,
            client: data?.client,
            startDate: data?.startDate,
            endDate: data?.endDate,
        });

        res = {
            code: 201,
            message: 'CREATED_SUCCESSFUL',
            docName,
        };
    }
    catch (error: any) {
        console.log(error)
        throw new Error(`Failed to filter reports: ${error?.message}`);
    }
    finally {
        return res;
    }
}

/**
 * 
 * @returns {
 *  url: string
 *  driveId: string
 *  createdAt: date
 *  client: string
 *  startDate: date
 *  endDate: date
 * }
 */
export const getReports = async () => {
    let value: any;

    try {
        const docs = await getAllDocuments("reports");

        // Sort by createdAt DESC
        value = docs.length > 0
            ? docs.sort((a, b) => dayjs(a.createdAt).isBefore(dayjs(b.createdAt)) ? 1 : -1).map((x: any, idx: number) => {
                let startDate = '-';
                let endDate = '-';

                if (x?.startDate) {
                    const dates = x.startDate.split('T');
                    startDate = dates[0];
                }

                if (x?.endDate) {
                    const dates = x.endDate.split('T');
                    endDate = dates[0];
                }

                return {
                    id: idx,
                    url: x?.url ?? '-',
                    driveId: x?.driveId ?? '-',
                    name: x?.client ?? '-',
                    startDate,
                    endDate,
                }
            })
            : [];
    }
    finally {
        return value;
    }
}