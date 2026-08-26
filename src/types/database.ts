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
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          position?: number;
        };
      };
      profiles: {
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
          name?: string;
          avatar_url?: string | null;
          role_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          name?: string;
          avatar_url?: string | null;
          role_id?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      task_statuses: {
        Row: {
          id: string;
          name: string;
          color: string;
          position: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          position?: number;
          is_active?: boolean;
          created_at?: string;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
          position?: number;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          creator_id: string;
          owner_id: string | null;
          project_id: string | null;
          status_id: string;
          priority_id: string;
          start_date: string | null;
          due_date: string | null;
          completed_at: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          creator_id: string;
          owner_id?: string | null;
          project_id?: string | null;
          status_id: string;
          priority_id: string;
          start_date?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          creator_id?: string;
          owner_id?: string | null;
          project_id?: string | null;
          status_id?: string;
          priority_id?: string;
          start_date?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          position?: number;
          created_at?: string;
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
      project_members: {
        Row: {
          project_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          role?: string;
        };
      };
      decision_statuses: {
        Row: {
          id: string;
          name: string;
          color: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          position?: number;
          created_at?: string;
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
          context: string | null;
          proposed_decision: string | null;
          decision_text: string | null;
          reason: string | null;
          alternatives: string | null;
          creator_id: string;
          owner_id: string | null;
          project_id: string | null;
          status_id: string;
          decided_at: string | null;
          superseded_by: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          topic?: string | null;
          context?: string | null;
          proposed_decision?: string | null;
          decision_text?: string | null;
          reason?: string | null;
          alternatives?: string | null;
          creator_id: string;
          owner_id?: string | null;
          project_id?: string | null;
          status_id: string;
          decided_at?: string | null;
          superseded_by?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          topic?: string | null;
          context?: string | null;
          proposed_decision?: string | null;
          decision_text?: string | null;
          reason?: string | null;
          alternatives?: string | null;
          creator_id?: string;
          owner_id?: string | null;
          project_id?: string | null;
          status_id?: string;
          decided_at?: string | null;
          superseded_by?: string | null;
          is_archived?: boolean;
          updated_at?: string;
        };
      };
      decision_contributors: {
        Row: {
          decision_id: string;
          user_id: string;
          contribution: string | null;
          added_at: string;
        };
        Insert: {
          decision_id: string;
          user_id: string;
          contribution?: string | null;
          added_at?: string;
        };
        Update: {
          contribution?: string | null;
        };
      };
      document_statuses: {
        Row: {
          id: string;
          name: string;
          color: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          position?: number;
          created_at?: string;
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
          project_id: string | null;
          status_id: string;
          current_version_id: string | null;
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
          project_id?: string | null;
          status_id: string;
          current_version_id?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: string | null;
          author_id?: string;
          owner_id?: string;
          project_id?: string | null;
          status_id?: string;
          current_version_id?: string | null;
          is_archived?: boolean;
          updated_at?: string;
        };
      };
      document_versions: {
        Row: {
          id: string;
          document_id: string;
          version_number: number;
          file_url: string;
          file_name: string;
          file_size: number | null;
          uploaded_by: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          version_number: number;
          file_url: string;
          file_name: string;
          file_size?: number | null;
          uploaded_by: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          document_id?: string;
          version_number?: number;
          file_url?: string;
          file_name?: string;
          file_size?: number | null;
          uploaded_by?: string;
          notes?: string | null;
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
          color?: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
          category?: string | null;
        };
      };
      task_tags: {
        Row: {
          task_id: string;
          tag_id: string;
        };
        Insert: {
          task_id: string;
          tag_id: string;
        };
        Update: Record<string, never>;
      };
      project_tags: {
        Row: {
          project_id: string;
          tag_id: string;
        };
        Insert: {
          project_id: string;
          tag_id: string;
        };
        Update: Record<string, never>;
      };
      decision_tags: {
        Row: {
          decision_id: string;
          tag_id: string;
        };
        Insert: {
          decision_id: string;
          tag_id: string;
        };
        Update: Record<string, never>;
      };
      document_tags: {
        Row: {
          document_id: string;
          tag_id: string;
        };
        Insert: {
          document_id: string;
          tag_id: string;
        };
        Update: Record<string, never>;
      };
      task_dependencies: {
        Row: {
          task_id: string;
          blocked_by_id: string;
          created_at: string;
        };
        Insert: {
          task_id: string;
          blocked_by_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          old_value: Json | null;
          new_value: Json | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          old_value?: Json | null;
          new_value?: Json | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          action?: string;
          old_value?: Json | null;
          new_value?: Json | null;
          metadata?: Json | null;
        };
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          content: string;
          is_edited: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          content: string;
          is_edited?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          is_edited?: boolean;
          updated_at?: string;
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
          event_date: string;
          event_time: string | null;
          end_date: string | null;
          end_time: string | null;
          type: string;
          entity_type: string | null;
          entity_id: string | null;
          created_by: string;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          event_time?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          type?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          created_by: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          event_date?: string;
          event_time?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          type?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          created_by?: string;
          is_archived?: boolean;
          updated_at?: string;
        };
      };
      team_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          key: string;
          value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          key: string;
          value: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
