// Upload service: low-level uploader + convenience wrappers
import { UploadResponseDto } from '../types/backend/upload';
import { api } from './api';
import { DocumentPhotoType } from '../types/backend/verification';

export type FilePurpose = 'avatar' | 'documentFront' | 'documentBack' | 'selfieWithDocument';
export type DocumentSide = 'FRONT' | 'BACK';

function inferMimeType(uri: string): string {
  const lower = uri.split('?')[0].toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.heic')) return 'image/heic';
  return 'application/octet-stream';
}

function inferFileName(uri: string): string {
  try {
    const withoutQuery = uri.split('?')[0];
    const parts = withoutQuery.split('/')
      .filter(Boolean);
    const last = parts[parts.length - 1] ?? 'upload.jpg';
    return last.includes('.') ? last : `${last}.jpg`;
  } catch (_) {
    return 'upload.jpg';
  }
}

export async function uploadImageToCloud(uri: string, filePurpose: FilePurpose): Promise<UploadResponseDto> {
  const form = new FormData();
  const name = inferFileName(uri);
  const type = inferMimeType(uri);

  // React Native FormData file object
  form.append('file' as any, { uri, name, type } as any);

  // Route to verification endpoints which persist to GCS/local via backend
  let path = '/verification/upload-avatar';
  if (filePurpose === 'documentFront') path = '/verification/upload-document/FRONT';
  else if (filePurpose === 'documentBack') path = '/verification/upload-document/BACK';
  else if (filePurpose === 'selfieWithDocument') path = '/verification/upload-selfie';

  const response = await api.post<UploadResponseDto>(path, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function uploadAvatar(imageUri: string): Promise<UploadResponseDto> {
  return uploadImageToCloud(imageUri, 'avatar');
}

export async function uploadDocument(imageUri: string, side: DocumentSide | DocumentPhotoType): Promise<UploadResponseDto> {
  const purpose: FilePurpose = (side === 'FRONT' || side === DocumentPhotoType.FRONT) ? 'documentFront' : 'documentBack';
  return uploadImageToCloud(imageUri, purpose);
}

export async function uploadSelfie(imageUri: string): Promise<UploadResponseDto> {
  return uploadImageToCloud(imageUri, 'selfieWithDocument');
}

export default {
  uploadImageToCloud,
  uploadAvatar,
  uploadDocument,
  uploadSelfie,
};
