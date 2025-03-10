"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.updateDocument = exports.createNewDocument = exports.getDocument = exports.getAllDocuments = void 0;
const firestore_1 = require("@google-cloud/firestore");
const path_1 = __importDefault(require("path"));
const firestore = new firestore_1.Firestore({
    projectId: process.env.GOOGLE_PROJECT_ID,
    keyFilename: path_1.default.join(__dirname, '../../keys/google-service-account.json')
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
//# sourceMappingURL=firestore-handler.js.map