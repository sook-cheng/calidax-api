import { FastifyInstance } from "fastify";

/** CSV reports related functions - MySQL DB */

export const saveCSVDataToDB = async (fastify: FastifyInstance, records: any[], type: string, filename: string, userId: number) => {
    const connection = await fastify['mysql'].getConnection();
    let res: { code: number, message: string, id?: number } = { code: 200, message: "OK." };

    try {
        if (!records || records.length === 0) {
            res = {
                code: 400,
                message: 'NO_RECORD'
            }
            return;
        }

        const path = formatFileUrl('documents/csv', filename);
        const [result] = await connection.execute('INSERT INTO csv_files (name,url,source,createdBy) VALUES (?,?,?,?)',
            [filename, path, type, userId]);

        let sql = 'INSERT INTO csv_data (client,campaignId,campaign,campaignSubText,subCampaign,subCampaignSubText,newField,status,budget,spent,startDate,endDate,clicks,impressions,reach,views,type,csvFileId,createdBy) VALUES ';
        for (const record of records) {
            sql += `('${record.Client}',${record.campaignId},'${record.Campaign}','${record.CampaignSubText}','${record['Sub Campaign']}','${record.SubCampaignSubText}','${record['New Field']}','${record.status}',${record['Budget segment budget']},${record.Spent},'${record['Budget segment start date']}','${record['Budget segment end date']}',${record.Clicks},${record.Impressions},${record.Reach},${record.Views},'${record.Type}',${result?.insertId},${userId}),`;
        }

        sql = sql.replaceAll("'null'", "null");
        sql = sql.replaceAll("'undefined'", "null");
        sql = sql.substring(0, sql.length - 1);
        await connection.execute(sql);

        res = result?.insertId ? {
            code: 201,
            message: `CSV report created. Created report Id: ${result.insertId}`,
            id: result.insertId,
        } : {
            code: 500,
            message: "INTERNAL_SERVER_ERROR"
        };
    }
    catch (err) {
        console.error(err);
        res = {
            code: 500,
            message: "INTERNAL_SERVER_ERROR"
        };
    }
    finally {
        connection.release();
        return res;
    }
};

export const getCSVDataFromDB = async (fastify: FastifyInstance) => {
    const connection = await fastify['mysql'].getConnection();
    let value: any;

    try {
        const [rows] = await connection.query('SELECT * FROM csv_data');

        value = rows;
    }
    finally {
        connection.release();
        return value;
    }
};

export const updateCampaignInDB = async (fastify: FastifyInstance, id: number, status: string, userId: number) => {
    const connection = await fastify['mysql'].getConnection();
    let res: { code: number, message: string } = { code: 200, message: "OK." };

    try {
        const [result] = await connection.execute('UPDATE csv_data SET status=?, updatedBy=? WHERE id=?', [status, userId, id]);
        res = result?.affectedRows > 0 ? {
            code: 204,
            message: `CSV data updated.`
        } : {
            code: 500,
            message: "INTERNAL_SERVER_ERROR"
        };
    }
    catch (err) {
        console.error(err);
        res = {
            code: 500,
            message: "INTERNAL_SERVER_ERROR"
        };
    }
    finally {
        connection.release();
        return res;
    }
};

export const truncateCsvTable = async (fastify: FastifyInstance) => {
    const connection = await fastify['mysql'].getConnection();
    let res: { code: number, message: string } = { code: 200, message: "OK." };

    try {
        const [result] = await connection.execute('TRUNCATE TABLE csv_data');
        res = result?.affectedRows > 0 ? {
            code: 204,
            message: `CSV data cleared.`
        } : {
            code: 500,
            message: "INTERNAL_SERVER_ERROR"
        };
    }
    catch (err) {
        console.error(err);
        res = {
            code: 500,
            message: "INTERNAL_SERVER_ERROR"
        };
    }
    finally {
        connection.release();
        return res;
    }
}

export const formatFileUrl = (folder: string, filename: string) => {
    return encodeURI(`https://dashboard.calidaxtech.com/${folder}/${filename}`);
}