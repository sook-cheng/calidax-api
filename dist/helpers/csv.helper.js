"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFileUrl = exports.updateCampaignInDB = exports.getCSVDataFromDB = exports.saveCSVDataToDB = void 0;
/** CSV reports related functions - MySQL DB */
const saveCSVDataToDB = async (fastify, records, type, filename, userId) => {
    const connection = await fastify['mysql'].getConnection();
    let res = { code: 200, message: "OK." };
    try {
        if (!records || records.length === 0) {
            res = {
                code: 400,
                message: 'NO_RECORD'
            };
            return;
        }
        const path = (0, exports.formatFileUrl)('documents/csv', filename);
        const [result] = await connection.execute('INSERT INTO csv_files (name,url,source,createdBy) VALUES (?,?,?,?)', [filename, path, type, userId]);
        let sql = 'INSERT INTO csv_data (client,campaignId,campaign,campaignSubText,subCampaign,subCampaignSubText,newField,status,budget,spent,startDate,endDate,clicks,impressions,reach,views,csvFileId,createdBy) VALUES ';
        for (const record of records) {
            sql += `('${record.Client}',${record.campaignId},'${record.Campaign}','${record.CampaignSubText}','${record['Sub Campaign']}','${record.SubCampaignSubText}','${record['New Field']}','${record.status}',${record['Budget segment budget']},${record.Spent},'${record['Budget segment start date']}','${record['Budget segment end date']}',${record.Clicks},${record.Impressions},${record.Reach},${record.Views},${result?.insertId},${userId}),`;
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
exports.saveCSVDataToDB = saveCSVDataToDB;
const getCSVDataFromDB = async (fastify) => {
    const connection = await fastify['mysql'].getConnection();
    let value;
    try {
        const [rows] = await connection.query('SELECT * FROM csv_data');
        value = rows;
    }
    finally {
        connection.release();
        return value;
    }
};
exports.getCSVDataFromDB = getCSVDataFromDB;
const updateCampaignInDB = async (fastify, id, status, userId) => {
    const connection = await fastify['mysql'].getConnection();
    let res = { code: 200, message: "OK." };
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
exports.updateCampaignInDB = updateCampaignInDB;
const formatFileUrl = (folder, filename) => {
    return encodeURI(`https://dashboard.calidaxtech.com/${folder}/${filename}`);
};
exports.formatFileUrl = formatFileUrl;
//# sourceMappingURL=csv.helper.js.map