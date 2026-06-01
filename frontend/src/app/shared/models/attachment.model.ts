export type AttachmentCategory = 'scene' | 'repair' | 'insurance';

export interface Attachment {
  id: string;
  accidentId?: string;
  repairId?: string;
  claimId?: string;
  uploaderId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  category?: AttachmentCategory;
  uploader?: any;
  createdAt: Date;
}
