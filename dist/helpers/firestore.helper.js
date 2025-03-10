"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCampaignInFirestore = exports.getCSVDataFromFirestore = exports.saveCSVDataToFirestore = exports.updatePassword = exports.getUserById = exports.updateUserLogout = exports.updateUserLastLogin = exports.getUserByEmail = exports.deleteDocument = exports.updateDocument = exports.createNewDocument = exports.getDocument = exports.getAllDocuments = void 0;
const firestore_1 = require("@google-cloud/firestore");
const path_1 = __importDefault(require("path"));
const firestore = new firestore_1.Firestore({
    projectId: process.env.GOOGLE_PROJECT_ID,
    keyFilename: path_1.default.join(__dirname, '../keys/google-service-account.json')
});
const getAllDocuments = async (collection) => {
    const snapshot = await firestore.collection(collection).get();
    const ret = [];
    if (!snapshot.empty) {
        snapshot.forEach(doc => ret.push(doc.data()));
    }
    return ret;
};
exports.getAllDocuments = getAllDocuments;
const getDocument = async (collection, document) => {
    const docRef = firestore.collection(collection).doc(document);
    const doc = await docRef.get();
    let ret = undefined;
    if (doc.exists) {
        ret = doc.data();
    }
    return ret;
};
exports.getDocument = getDocument;
const createNewDocument = async (collection, document, data) => {
    // Collection will be automatically created if it doesn't exists
    // Document of the defined id will be created
    // Value is set to the document
    const docRef = firestore.collection(collection).doc(document);
    await docRef.set(data);
};
exports.createNewDocument = createNewDocument;
const updateDocument = async (collection, document, data) => {
    const docRef = firestore.collection(collection).doc(document);
    await docRef.update(data);
};
exports.updateDocument = updateDocument;
const deleteDocument = async (collection, document) => {
    const docRef = firestore.collection(collection).doc(document);
    await docRef.delete();
};
exports.deleteDocument = deleteDocument;
/** Users related functions - Firestore */
// Function to get user by email
const getUserByEmail = async (email) => {
    const snapshot = await firestore.collection("users").where('email', '==', email).limit(1).get();
    if (snapshot.empty)
        return null; // No user found
    const userDoc = snapshot.docs[0]; // Get first match
    const userData = userDoc.data();
    return { id: userDoc.id, ...userData }; // Return user data with Firestore ID
};
exports.getUserByEmail = getUserByEmail;
// Function to update last login date and login status
const updateUserLastLogin = async (userId) => {
    await firestore.collection('users').doc(userId).update({ lastLoginDate: new Date().toISOString(), isLoggedIn: true });
};
exports.updateUserLastLogin = updateUserLastLogin;
const updateUserLogout = async (userId) => {
    await firestore.collection('users').doc(userId).update({ isLoggedIn: false });
};
exports.updateUserLogout = updateUserLogout;
const getUserById = async (userId) => {
    try {
        const userDoc = await firestore.collection("users").doc(userId).get();
        if (!userDoc.exists)
            return null;
        return { id: userDoc.id, ...userDoc.data() };
    }
    catch (error) {
        console.error("Error getting user by ID:", error);
        throw new Error("Failed to fetch user");
    }
};
exports.getUserById = getUserById;
const updatePassword = async (collection, document, data) => {
    const docRef = firestore.collection(collection).doc(document);
    await docRef.update(data);
};
exports.updatePassword = updatePassword;
/** CSV reports related functions - Firestore */
const saveCSVDataToFirestore = async (type, records, googleDriveFileId) => {
    try {
        if (!records || records.length === 0) {
            throw new Error("No records to save.");
        }
        const collectionRef = firestore.collection("csv_reports");
        const reportRef = collectionRef.doc(type);
        await reportRef.set({
            uploadedAt: new Date(),
            campaignId: 488313, //temporary set the id first
            googleDriveFileId,
            records,
        });
    }
    catch (error) {
        throw new Error("Failed to save CSV data to Firestore.");
    }
};
exports.saveCSVDataToFirestore = saveCSVDataToFirestore;
const getCSVDataFromFirestore = async () => {
    try {
        const collectionRef = firestore.collection("csv_reports");
        const snapshot = await collectionRef.get();
        if (snapshot.empty) {
            return [];
        }
        const records = [];
        snapshot.forEach(doc => {
            records.push({ id: doc.id, ...doc.data() });
        });
        return records;
    }
    catch (error) {
        throw new Error("Failed to fetch CSV data.");
    }
};
exports.getCSVDataFromFirestore = getCSVDataFromFirestore;
const updateCampaignInFirestore = async (documentId, recordId, status) => {
    const campaignRef = firestore.collection("csv_reports").doc(documentId);
    const doc = await campaignRef.get();
    if (!doc.exists) {
        throw new Error("Document not found");
    }
    let records = doc.data()?.records || [];
    records = records.map((record) => {
        if (record.recordId === recordId) {
            return { ...record, status };
        }
        return record;
    });
    await campaignRef.update({ records });
};
exports.updateCampaignInFirestore = updateCampaignInFirestore;
//# sourceMappingURL=firestore.helper.js.map