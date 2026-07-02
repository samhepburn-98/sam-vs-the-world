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
      app_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          created_at: string
          game_number: number
          id: string
          match_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_number: number
          id?: string
          match_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_number?: number
          id?: string
          match_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match_results"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "games_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          ball_type: Database["public"]["Enums"]["ball_type"] | null
          created_at: string
          date: string
          format: number | null
          id: string
          notes: string | null
          player1_id: string
          player2_id: string
          target_score: number
          tiebreak: Database["public"]["Enums"]["tiebreak"]
          updated_at: string
          venue: string | null
        }
        Insert: {
          ball_type?: Database["public"]["Enums"]["ball_type"] | null
          created_at?: string
          date?: string
          format?: number | null
          id?: string
          notes?: string | null
          player1_id: string
          player2_id: string
          target_score?: number
          tiebreak?: Database["public"]["Enums"]["tiebreak"]
          updated_at?: string
          venue?: string | null
        }
        Update: {
          ball_type?: Database["public"]["Enums"]["ball_type"] | null
          created_at?: string
          date?: string
          format?: number | null
          id?: string
          notes?: string | null
          player1_id?: string
          player2_id?: string
          target_score?: number
          tiebreak?: Database["public"]["Enums"]["tiebreak"]
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          handedness: Database["public"]["Enums"]["handedness"] | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          handedness?: Database["public"]["Enums"]["handedness"] | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          handedness?: Database["public"]["Enums"]["handedness"] | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rallies: {
        Row: {
          created_at: string
          end_reason: Database["public"]["Enums"]["end_reason"]
          error_detail: Database["public"]["Enums"]["error_detail"] | null
          forced: boolean | null
          game_id: string
          id: string
          rally_number: number
          serve_number: number
          serve_side: Database["public"]["Enums"]["serve_side"]
          server_id: string
          shot_count: number | null
          shot_type: Database["public"]["Enums"]["shot_type"] | null
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          end_reason: Database["public"]["Enums"]["end_reason"]
          error_detail?: Database["public"]["Enums"]["error_detail"] | null
          forced?: boolean | null
          game_id: string
          id?: string
          rally_number: number
          serve_number: number
          serve_side: Database["public"]["Enums"]["serve_side"]
          server_id: string
          shot_count?: number | null
          shot_type?: Database["public"]["Enums"]["shot_type"] | null
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          end_reason?: Database["public"]["Enums"]["end_reason"]
          error_detail?: Database["public"]["Enums"]["error_detail"] | null
          forced?: boolean | null
          game_id?: string
          id?: string
          rally_number?: number
          serve_number?: number
          serve_side?: Database["public"]["Enums"]["serve_side"]
          server_id?: string
          shot_count?: number | null
          shot_type?: Database["public"]["Enums"]["shot_type"] | null
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rallies_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rallies_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rallies_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      errors_attributed: {
        Row: {
          end_reason: Database["public"]["Enums"]["end_reason"] | null
          error_detail: Database["public"]["Enums"]["error_detail"] | null
          error_maker_id: string | null
          forced: boolean | null
          game_id: string | null
          match_id: string | null
          rally_id: string | null
          rally_number: number | null
          winner_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match_results"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "games_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rallies_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rallies_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_results: {
        Row: {
          ball_type: Database["public"]["Enums"]["ball_type"] | null
          date: string | null
          game_id: string | null
          game_number: number | null
          is_undecided: boolean | null
          match_id: string | null
          player1_id: string | null
          player2_id: string | null
          score_p1: number | null
          score_p2: number | null
          winner_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match_results"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "games_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rallies_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          ball_type: Database["public"]["Enums"]["ball_type"] | null
          date: string | null
          format: number | null
          games_won_p1: number | null
          games_won_p2: number | null
          match_id: string | null
          match_winner_id: string | null
          player1_id: string | null
          player2_id: string | null
          target_score: number | null
          venue: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      rallies_scored: {
        Row: {
          ball_type: Database["public"]["Enums"]["ball_type"] | null
          date: string | null
          end_reason: Database["public"]["Enums"]["end_reason"] | null
          error_detail: Database["public"]["Enums"]["error_detail"] | null
          forced: boolean | null
          game_id: string | null
          game_number: number | null
          id: string | null
          is_let: boolean | null
          match_id: string | null
          player1_id: string | null
          player2_id: string | null
          rally_number: number | null
          receiver_id: string | null
          score_p1: number | null
          score_p2: number | null
          serve_number: number | null
          serve_side: Database["public"]["Enums"]["serve_side"] | null
          server_id: string | null
          shot_count: number | null
          shot_type: Database["public"]["Enums"]["shot_type"] | null
          winner_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match_results"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "games_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rallies_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rallies_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rallies_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_owner: { Args: never; Returns: boolean }
    }
    Enums: {
      ball_type: "blue" | "red" | "yellow" | "double_yellow"
      end_reason: "winner" | "error" | "stroke" | "let" | "ace" | "serve_fault"
      error_detail:
        | "tin"
        | "out_top"
        | "out_side"
        | "out_back"
        | "not_up"
        | "double_bounce"
      handedness: "left" | "right"
      serve_side: "left" | "right"
      shot_type:
        | "drop"
        | "drive"
        | "kill"
        | "nick"
        | "boast"
        | "volley"
        | "lob"
        | "other"
      tiebreak: "win_by_2" | "sudden_death"
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
      ball_type: ["blue", "red", "yellow", "double_yellow"],
      end_reason: ["winner", "error", "stroke", "let", "ace", "serve_fault"],
      error_detail: [
        "tin",
        "out_top",
        "out_side",
        "out_back",
        "not_up",
        "double_bounce",
      ],
      handedness: ["left", "right"],
      serve_side: ["left", "right"],
      shot_type: [
        "drop",
        "drive",
        "kill",
        "nick",
        "boast",
        "volley",
        "lob",
        "other",
      ],
      tiebreak: ["win_by_2", "sudden_death"],
    },
  },
} as const
