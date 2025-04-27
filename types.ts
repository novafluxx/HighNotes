// Define the structure of a Note object
export interface Note {
  id: string | null; // Can be null for newly created notes before saving
  user_id: string;
  title: string;
  content: string | null; // Content can potentially be null
  updated_at: string; // ISO string format from Supabase timestamp
}
