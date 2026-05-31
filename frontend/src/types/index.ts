export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'restorer' | 'librarian' | 'expert';

export interface Book {
  id: string;
  title: string;
  author?: string;
  dynasty?: string;
  year?: string;
  material?: string;
  dimensions?: string;
  page_count?: number;
  location?: string;
  status: BookStatus;
  entered_by: string;
  entered_at: string;
  updated_at: string;
}

export type BookStatus = 'pending' | 'diagnosing' | 'scheduled' | 'repairing' | 'reviewing' | 'completed' | 'archived';

export interface Disease {
  id: string;
  book_id: string;
  type: DiseaseType;
  severity: DiseaseSeverity;
  location?: string;
  description?: string;
  diagnosed_by?: string;
  diagnosed_at: string;
  updated_at: string;
}

export type DiseaseType = 'acidification' | 'moth_damage' | 'mold' | 'tear' | 'stain' | 'brittleness' | 'other';

export type DiseaseSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

export interface Process {
  id: string;
  book_id: string;
  name: string;
  description?: string;
  estimated_duration?: number;
  actual_duration?: number;
  assignee?: string;
  status: ProcessStatus;
  order_index: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type ProcessStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  specification?: string;
  unit: string;
  stock_quantity: number;
  min_stock: number;
  unit_price?: number;
  supplier?: string;
  created_at: string;
  updated_at: string;
}

export type MaterialCategory = 'paper' | 'adhesive' | 'tool' | 'chemical' | 'other';

export interface Review {
  id: string;
  book_id: string;
  reviewer_id: string;
  type: ReviewType;
  status: ReviewStatus;
  comments?: string;
  submitted_at: string;
  reviewed_at?: string;
}

export type ReviewType = 'disease_diagnosis' | 'repair_process' | 'final_archive';

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'need_revision';

export interface Archive {
  id: string;
  book_id: string;
  title: string;
  type: ArchiveType;
  file_path?: string;
  file_size?: number;
  description?: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export type ArchiveType = 'image' | 'document' | 'record' | 'other';

export interface Schedule {
  id: string;
  book_id: string;
  restorer_id: string;
  start_time: string;
  end_time: string;
  description?: string;
  created_at: string;
}

export interface ArchiveStatistics {
  total_books: number;
  total_archives: number;
  image_count: number;
  document_count: number;
  record_count: number;
  books_without_images: number;
}

export interface ScheduleConflict {
  schedule_id: string;
  book_title: string;
  start_time: string;
  end_time: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
