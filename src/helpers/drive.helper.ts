import { getGoogleDriveService } from './google-auth.helper';

export const createGoogleDriveFolder = async (folderName: string, folderId: string) => {
  try {
    const service = await getGoogleDriveService();
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
  catch (error: any) {
    throw new Error(`Error creating Google Drive folder: ${error.message}`);
  }
}

export const uploadToGoogleDrive = async (file: any, uploadFilename: string, mimeType: string, folderId: string) => {
  const media = {
    mimeType,
    body: file,
  };

  try {
    const service = await getGoogleDriveService();
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
  catch (error: any) {
    throw new Error(`Error uploading to Google Drive: ${error.message}`);
  }
}