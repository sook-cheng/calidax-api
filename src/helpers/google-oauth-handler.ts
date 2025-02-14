import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import dayjs from 'dayjs';

const oAuth2Client = new OAuth2Client(
    // client id
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    // client secret
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    // redirect url
    process.env.GOOGLE_OAUTH_CLIENT_REDIRECT_URL
);

export const getGoogleAuthUrl = () => {
    const scopes = [
      'https://www.googleapis.com/auth/drive'
    ];
    const authorizationUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      redirect_uri: process.env.REDIRECT_URL
      // prompt: 'none'
    });
    return authorizationUrl;
}

export const storeAuthToken = async (code: any, db: any) => {
  const today = dayjs().format('YYYYMMDD');
  const expiry = dayjs().add(7, 'days').format('YYYYMMDD');
  const { tokens } = await oAuth2Client.getToken(code);
  const docRef = await db.collection('config').doc('gdrivetoken');
  await docRef.set({ token: tokens, created: today, expiry, origin: process.env.REDIRECT_URL }, { merge: true });
}

export const setAuthToken = async (tokens: any) => {
  oAuth2Client.setCredentials(tokens);
}

export const getGoogleDriveService = () => {
  return google.drive({ version: 'v3', auth: oAuth2Client });
}