"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToGoogleDrive = exports.createGoogleDriveFolder = void 0;
const fs = __importStar(require("fs"));
const google_oauth_handler_1 = require("./google-oauth-handler");
const createGoogleDriveFolder = async (folderName, folderId) => {
    const service = (0, google_oauth_handler_1.getGoogleDriveService)();
    const folder = await service.files.create({
        requestBody: {
            name: folderName,
            parents: [folderId],
            mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id'
    });
    return folder.data.id;
};
exports.createGoogleDriveFolder = createGoogleDriveFolder;
const uploadToGoogleDrive = async (readFilename, uploadFilename, mediaFiletype, driveFiletype, folderId) => {
    const service = (0, google_oauth_handler_1.getGoogleDriveService)();
    const media = {
        mimeType: mediaFiletype,
        body: fs.createReadStream(readFilename),
    };
    try {
        const file = await service.files.create({
            requestBody: {
                name: uploadFilename,
                parents: [folderId],
                mimeType: driveFiletype
            },
            media: media,
            fields: 'id',
        });
        console.log('File Id:', file.data.id);
        return file.data.id;
    }
    catch (error) {
        throw error;
    }
};
exports.uploadToGoogleDrive = uploadToGoogleDrive;
//# sourceMappingURL=file-handler.js.map