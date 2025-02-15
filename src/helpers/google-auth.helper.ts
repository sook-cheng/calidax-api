import { google } from 'googleapis';
import serviceAccountKey from '../../keys/google-service-account.json';

const googleAuth = async () => {
  const scopes = [
    'https://www.googleapis.com/auth/drive'
  ];
  const auth = new google.auth.JWT(serviceAccountKey.client_email, undefined, serviceAccountKey.private_key, scopes);
  try {
    await auth.authorize();
    return auth;
  }
  catch (error: any) {
    throw new Error(`Error authorizing Google Drive API: ${error.message}`);
  }
}

export const getGoogleDriveService = async () => {
  const auth = await googleAuth();
  return google.drive({ version: 'v3', auth });
}