"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleDriveService = exports.setAuthToken = exports.storeAuthToken = exports.getGoogleAuthUrl = void 0;
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
const dayjs_1 = __importDefault(require("dayjs"));
const oAuth2Client = new google_auth_library_1.OAuth2Client(
// client id
process.env.GOOGLE_OAUTH_CLIENT_ID, 
// client secret
process.env.GOOGLE_OAUTH_CLIENT_SECRET, 
// redirect url
process.env.GOOGLE_OAUTH_CLIENT_REDIRECT_URL);
const getGoogleAuthUrl = () => {
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
};
exports.getGoogleAuthUrl = getGoogleAuthUrl;
const storeAuthToken = async (code, db) => {
    const today = (0, dayjs_1.default)().format('YYYYMMDD');
    const expiry = (0, dayjs_1.default)().add(7, 'days').format('YYYYMMDD');
    const { tokens } = await oAuth2Client.getToken(code);
    const docRef = await db.collection('config').doc('gdrivetoken');
    await docRef.set({ token: tokens, created: today, expiry, origin: process.env.REDIRECT_URL }, { merge: true });
};
exports.storeAuthToken = storeAuthToken;
const setAuthToken = async (tokens) => {
    oAuth2Client.setCredentials(tokens);
};
exports.setAuthToken = setAuthToken;
const getGoogleDriveService = () => {
    return googleapis_1.google.drive({ version: 'v3', auth: oAuth2Client });
};
exports.getGoogleDriveService = getGoogleDriveService;
//# sourceMappingURL=google-oauth-handler.js.map