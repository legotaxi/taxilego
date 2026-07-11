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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      drivers: {
        Row: {
          approved_at: string | null
          bi_number: string | null
          bi_url: string | null
          created_at: string
          criminal_record_url: string | null
          current_lat: number | null
          current_lng: number | null
          id: string
          is_online: boolean
          license_number: string | null
          license_url: string | null
          photo_url: string | null
          rating: number | null
          status: Database["public"]["Enums"]["driver_status"]
          total_rides: number
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          approved_at?: string | null
          bi_number?: string | null
          bi_url?: string | null
          created_at?: string
          criminal_record_url?: string | null
          current_lat?: number | null
          current_lng?: number | null
          id: string
          is_online?: boolean
          license_number?: string | null
          license_url?: string | null
          photo_url?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_rides?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          approved_at?: string | null
          bi_number?: string | null
          bi_url?: string | null
          created_at?: string
          criminal_record_url?: string | null
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          is_online?: boolean
          license_number?: string | null
          license_url?: string | null
          photo_url?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_rides?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed: boolean
          created_at: string
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed?: boolean
          created_at?: string
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          language: string | null
          phone: string | null
          updated_at: string
          wallet_balance_kz: number
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          language?: string | null
          phone?: string | null
          updated_at?: string
          wallet_balance_kz?: number
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          updated_at?: string
          wallet_balance_kz?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ride_messages: {
        Row: {
          created_at: string
          id: string
          read_at: string | null
          ride_id: string
          sender_id: string
          sender_role: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          read_at?: string | null
          ride_id: string
          sender_id: string
          sender_role: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          read_at?: string | null
          ride_id?: string
          sender_id?: string
          sender_role?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_messages_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          cashback_kz: number
          category: Database["public"]["Enums"]["ride_category"]
          completed_at: string | null
          created_at: string
          distance_km: number | null
          driver_id: string | null
          driver_rating: number | null
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          duration_min: number | null
          fare_kz: number
          id: string
          paid_at: string | null
          passenger_id: string
          passenger_rating: number | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          requested_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["ride_status"]
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          cashback_kz?: number
          category?: Database["public"]["Enums"]["ride_category"]
          completed_at?: string | null
          created_at?: string
          distance_km?: number | null
          driver_id?: string | null
          driver_rating?: number | null
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          duration_min?: number | null
          fare_kz?: number
          id?: string
          paid_at?: string | null
          passenger_id: string
          passenger_rating?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          requested_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          cashback_kz?: number
          category?: Database["public"]["Enums"]["ride_category"]
          completed_at?: string | null
          created_at?: string
          distance_km?: number | null
          driver_id?: string | null
          driver_rating?: number | null
          dropoff_address?: string
          dropoff_lat?: number
          dropoff_lng?: number
          duration_min?: number | null
          fare_kz?: number
          id?: string
          paid_at?: string | null
          passenger_id?: string
          passenger_rating?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          pickup_address?: string
          pickup_lat?: number
          pickup_lng?: number
          requested_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_kz: number
          created_at: string
          description: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          reference: string | null
          ride_id: string | null
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Insert: {
          amount_kz: number
          created_at?: string
          description?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          reference?: string | null
          ride_id?: string | null
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Update: {
          amount_kz?: number
          created_at?: string
          description?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          reference?: string | null
          ride_id?: string | null
          type?: Database["public"]["Enums"]["tx_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string
          category: Database["public"]["Enums"]["ride_category"]
          color: string | null
          created_at: string
          id: string
          model: string
          owner_id: string
          plate: string
          year: number | null
        }
        Insert: {
          brand: string
          category?: Database["public"]["Enums"]["ride_category"]
          color?: string | null
          created_at?: string
          id?: string
          model: string
          owner_id: string
          plate: string
          year?: number | null
        }
        Update: {
          brand?: string
          category?: Database["public"]["Enums"]["ride_category"]
          color?: string | null
          created_at?: string
          id?: string
          model?: string
          owner_id?: string
          plate?: string
          year?: number | null
        }
        Relationships: []
      }
      wallet_topup_requests: {
        Row: {
          amount_kz: number
          created_at: string
          id: string
          method: string
          processed_at: string | null
          processed_by: string | null
          reference_code: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_kz: number
          created_at?: string
          id?: string
          method: string
          processed_at?: string | null
          processed_by?: string | null
          reference_code?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_kz?: number
          created_at?: string
          id?: string
          method?: string
          processed_at?: string | null
          processed_by?: string | null
          reference_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_withdrawal_requests: {
        Row: {
          amount_kz: number
          bank_holder: string
          bank_iban: string
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_kz: number
          bank_holder: string
          bank_iban: string
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_kz?: number
          bank_holder?: string
          bank_iban?: string
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_ride_payment: { Args: { _ride_id: string }; Returns: Json }
      confirm_wallet_topup: { Args: { _topup_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      rate_driver: { Args: { _ride_id: string; _stars: number }; Returns: Json }
      reject_wallet_withdrawal: { Args: { _id: string }; Returns: Json }
      request_wallet_topup: {
        Args: { _amount_kz: number; _method: string; _reference_code?: string }
        Returns: Json
      }
      request_wallet_withdrawal: {
        Args: { _amount_kz: number; _bank_holder: string; _bank_iban: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "driver" | "passenger"
      driver_status: "pending" | "approved" | "suspended" | "rejected"
      payment_method: "cash" | "mcx_express" | "reference" | "wallet" | "card"
      ride_category:
        | "moto"
        | "normal"
        | "xl"
        | "premium"
        | "shared"
        | "delivery"
      ride_status:
        | "requested"
        | "accepted"
        | "arriving"
        | "in_progress"
        | "completed"
        | "cancelled"
      tx_type:
        | "topup"
        | "ride_payment"
        | "ride_earning"
        | "bonus"
        | "refund"
        | "withdrawal"
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
      app_role: ["admin", "driver", "passenger"],
      driver_status: ["pending", "approved", "suspended", "rejected"],
      payment_method: ["cash", "mcx_express", "reference", "wallet", "card"],
      ride_category: ["moto", "normal", "xl", "premium", "shared", "delivery"],
      ride_status: [
        "requested",
        "accepted",
        "arriving",
        "in_progress",
        "completed",
        "cancelled",
      ],
      tx_type: [
        "topup",
        "ride_payment",
        "ride_earning",
        "bonus",
        "refund",
        "withdrawal",
      ],
    },
  },
} as const
