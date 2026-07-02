import { File, UploadType } from 'expo-file-system';

export type ScannerUploadFields = Record<string, string | number | boolean | null | undefined>;

export type ScannerUploadResult = {
  status: number;
  body: string;
  headers: Record<string, string>;
  fileName: string;
  fileSize: number;
  mimeType: string;
  requestUrl: string;
};

export type ScannerUploadRequest = {
  requestUrl: string;
  imageUri: string;
  fileFieldName?: string;
  fields?: ScannerUploadFields;
  label: 'detect-corners' | 'extract-student-info' | 'detect-bubbles' | 'scan';
};

function guessMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'heic':
      return 'image/heic';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

function normalizeFields(fields: ScannerUploadFields): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );
}

export async function uploadScannerMultipart({
  requestUrl,
  imageUri,
  fileFieldName = 'file',
  fields = {},
  label,
}: ScannerUploadRequest): Promise<ScannerUploadResult> {
  const file = new File(imageUri);
  const fileName = file.name || imageUri.split('/').pop() || 'scan.jpg';
  const fileSize = file.size;
  const mimeType = file.type || guessMimeType(fileName);
  const normalizedFields = normalizeFields(fields);
  const fieldSummary = Object.entries(normalizedFields)
    .map(([key, value]) => `${key}=${value}`)
    .join('&') || 'none';
  const estimatedBodySize =
    fileSize + Object.values(normalizedFields).reduce((sum, value) => sum + value.length, 0);

  console.log(
    '[Scanner] %s upload start url=%s file=%s size=%d mimeType=%s fieldName=%s fields=%s estimatedBodyBytes=%d',
    label,
    requestUrl,
    fileName,
    fileSize,
    mimeType,
    fileFieldName,
    fieldSummary,
    estimatedBodySize,
  );

  const response = await file.upload(requestUrl, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: fileFieldName,
    mimeType,
    parameters: normalizedFields,
  });

  console.log(
    '[Scanner] %s upload complete status=%d body=%s',
    label,
    response.status,
    response.body,
  );

  return {
    status: response.status,
    body: response.body,
    headers: response.headers,
    fileName,
    fileSize,
    mimeType,
    requestUrl,
  };
}
