"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleDriveService = void 0;
const googleapis_1 = require("googleapis");
const google_service_account_json_1 = __importDefault(require("../../keys/google-service-account.json"));
const googleAuth = async () => {
    const scopes = [
        'https://www.googleapis.com/auth/drive'
    ];
    const auth = new googleapis_1.google.auth.JWT(google_service_account_json_1.default.client_email, undefined, google_service_account_json_1.default.private_key, scopes);
    try {
        await auth.authorize();
        return auth;
    }
    catch (error) {
        throw new Error(`Error authorizing Google Drive API: ${error.message}`);
    }
};
const getGoogleDriveService = async () => {
    const auth = await googleAuth();
    return googleapis_1.google.drive({ version: 'v3', auth });
};
exports.getGoogleDriveService = getGoogleDriveService;
//# sourceMappingURL=google-auth.helper.js.map