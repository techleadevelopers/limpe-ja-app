// Consolidated UploadService for app (avatar + documents + selfie)
import { UploadResponseDto } from '../types/backend/upload';
import baseUpload from './uploadService';

export type DocumentSide = 'FRONT' | 'BACK';

async function uploadAvatar(imageUri: string): Promise<UploadResponseDto> {
  return baseUpload.uploadImageToCloud(imageUri, 'avatar');
}

async function uploadDocument(imageUri: string, side: DocumentSide): Promise<UploadResponseDto> {
  const purpose = side === 'FRONT' ? 'documentFront' : 'documentBack';
  return baseUpload.uploadImageToCloud(imageUri, purpose);
}

async function uploadSelfie(imageUri: string): Promise<UploadResponseDto> {
  return baseUpload.uploadImageToCloud(imageUri, 'selfieWithDocument');
}

export default {
  uploadAvatar,
  uploadDocument,
  uploadSelfie,
};

