"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToGoogleDrive = exports.createGoogleDriveFolder = void 0;
const google_auth_helper_1 = require("./google-auth.helper");
const createGoogleDriveFolder = async (folderName, folderId) => {
    try {
        const service = await (0, google_auth_helper_1.getGoogleDriveService)();
        const folder = await service.files.create({
            requestBody: {
                name: folderName,
                parents: [folderId],
                mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id'
        });
        return folder.data.id;
    }
    catch (error) {
        throw new Error(`Error creating Google Drive folder: ${error.message}`);
    }
};
exports.createGoogleDriveFolder = createGoogleDriveFolder;
const uploadToGoogleDrive = async (file, uploadFilename, mimeType, folderId) => {
    const media = {
        mimeType,
        body: file,
    };
    try {
        const service = await (0, google_auth_helper_1.getGoogleDriveService)();
        const file = await service.files.create({
            requestBody: {
                name: uploadFilename,
                parents: [folderId],
                mimeType
            },
            media: media,
            fields: 'id',
        });
        console.log('File Id:', file.data.id);
        return file.data.id;
    }
    catch (error) {
        throw new Error(`Error uploading to Google Drive: ${error.message}`);
    }
};
exports.uploadToGoogleDrive = uploadToGoogleDrive;
//# sourceMappingURL=drive.helper.js.map