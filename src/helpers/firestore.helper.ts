import { Firestore } from "@google-cloud/firestore";
import path from 'path';

const firestore = new Firestore({
    projectId: process.env.GOOGLE_PROJECT_ID,
    keyFilename: path.join(__dirname, '../../keys/google-service-account.json')
});

export const getAllDocuments = async (collection: string) => {
    const snapshot = await firestore.collection(collection).get();
    const ret: any[] = [];
    if (!snapshot.empty) {
        snapshot.forEach(doc => ret.push(doc.data()));
    }
    return ret;
}

export const getDocument = async (collection: string, document: string) => {
    const docRef = firestore.collection(collection).doc(document);
    const doc = await docRef.get();
    let ret: any = undefined;
    if (doc.exists) {
        ret = doc.data();
    }
    return ret;
}

export const createNewDocument = async (collection: string, document: string, data: any) => {
    // Collection will be automatically created if it doesn't exists
    // Document of the defined id will be created
    // Value is set to the document
    const docRef = firestore.collection(collection).doc(document);
    await docRef.set(data);
}

export const updateDocument = async (collection: string, document: string, data: any) => {
    const docRef = firestore.collection(collection).doc(document);
    await docRef.update(data);
}

export const deleteDocument = async (collection: string, document: string) => {
    const docRef = firestore.collection(collection).doc(document);
    await docRef.delete();
}