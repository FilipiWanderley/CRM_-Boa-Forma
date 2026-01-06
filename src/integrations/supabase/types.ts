export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          unit_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          unit_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          unit_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis: {
        Row: {
          alcohol_consumption: string | null
          created_at: string
          id: string
          injuries: string | null
          lead_id: string
          medical_conditions: string[] | null
          medications: string | null
          objectives: string[] | null
          observations: string | null
          physical_activity_history: string | null
          signed_at: string | null
          sleep_quality: string | null
          smoker: boolean | null
          stress_level: string | null
          updated_at: string
        }
        Insert: {
          alcohol_consumption?: string | null
          created_at?: string
          id?: string
          injuries?: string | null
          lead_id: string
          medical_conditions?: string[] | null
          medications?: string | null
          objectives?: string[] | null
          observations?: string | null
          physical_activity_history?: string | null
          signed_at?: string | null
          sleep_quality?: string | null
          smoker?: boolean | null
          stress_level?: string | null
          updated_at?: string
        }
        Update: {
          alcohol_consumption?: string | null
          created_at?: string
          id?: string
          injuries?: string | null
          lead_id?: string
          medical_conditions?: string[] | null
          medications?: string | null
          objectives?: string[] | null
          observations?: string | null
          physical_activity_history?: string | null
          signed_at?: string | null
          sleep_quality?: string | null
          smoker?: boolean | null
          stress_level?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cancelled_at: string | null
          cancelled_reason: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string
          id: string
          lead_id: string | null
          notes: string | null
          professor_id: string | null
          scheduled_date: string
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          title: string
          type: Database["public"]["Enums"]["appointment_type"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          professor_id?: string | null
          scheduled_date: string
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title: string
          type: Database["public"]["Enums"]["appointment_type"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          professor_id?: string | null
          scheduled_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title?: string
          type?: Database["public"]["Enums"]["appointment_type"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          channel: string | null
          created_at: string
          error_message: string | null
          id: string
          lead_id: string | null
          message: string
          recipient: string
          rule_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["automation_status"]
          subject: string | null
          type: Database["public"]["Enums"]["automation_type"]
          unit_id: string
        }
        Insert: {
          channel?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          message: string
          recipient: string
          rule_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["automation_status"]
          subject?: string | null
          type: Database["public"]["Enums"]["automation_type"]
          unit_id: string
        }
        Update: {
          channel?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          message?: string
          recipient?: string
          rule_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["automation_status"]
          subject?: string | null
          type?: Database["public"]["Enums"]["automation_type"]
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          channel: string | null
          created_at: string
          id: string
          is_active: boolean | null
          message_template: string
          name: string
          subject: string
          trigger_days: number | null
          type: Database["public"]["Enums"]["automation_type"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          channel?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          message_template: string
          name: string
          subject: string
          trigger_days?: number | null
          type: Database["public"]["Enums"]["automation_type"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          channel?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          message_template?: string
          name?: string
          subject?: string
          trigger_days?: number | null
          type?: Database["public"]["Enums"]["automation_type"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          room_id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          room_id: string
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          room_id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          professor_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          professor_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          professor_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          access_status: string | null
          checked_in_at: string
          denial_reason: string | null
          device_id: string | null
          id: string
          lead_id: string
          method: string | null
          unit_id: string
        }
        Insert: {
          access_status?: string | null
          checked_in_at?: string
          denial_reason?: string | null
          device_id?: string | null
          id?: string
          lead_id: string
          method?: string | null
          unit_id: string
        }
        Update: {
          access_status?: string | null
          checked_in_at?: string
          denial_reason?: string | null
          device_id?: string | null
          id?: string
          lead_id?: string
          method?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          checked_in_at: string | null
          class_session_id: string
          confirmed_at: string | null
          created_at: string
          enrolled_at: string
          id: string
          lead_id: string
          status: string
          unit_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          class_session_id: string
          confirmed_at?: string | null
          created_at?: string
          enrolled_at?: string
          id?: string
          lead_id: string
          status?: string
          unit_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          class_session_id?: string
          confirmed_at?: string | null
          created_at?: string
          enrolled_at?: string
          id?: string
          lead_id?: string
          status?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_session_id_fkey"
            columns: ["class_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          class_type_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          location: string | null
          max_capacity: number | null
          professor_id: string | null
          start_time: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          class_type_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_capacity?: number | null
          professor_id?: string | null
          start_time: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          class_type_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_capacity?: number | null
          professor_id?: string | null
          start_time?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          cancelled_reason: string | null
          class_schedule_id: string | null
          class_type_id: string
          created_at: string
          current_enrollments: number | null
          end_time: string
          id: string
          location: string | null
          max_capacity: number
          notes: string | null
          professor_id: string | null
          session_date: string
          start_time: string
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          cancelled_reason?: string | null
          class_schedule_id?: string | null
          class_type_id: string
          created_at?: string
          current_enrollments?: number | null
          end_time: string
          id?: string
          location?: string | null
          max_capacity: number
          notes?: string | null
          professor_id?: string | null
          session_date: string
          start_time: string
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          cancelled_reason?: string | null
          class_schedule_id?: string | null
          class_type_id?: string
          created_at?: string
          current_enrollments?: number | null
          end_time?: string
          id?: string
          location?: string | null
          max_capacity?: number
          notes?: string | null
          professor_id?: string | null
          session_date?: string
          start_time?: string
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_schedule_id_fkey"
            columns: ["class_schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      class_types: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          max_capacity: number
          name: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          max_capacity?: number
          name: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          max_capacity?: number
          name?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_types_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      class_waitlist: {
        Row: {
          added_at: string
          class_session_id: string
          expired_at: string | null
          id: string
          lead_id: string
          notified_at: string | null
          position: number
          status: string
          unit_id: string
        }
        Insert: {
          added_at?: string
          class_session_id: string
          expired_at?: string | null
          id?: string
          lead_id: string
          notified_at?: string | null
          position: number
          status?: string
          unit_id: string
        }
        Update: {
          added_at?: string
          class_session_id?: string
          expired_at?: string | null
          id?: string
          lead_id?: string
          notified_at?: string | null
          position?: number
          status?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_waitlist_class_session_id_fkey"
            columns: ["class_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_waitlist_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_waitlist_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          signature_data: string | null
          signed_at: string | null
          signed_ip: string | null
          signed_user_agent: string | null
          status: string
          subscription_id: string | null
          template_id: string | null
          unit_id: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          signature_data?: string | null
          signed_at?: string | null
          signed_ip?: string | null
          signed_user_agent?: string | null
          status?: string
          subscription_id?: string | null
          template_id?: string | null
          unit_id: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          signature_data?: string | null
          signed_at?: string | null
          signed_ip?: string | null
          signed_user_agent?: string | null
          status?: string
          subscription_id?: string | null
          template_id?: string | null
          unit_id?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          equipment: string | null
          id: string
          image_url: string | null
          is_global: boolean | null
          muscle_group: string | null
          name: string
          unit_id: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: string
          image_url?: string | null
          is_global?: boolean | null
          muscle_group?: string | null
          name: string
          unit_id?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: string
          image_url?: string | null
          is_global?: boolean | null
          muscle_group?: string | null
          name?: string
          unit_id?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          current_value: number
          id: string
          is_active: boolean
          name: string
          period_end: string
          period_start: string
          period_type: string
          target_value: number
          type: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          id?: string
          is_active?: boolean
          name: string
          period_end: string
          period_start: string
          period_type: string
          target_value: number
          type: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          id?: string
          is_active?: boolean
          name?: string
          period_end?: string
          period_start?: string
          period_type?: string
          target_value?: number
          type?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string
          id: string
          lead_id: string
          scheduled_at: string | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          lead_id: string
          scheduled_at?: string | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          scheduled_at?: string | null
          type?: Database["public"]["Enums"]["interaction_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          boleto_url: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          installment_number: number | null
          is_recurring: boolean | null
          lead_id: string
          paid_at: string | null
          payment_method_id: string | null
          pix_code: string | null
          recurring_billing_log_id: string | null
          reference_month: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          boleto_url?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          installment_number?: number | null
          is_recurring?: boolean | null
          lead_id: string
          paid_at?: string | null
          payment_method_id?: string | null
          pix_code?: string | null
          recurring_billing_log_id?: string | null
          reference_month?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          boleto_url?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          installment_number?: number | null
          is_recurring?: boolean | null
          lead_id?: string
          paid_at?: string | null
          payment_method_id?: string | null
          pix_code?: string | null
          recurring_billing_log_id?: string | null
          reference_month?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          gender: string | null
          id: string
          notes: string | null
          phone: string
          profile_id: string | null
          source: string | null
          status: Database["public"]["Enums"]["pipeline_status"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone: string
          profile_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["pipeline_status"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string
          profile_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["pipeline_status"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string
          expiry_month: number | null
          expiry_year: number | null
          gateway: string | null
          gateway_customer_id: string | null
          holder_name: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_four_digits: string | null
          lead_id: string
          token: string | null
          type: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          expiry_month?: number | null
          expiry_year?: number | null
          gateway?: string | null
          gateway_customer_id?: string | null
          holder_name?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_four_digits?: string | null
          lead_id: string
          token?: string | null
          type: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          expiry_month?: number | null
          expiry_year?: number | null
          gateway?: string | null
          gateway_customer_id?: string | null
          holder_name?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_four_digits?: string | null
          lead_id?: string
          token?: string | null
          type?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          notes: string | null
          paid_at: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          transaction_id: string | null
          unit_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          paid_at?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          transaction_id?: string | null
          unit_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          transaction_id?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_assessments: {
        Row: {
          abdominal_skinfold: number | null
          assessed_by: string | null
          assessment_date: string
          axillary_skinfold: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          bmi: number | null
          body_fat_percentage: number | null
          chest: number | null
          chest_skinfold: number | null
          created_at: string
          flexibility_test: number | null
          forearm_left: number | null
          forearm_right: number | null
          height: number | null
          hips: number | null
          id: string
          lead_id: string
          lean_mass: number | null
          left_arm: number | null
          left_calf: number | null
          left_thigh: number | null
          muscle_mass: number | null
          neck: number | null
          notes: string | null
          photos_url: string[] | null
          protocol: string | null
          resting_heart_rate: number | null
          right_arm: number | null
          right_calf: number | null
          right_thigh: number | null
          subscapular_skinfold: number | null
          suprailiac_skinfold: number | null
          thigh_skinfold: number | null
          triceps_skinfold: number | null
          unit_id: string
          updated_at: string
          vo2_max: number | null
          waist: number | null
          weight: number | null
        }
        Insert: {
          abdominal_skinfold?: number | null
          assessed_by?: string | null
          assessment_date?: string
          axillary_skinfold?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          bmi?: number | null
          body_fat_percentage?: number | null
          chest?: number | null
          chest_skinfold?: number | null
          created_at?: string
          flexibility_test?: number | null
          forearm_left?: number | null
          forearm_right?: number | null
          height?: number | null
          hips?: number | null
          id?: string
          lead_id: string
          lean_mass?: number | null
          left_arm?: number | null
          left_calf?: number | null
          left_thigh?: number | null
          muscle_mass?: number | null
          neck?: number | null
          notes?: string | null
          photos_url?: string[] | null
          protocol?: string | null
          resting_heart_rate?: number | null
          right_arm?: number | null
          right_calf?: number | null
          right_thigh?: number | null
          subscapular_skinfold?: number | null
          suprailiac_skinfold?: number | null
          thigh_skinfold?: number | null
          triceps_skinfold?: number | null
          unit_id: string
          updated_at?: string
          vo2_max?: number | null
          waist?: number | null
          weight?: number | null
        }
        Update: {
          abdominal_skinfold?: number | null
          assessed_by?: string | null
          assessment_date?: string
          axillary_skinfold?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          bmi?: number | null
          body_fat_percentage?: number | null
          chest?: number | null
          chest_skinfold?: number | null
          created_at?: string
          flexibility_test?: number | null
          forearm_left?: number | null
          forearm_right?: number | null
          height?: number | null
          hips?: number | null
          id?: string
          lead_id?: string
          lean_mass?: number | null
          left_arm?: number | null
          left_calf?: number | null
          left_thigh?: number | null
          muscle_mass?: number | null
          neck?: number | null
          notes?: string | null
          photos_url?: string[] | null
          protocol?: string | null
          resting_heart_rate?: number | null
          right_arm?: number | null
          right_calf?: number | null
          right_thigh?: number | null
          subscapular_skinfold?: number | null
          suprailiac_skinfold?: number | null
          thigh_skinfold?: number | null
          triceps_skinfold?: number | null
          unit_id?: string
          updated_at?: string
          vo2_max?: number | null
          waist?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_assessments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_assessments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          access_type: string | null
          allowed_hours_end: string | null
          allowed_hours_start: string | null
          created_at: string
          description: string | null
          duration_days: number
          features: string[] | null
          id: string
          is_active: boolean | null
          max_access_per_day: number | null
          name: string
          price: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          access_type?: string | null
          allowed_hours_end?: string | null
          allowed_hours_start?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          max_access_per_day?: number | null
          name: string
          price: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          access_type?: string | null
          allowed_hours_end?: string | null
          allowed_hours_start?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          max_access_per_day?: number | null
          name?: string
          price?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          professor_id: string
          start_time: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          professor_id: string
          start_time: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          professor_id?: string
          start_time?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_availability_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          gender: string | null
          id: string
          phone: string | null
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          gender?: string | null
          id?: string
          phone?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          phone?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_billing_logs: {
        Row: {
          amount: number
          attempt_number: number | null
          created_at: string
          error_message: string | null
          gateway_response: Json | null
          id: string
          invoice_id: string | null
          next_retry_at: string | null
          payment_method_id: string | null
          processed_at: string | null
          status: string
          subscription_id: string
          unit_id: string
        }
        Insert: {
          amount: number
          attempt_number?: number | null
          created_at?: string
          error_message?: string | null
          gateway_response?: Json | null
          id?: string
          invoice_id?: string | null
          next_retry_at?: string | null
          payment_method_id?: string | null
          processed_at?: string | null
          status: string
          subscription_id: string
          unit_id: string
        }
        Update: {
          amount?: number
          attempt_number?: number | null
          created_at?: string
          error_message?: string | null
          gateway_response?: Json | null
          id?: string
          invoice_id?: string | null
          next_retry_at?: string | null
          payment_method_id?: string | null
          processed_at?: string | null
          status?: string
          subscription_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_billing_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_billing_logs_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_billing_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_billing_logs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_blocks: {
        Row: {
          all_day: boolean | null
          block_date: string
          created_at: string
          end_time: string | null
          id: string
          professor_id: string | null
          reason: string | null
          start_time: string | null
          unit_id: string
        }
        Insert: {
          all_day?: boolean | null
          block_date: string
          created_at?: string
          end_time?: string | null
          id?: string
          professor_id?: string | null
          reason?: string | null
          start_time?: string | null
          unit_id: string
        }
        Update: {
          all_day?: boolean | null
          block_date?: string
          created_at?: string
          end_time?: string | null
          id?: string
          professor_id?: string | null
          reason?: string | null
          start_time?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          billing_type: string | null
          created_at: string
          current_installment: number | null
          end_date: string
          id: string
          installments: number | null
          lead_id: string
          payment_day: number | null
          plan_id: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean | null
          billing_type?: string | null
          created_at?: string
          current_installment?: number | null
          end_date: string
          id?: string
          installments?: number | null
          lead_id: string
          payment_day?: number | null
          plan_id: string
          start_date: string
          status?: Database["public"]["Enums"]["subscription_status"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean | null
          billing_type?: string | null
          created_at?: string
          current_installment?: number | null
          end_date?: string
          id?: string
          installments?: number | null
          lead_id?: string
          payment_day?: number | null
          plan_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          lead_id: string | null
          priority: string | null
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
          priority?: string | null
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
          priority?: string | null
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          address: string | null
          allow_entry_if_overdue: boolean | null
          cnpj: string | null
          created_at: string
          dark_accent_color: string | null
          dark_background_color: string | null
          dark_primary_color: string | null
          email: string | null
          favicon_url: string | null
          font_family: string | null
          id: string
          inactivity_alert_days: number | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          overdue_grace_days: number | null
          phone: string | null
          primary_color: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allow_entry_if_overdue?: boolean | null
          cnpj?: string | null
          created_at?: string
          dark_accent_color?: string | null
          dark_background_color?: string | null
          dark_primary_color?: string | null
          email?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          inactivity_alert_days?: number | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          overdue_grace_days?: number | null
          phone?: string | null
          primary_color?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allow_entry_if_overdue?: boolean | null
          cnpj?: string | null
          created_at?: string
          dark_accent_color?: string | null
          dark_background_color?: string | null
          dark_primary_color?: string | null
          email?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          inactivity_alert_days?: number | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          overdue_grace_days?: number | null
          phone?: string | null
          primary_color?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          unit_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          unit_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          advanced_technique: string | null
          created_at: string
          exercise_id: string | null
          exercise_name: string
          id: string
          load_unit: string | null
          load_value: number | null
          notes: string | null
          order_index: number
          reps: string
          rest_seconds: number | null
          sets: number
          workout_id: string
        }
        Insert: {
          advanced_technique?: string | null
          created_at?: string
          exercise_id?: string | null
          exercise_name: string
          id?: string
          load_unit?: string | null
          load_value?: number | null
          notes?: string | null
          order_index?: number
          reps?: string
          rest_seconds?: number | null
          sets?: number
          workout_id: string
        }
        Update: {
          advanced_technique?: string | null
          created_at?: string
          exercise_id?: string | null
          exercise_name?: string
          id?: string
          load_unit?: string | null
          load_value?: number | null
          notes?: string | null
          order_index?: number
          reps?: string
          rest_seconds?: number | null
          sets?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          lead_id: string
          load_used: number | null
          notes: string | null
          reps_completed: string | null
          sets_completed: number | null
          unit_id: string
          workout_exercise_id: string
          workout_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          lead_id: string
          load_used?: number | null
          notes?: string | null
          reps_completed?: string | null
          sets_completed?: number | null
          unit_id: string
          workout_exercise_id: string
          workout_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          lead_id?: string
          load_used?: number | null
          notes?: string | null
          reps_completed?: string | null
          sets_completed?: number | null
          unit_id?: string
          workout_exercise_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          lead_id: string
          name: string
          unit_id: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lead_id: string
          name: string
          unit_id: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lead_id?: string
          name?: string
          unit_id?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_unit_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_belongs_to_unit: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "gestor" | "recepcao" | "professor" | "aluno"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      appointment_type:
        | "aula_experimental"
        | "avaliacao_fisica"
        | "treino"
        | "consulta"
        | "outros"
      automation_status: "pending" | "sent" | "failed" | "cancelled"
      automation_type:
        | "welcome"
        | "renewal_reminder"
        | "birthday"
        | "overdue"
        | "inactivity"
      interaction_type:
        | "ligacao"
        | "whatsapp"
        | "email"
        | "presencial"
        | "sistema"
      invoice_status: "pending" | "paid" | "overdue" | "cancelled" | "refunded"
      payment_method: "pix" | "boleto" | "credit_card" | "debit_card" | "cash"
      pipeline_status:
        | "lead"
        | "visita_agendada"
        | "negociacao"
        | "ativo"
        | "inativo"
        | "cancelado"
      subscription_status:
        | "active"
        | "pending"
        | "cancelled"
        | "expired"
        | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["gestor", "recepcao", "professor", "aluno"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      appointment_type: [
        "aula_experimental",
        "avaliacao_fisica",
        "treino",
        "consulta",
        "outros",
      ],
      automation_status: ["pending", "sent", "failed", "cancelled"],
      automation_type: [
        "welcome",
        "renewal_reminder",
        "birthday",
        "overdue",
        "inactivity",
      ],
      interaction_type: [
        "ligacao",
        "whatsapp",
        "email",
        "presencial",
        "sistema",
      ],
      invoice_status: ["pending", "paid", "overdue", "cancelled", "refunded"],
      payment_method: ["pix", "boleto", "credit_card", "debit_card", "cash"],
      pipeline_status: [
        "lead",
        "visita_agendada",
        "negociacao",
        "ativo",
        "inativo",
        "cancelado",
      ],
      subscription_status: [
        "active",
        "pending",
        "cancelled",
        "expired",
        "suspended",
      ],
    },
  },
} as const
