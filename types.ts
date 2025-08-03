export interface Note {
  id: string | null;
  user_id: string;
  title: string;
  content: string; // Changed from object to string for HTML content
  created_at: string;
  updated_at: string;
}
