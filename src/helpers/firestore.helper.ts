import { Firestore } from "@google-cloud/firestore";
import path from 'path';

const firestore = new Firestore({
    projectId: process.env.GOOGLE_PROJECT_ID,
    keyFilename: path.join(__dirname, '../../keys/google-service-account.json')
});

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

export const saveCSVDataToFirestore = async (type: string, records: any[], googleDriveFileId: string) => {
    try {
      if (!records || records.length === 0) {
        throw new Error("No records to save.");
      }
  
      const collectionRef = firestore.collection("csv_reports");
  
      const reportRef = collectionRef.doc(type);
      await reportRef.set({
        uploadedAt: new Date(), 
        googleDriveFileId,
        records,
      });
    } catch (error) {
      throw new Error("Failed to save CSV data to Firestore.");
    }
  };