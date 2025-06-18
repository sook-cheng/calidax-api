"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCampaign = exports.fetchCSVData = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const helpers_1 = require("../helpers");
dayjs_1.default.extend(utc_1.default);
const fetchCSVData = async (fastify, request, reply) => {
    try {
        const { status, objective, searchText } = request.query;
        const records = await (0, helpers_1.getCSVDataFromDB)(fastify);
        const today = dayjs_1.default.utc().format();
        // Filter out sub-campaigns
        let campaignList = records.filter((r) => r.type === "sub").map((record) => {
            let status = record.status;
            if (status !== "Paused") { // Only update if NOT "Paused"
                const endDate = (0, dayjs_1.default)(record.endDate);
                if (endDate.isSame(today) || endDate.isAfter(today) || status === "Active") {
                    status = "Active";
                }
                else {
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
            };
        });
        if (status && status !== "All") {
            campaignList = campaignList.filter(campaign => campaign.status === status);
        }
        if (objective && objective !== "All") {
            campaignList = campaignList.filter(campaign => campaign.campaignSubText === objective);
        }
        if (searchText && searchText !== "") {
            const lowerSearchText = searchText.toLowerCase();
            campaignList = campaignList.filter(campaign => campaign.newField.toLowerCase().includes(lowerSearchText));
        }
        // Group by `newField`
        let groupedMap = new Map();
        campaignList.forEach((campaign) => {
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
            }
            else {
                let group = groupedMap.get(campaign.newField);
                group.subCampaign.push(campaign);
                group.id = campaign.id;
                group.client = campaign.client;
                group.newField = campaign.newField;
                group.campaignSubText = campaign.campaignSubText;
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
                }
                else if (campaign.status === "Paused" && group.status !== "Active") {
                    group.status = "Paused"; // If no Active, but at least one Paused, set as Paused
                }
                else if (group.status !== "Active" && group.status !== "Paused") {
                    group.status = "Ended"; // If no Active or Paused, default to Ended
                }
            }
        });
        const groupedResults = Array.from(groupedMap.values()).map((group) => {
            const mainCampaign = records.find((r) => r.newField === group.newField && r.type === "main");
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
            };
        });
        reply.code(200).send({ message: "CSV data retrieved successfully", records: groupedResults });
    }
    catch (error) {
        console.error(error);
        reply.code(500).send({ message: "Failed to retrieve CSV data" });
    }
};
exports.fetchCSVData = fetchCSVData;
const updateCampaign = async (fastify, request) => {
    let res = { code: 500, message: "INTERNAL_SERVER_ERROR" };
    try {
        const body = request.body;
        const { id, status, userId } = body;
        if (!id || !status) {
            res = {
                code: 400,
                message: "Missing campaignId or status"
            };
            return;
        }
        res = await (0, helpers_1.updateCampaignInDB)(fastify, id, status, userId);
    }
    catch (error) {
        res = {
            code: 500,
            message: "Failed to update campaign"
        };
    }
    finally {
        return res;
    }
};
exports.updateCampaign = updateCampaign;
//# sourceMappingURL=campaigns.function.js.map