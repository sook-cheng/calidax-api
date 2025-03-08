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


/** Users related functions - Firestore */

// Function to get user by email
export const getUserByEmail = async (email: string) => {
    const snapshot = await firestore.collection("users").where('email', '==', email).limit(1).get();
    
    if (snapshot.empty) return null; // No user found

    const userDoc = snapshot.docs[0]; // Get first match
    const userData = userDoc.data() as any;
    return { id: userDoc.id, ...userData }; // Return user data with Firestore ID
};

// Function to update last login date and login status
export const updateUserLastLogin = async (userId: string) => {
    await firestore.collection('users').doc(userId).update({ lastLoginDate: new Date().toISOString(), isLoggedIn: true });
};

export const updateUserLogout = async (userId: string) => {
    await firestore.collection('users').doc(userId).update({ isLoggedIn: false });
};

export const getUserById = async (userId: string) => {
    try {
      const userDoc = await firestore.collection("users").doc(userId).get();
      
      if (!userDoc.exists) return null;
  
      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw new Error("Failed to fetch user");
    }
};

export const updatePassword = async (collection: string, document: string, data: any) => {
    const docRef = firestore.collection(collection).doc(document);
    await docRef.update(data);
};


/** CSV reports related functions - Firestore */

export const saveCSVDataToFirestore = async (type: string, records: any[], googleDriveFileId: string) => {
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
    } catch (error) {
      throw new Error("Failed to save CSV data to Firestore.");
    }
};

export const getCSVDataFromFirestore = async () => {
    try {
        const collectionRef = firestore.collection("csv_reports");
        const snapshot = await collectionRef.get();

        if (snapshot.empty) {
            return [];
        }

        const records: any[] = [];
        snapshot.forEach(doc => {
            records.push({ id: doc.id, ...doc.data() });
        });

        return records;
    } catch (error) {
        throw new Error("Failed to fetch CSV data.");
    }
};

export const updateCampaignInFirestore = async (documentId: string, recordId: string, status: string) => {
    const campaignRef = firestore.collection("csv_reports").doc(documentId);
    const doc = await campaignRef.get();

    if (!doc.exists) {
        throw new Error("Document not found");
    }

    let records = doc.data()?.records || [];

    records = records.map((record: any) => {
        if (record.recordId === recordId) {
            return { ...record, status };
        }
        return record;
    });

    await campaignRef.update({ records });
};