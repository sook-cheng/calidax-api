import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { formatFileUrl, getCSVDataFromDB } from "../helpers";
import { Campaigns } from "./campaigns.function";
import { pipeline } from "node:stream/promises";
import fs from "fs";
import { FastifyInstance } from "fastify";
dayjs.extend(utc);

const serverFolder = '/home/apicalidaxtech/public_html/documents/reports';

/**
 * 
 * @param file (AsyncIterableIterator<fastifyMultipart.MultipartFile>)
 * @param reportId number
 * @returns {
 *  code: number
 *  message: string
 *  url: string
 * }
 **/
export const uploadReport = async (fastify: FastifyInstance, file: any, reportId: number) => {
    const connection = await fastify['mysql'].getConnection();
    let res: { code: number, message: string, url?: string } = { code: 500, message: "INTERNAL_SERVER_ERROR" };

    try {
        if (file.type === 'file') {
            // Upload file to storage
            pipeline(file.file, fs.createWriteStream(`${serverFolder}/${file.filename}`, { highWaterMark: 10 * 1024 * 1024 }));
            const path = formatFileUrl('documents/reports', file.filename);

            const [result] = await connection.execute('UPDATE dashboard_reports SET url=? WHERE id=?', [path, reportId]);
            res = result?.affectedRows > 0 ? {
                code: 201,
                message: 'UPLOAD_SUCCESSFUL',
                url: path
            } : {
                code: 500,
                message: "INTERNAL_SERVER_ERROR"
            };
        }
    }
    catch (error: any) {
        throw new Error(`Failed to upload report: ${error?.message}`);
    }
    finally {
        connection.release();
        return res;
    }
}

/**
 * 
 * @param fastify
 * @param data {
 *  startDate: date
 *  endDate: date
 *  client: string
 *  userId: number
 * }
 * @returns {
 *  code: number
 *  message: string
 *  reportId: number
 *  data: any
 * }
 */
export const filterReports = async (fastify: FastifyInstance, data: any) => {
    const connection = await fastify['mysql'].getConnection();
    let res: { code: number, message: string, reportId?: number, records?: any } = { code: 500, message: "INTERNAL_SERVER_ERROR" };

    try {
        let startDate: any = undefined;
        let endDate: any = undefined;

        if (data?.startDate) {
            const dates = data?.startDate.split('T');
            startDate = dates[0];
        }

        if (data?.endDate) {
            const dates = data?.endDate.split('T');
            endDate = dates[0];
        }

        const records = await getCSVDataFromDB(fastify);
        
        const today = dayjs.utc().format();
        const campaignList: Campaigns[] = records.filter((r: any) => r.type === "sub").map((record: any) => {
            let status = record.status;
            if (status !== "Paused") { // Only update if NOT "Paused"
                const endDate = dayjs(record.endDate);
                if (endDate.isSame(today) || endDate.isAfter(today)) {
                    status = "Active";
                } else {
                    status = "Ended";
                }
            }
            return {
                id: record.id,
                campaignId: record.campaignId,
                budget: Number(record.budget),
                endDate: record.endDate,
                startDate: record.startDate,
                campaign: record.campaign,
                campaignSubText: record.campaignSubText,
                clicks: Number(record.clicks),
                client: record.client,
                impressions: Number(record.impressions),
                newField: record.newField,
                reach: Number(record.reach),
                spent: Number(record.spent),
                subCampaign: record.subCampaign,
                subCampaignSubText: record.subCampaignSubText,
                views: Number(record.views),
                status,
            }
        });

        const filteredRecords = campaignList.filter((x: any) => {
            return (data.client && x.client === data.client)
                && (startDate && (dayjs(x.startDate).isSame(dayjs(startDate)) || dayjs(x.startDate).isAfter(dayjs(startDate))))
                && (endDate && (dayjs(x.endDate).isSame(dayjs(endDate)) || dayjs(x.endDate).isBefore(dayjs(endDate))))
        });

        // Group by `newField`
        let groupedMap = new Map<
            string,
            {
                subCampaign: Campaigns[];
                id: string;
                campaignId: number;
                client: string;
                newField: string;
                campaignSubText: string;
                totalSpent: number;
                totalBudget: number;
                totalImpressions: number;
                totalReach: number;
                totalClicks: number;
                totalViews: number;
                earliestStartDate: string;
                latestStartDate: string;
                earliestEndDate: string;
                latestEndDate: string;
                status: string;
                progressValue: number;
            }
        >();

        for (const campaign of filteredRecords) {
            const startDate = new Date(campaign.startDate);
            const endDate = new Date(campaign.endDate);

            if (!groupedMap.has(campaign.newField)) {
                groupedMap.set(campaign.newField, {
                    subCampaign: [campaign],
                    id: campaign.id,
                    campaignId: campaign.campaignId,
                    client: campaign.client,
                    newField: campaign.newField,
                    campaignSubText: campaign.campaignSubText,
                    totalSpent: campaign.spent || 0,
                    totalBudget: campaign.budget || 0,
                    totalImpressions: campaign.impressions || 0,
                    totalReach: campaign.reach || 0,
                    totalClicks: campaign.clicks || 0,
                    totalViews: campaign.views || 0,
                    earliestStartDate: campaign.startDate,
                    latestStartDate: campaign.startDate,
                    earliestEndDate: campaign.endDate,
                    latestEndDate: campaign.endDate,
                    status: campaign.status,
                    progressValue: (campaign.spent / campaign.budget) * 100,
                });
            } else {
                let group = groupedMap.get(campaign.newField)!;
                group.subCampaign.push(campaign);
                group.id = campaign.id;
                group.client = campaign.client;
                group.campaignId = campaign.campaignId;
                group.newField = campaign.newField;
                group.campaignSubText = campaign.campaignSubText
                group.totalViews += campaign.views || 0;
                group.totalSpent += campaign.spent || 0;
                group.totalBudget += campaign.budget || 0;
                group.totalImpressions += campaign.impressions || 0;
                group.totalReach += campaign.reach || 0;
                group.totalClicks += campaign.clicks || 0;
                group.progressValue = (group.totalSpent / group.totalBudget) * 100;

                // Compare and update earliest & latest start date
                if (new Date(group.earliestStartDate) > startDate) {
                    group.earliestStartDate = campaign.startDate;
                }
                if (new Date(group.latestStartDate) < startDate) {
                    group.latestStartDate = campaign.startDate;
                }

                // Compare and update earliest & latest end date
                if (new Date(group.earliestEndDate) > endDate) {
                    group.earliestEndDate = campaign.endDate;
                }
                if (new Date(group.latestEndDate) < endDate) {
                    group.latestEndDate = campaign.endDate;
                }

                if (campaign.status === "Active") {
                    group.status = "Active"; // If any child is Active, set parent as Active
                } else if (campaign.status === "Paused" && group.status !== "Active") {
                    group.status = "Paused"; // If no Active, but at least one Paused, set as Paused
                } else if (group.status !== "Active" && group.status !== "Paused") {
                    group.status = "Ended"; // If no Active or Paused, default to Ended
                }
            }
        }

        const ret = Array.from(groupedMap.values()).map((group: any) => {
            const mainCampaign = records.find((r: any) => r.newField === group.newField && r.type === "main");

            return {
                id: group.id,
                campaignId: group.campaignId,
                client: group.client,
                newField: group.newField,
                campaignSubText: group.campaignSubText,
                sumView: group.totalViews,
                sumSpent: group.totalSpent,
                sumBudget: group.totalBudget,
                sumImpressions: group.totalImpressions,
                // Only Reach is not calculated by sum of sub-campaigns
                sumReach: mainCampaign ? mainCampaign.reach : group.totalReach,
                sumClicks: group.totalClicks,
                earliestStartDate: group.earliestStartDate,
                latestStartDate: group.latestStartDate,
                earliestEndDate: group.earliestEndDate,
                latestEndDate: group.latestEndDate,
                status: group.status,
                subCampaign: group.subCampaign,
                progressValue: group.progressValue,
            }
        });

        let reportId;
        if (ret.length > 0) {
            const [result] = await connection.execute('INSERT INTO dashboard_reports (client,startDate,endDate,createdBy) VALUES (?,?,?,?)',
                [data?.client, startDate, endDate, data?.userId]);
            reportId = result?.insertId;
        }

        res = reportId ? {
            code: 201,
            message: 'CREATED_SUCCESSFUL',
            reportId,
            records: ret,
        } : {
            code: 200,
            message: "NO_DATA_TO_EXPORT",
            reportId,
            records: []
        };
    }
    catch (error: any) {
        res = {
            code: 500,
            message: error?.message
        };
        throw new Error(`Failed to filter reports: ${error?.message}`);
    }
    finally {
        connection.release();
        return res;
    }
}

/**
 * 
 * @returns {
 *  url: string
 *  createdAt: date
 *  client: string
 *  startDate: date
 *  endDate: date
 * }
 */
export const getReports = async (fastify: FastifyInstance) => {
    const connection = await fastify['mysql'].getConnection();
    let value: any;

    try {
        const [rows] = await connection.query('SELECT * FROM dashboard_reports ORDER BY createdAt DESC');

        value = rows;
    }
    finally {
        connection.release();
        return value;
    }
}