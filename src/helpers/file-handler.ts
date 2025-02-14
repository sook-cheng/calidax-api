import * as fs from 'fs';
import { getGoogleDriveService } from './google-oauth-handler';

export const createGoogleDriveFolder = async (folderName: string, folderId: string) => {
  const service = getGoogleDriveService();

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

export const uploadToGoogleDrive = async (readFilename: string, uploadFilename: string, mediaFiletype: string, driveFiletype: string, folderId: string) => {
  const service = getGoogleDriveService();

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
}