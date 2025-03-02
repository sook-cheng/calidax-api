import { FastifyRequest, FastifyReply } from "fastify";
import { getCSVDataFromFirestore, updateCampaignInFirestore } from "../helpers";

export interface Campaigns {
    id: string;
    recordId: string;
    budget: number;
    endDate: string;
    startDate: string;
    campaign: string;
    campaignSubText: string;
    clicks: number;
    client: string;
    impressions: number;
    newField: string;
    reach: number;
    spent: number;
    subCampaign: string;
    subCampaignSubText: string;
    views: number;
    status: string;
}

export const fetchCSVData = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { status, objective, searchText } = request.query as { status?: string; objective?: string; searchText?: string };
        let records = await getCSVDataFromFirestore(); 
        records = records.flat();

        const today = new Date(); 

        records.forEach(recordSet => {
            recordSet.records.forEach((record: any) => {
                if (record.status !== "Paused") { // Only update if NOT "Paused"
                    const endDate = new Date(record["Budget segment end date"]);
                    if (endDate >= today) {
                        record.status = "Active";
                    } else {
                        record.status = "Ended";
                    }
                }
            });
        });

        let groupedResults = records.map(recordSet => {
            let campaignList: Campaigns[] = recordSet.records.map((record: any) => ({
                id: recordSet["id"],
                recordId: record["recordId"],
                budget: Number(record["Budget segment budget"]),
                endDate: record["Budget segment end date"],
                startDate: record["Budget segment start date"],
                campaign: record["Campaign"],
                campaignSubText: record["CampaignSubText"],
                clicks: Number(record["Clicks"]),
                client: record["Client"],
                impressions: Number(record["Impressions"]),
                newField: record["New Field"],
                reach: Number(record["Reach"]),
                spent: Number(record["Spent"]),
                subCampaign: record["Sub Campaign"],
                subCampaignSubText: record["SubCampaignSubText"],
                views: Number(record["Views"]),
                status: record["status"],
            }));

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

            campaignList.forEach((campaign) => {
                const startDate = new Date(campaign.startDate);
                const endDate = new Date(campaign.endDate);

                if (!groupedMap.has(campaign.newField)) {
                    groupedMap.set(campaign.newField, {
                        subCampaign: [campaign], 
                        id: campaign.id,
                        campaignId: 0,
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
                    group.newField = campaign.newField;
                    group.campaignSubText = campaign.campaignSubText
                    group.totalViews += campaign.views || 0;
                    group.totalSpent += campaign.spent || 0;
                    group.totalBudget += campaign.budget || 0;
                    group.totalImpressions += campaign.impressions || 0;
                    group.totalReach += campaign.reach || 0;
                    group.totalClicks += campaign.clicks || 0;
                    group.progressValue = (group.totalSpent / group.totalBudget) * 100;

                    if (campaign.newField.toLowerCase().includes("rantau"))
                    {
                        group.campaignId = 488313;
                    }
                    else if (campaign.newField.toLowerCase().includes("invesment thematic"))
                    {
                        group.campaignId = 240668;
                    }
                    else if (campaign.newField.toLowerCase() == "thematic")
                    {
                        group.campaignId = 482403;
                    }

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
            });

            return Array.from(groupedMap.values()).map(group => ({
                id: group.id,
                campaignId: group.campaignId,
                client: group.client,
                newField: group.newField,
                campaignSubText: group.campaignSubText,
                sumView: group.totalViews,
                sumSpent: group.totalSpent,
                sumBudget: group.totalBudget,
                sumImpressions: group.totalImpressions,
                sumReach: group.totalReach,
                sumClicks: group.totalClicks,
                earliestStartDate: group.earliestStartDate,
                latestStartDate: group.latestStartDate,
                earliestEndDate: group.earliestEndDate,
                latestEndDate: group.latestEndDate,
                status: group.status,
                subCampaign: group.subCampaign,
                progressValue : group.progressValue,
            }));
        });

        reply.code(200).send({ message: "CSV data retrieved successfully", records: groupedResults });
    } catch (error) {
        reply.code(500).send({ message: "Failed to retrieve CSV data" });
    }
};

export const updateCampaign = async (request, reply) => {
    try {
        const { id, recordId, status } = request.body;
        if (!id || !status) {
            return reply.code(400).send({ message: "Missing campaignId or status" });
        }

        await updateCampaignInFirestore(id, recordId, status);
        reply.code(200).send({ message: "Campaign updated successfully" });
    } catch (error) {
        reply.code(500).send({ message: "Failed to update campaign" });
    }
};