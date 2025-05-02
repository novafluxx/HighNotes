// Define the structure of a Note object
export interface Note {
  id: string | null; // Can be null for newly created notes before saving
  user_id: string;
  title: string;
  content?: string | null; // Made optional
  created_at?: string; // Made optional (ISO string format)
  updated_at: string; // ISO string format from Supabase timestamp
}
