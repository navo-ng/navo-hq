export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          role_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          role_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          role_id?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: string;
          permissions: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          permissions?: Json;
          created_at?: string;
        };
        Update: {
          name?: string;
          permissions?: Json;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          owner_id: string | null;
          creator_id: string;
          project_id: string | null;
          status_id: string;
          priority_id: string;
          due_date: string | null;
          start_date: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          owner_id?: string | null;
          creator_id: string;
          project_id?: string | null;
          status_id: string;
          priority_id: string;
          due_date?: string | null;
          start_date?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          owner_id?: string | null;
          project_id?: string | null;
          status_id?: string;
          priority_id?: string;
          due_date?: string | null;
          start_date?: string | null;
          is_archived?: boolean;
          updated_at?: string;
          completed_at?: string | null;
        };
      };
      task_statuses: {
        Row: {
          id: string;
          name: string;
          color: string;
          position: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          position: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          color?: string;
          position?: number;
          is_active?: boolean;
        };
      };
      task_priorities: {
        Row: {
          id: string;
          name: string;
          color: string;
          position: number;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          position: number;
        };
        Update: {
          name?: string;
          color?: string;
          position?: number;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          status_id: string;
          start_date: string | null;
          target_date: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          status_id: string;
          start_date?: string | null;
          target_date?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          owner_id?: string;
          status_id?: string;
          start_date?: string | null;
          target_date?: string | null;
          is_archived?: boolean;
          updated_at?: string;
        };
      };
      project_statuses: {
        Row: {
          id: string;
          name: string;
          color: string;
          position: number;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          position: number;
        };
        Update: {
          name?: string;
          color?: string;
          position?: number;
        };
      };
      decisions: {
        Row: {
          id: string;
          title: string;
          topic: string | null;
          description: string | null;
          decision_text: string;
          reason: string | null;
          alternatives: string | null;
          status_id: string;
          owner_id: string | null;
          project_id: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          topic?: string | null;
          description?: string | null;
          decision_text: string;
          reason?: string | null;
          alternatives?: string | null;
          status_id: string;
          owner_id?: string | null;
          project_id?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          topic?: string | null;
          description?: string | null;
          decision_text?: string;
          reason?: string | null;
          alternatives?: string | null;
          status_id?: string;
          owner_id?: string | null;
          project_id?: string | null;
          is_archived?: boolean;
          updated_at?: string;
        };
      };
      decision_statuses: {
        Row: {
          id: string;
          name: string;
          color: string;
          position: number;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          position: number;
        };
        Update: {
          name?: string;
          color?: string;
          position?: number;
        };
      };
      documents: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string | null;
          author_id: string;
          owner_id: string;
          version: string;
          status_id: string;
          file_url: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: string | null;
          author_id: string;
          owner_id: string;
          version?: string;
          status_id: string;
          file_url?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: string | null;
          version?: string;
          status_id?: string;
          file_url?: string | null;
          is_archived?: boolean;
          updated_at?: string;
        };
      };
      document_statuses: {
        Row: {
          id: string;
          name: string;
          color: string;
          position: number;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          position: number;
        };
        Update: {
          name?: string;
          color?: string;
          position?: number;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          color: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
          category?: string | null;
        };
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          action?: string;
          metadata?: Json | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          entity_type: string | null;
          entity_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          type?: string;
          title?: string;
          message?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          is_read?: boolean;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          date: string;
          type: string;
          entity_type: string | null;
          entity_id: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          date: string;
          type: string;
          entity_type?: string | null;
          entity_id?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          date?: string;
          type?: string;
          entity_type?: string | null;
          entity_id?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
