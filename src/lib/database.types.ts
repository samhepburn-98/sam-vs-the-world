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
          let_resets_serve: boolean
          notes: string | null
          player1_id: string
          player2_id: string
          serves_per_point: number
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
          let_resets_serve?: boolean
          notes?: string | null
          player1_id: string
          player2_id: string
          serves_per_point?: number
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
          let_resets_serve?: boolean
          notes?: string | null
          player1_id?: string
          player2_id?: string
          serves_per_point?: number
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
          avatar_url: string | null
          created_at: string
          handedness: Database["public"]["Enums"]["handedness"] | null
          id: string
          is_protagonist: boolean
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          handedness?: Database["public"]["Enums"]["handedness"] | null
          id?: string
          is_protagonist?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          handedness?: Database["public"]["Enums"]["handedness"] | null
          id?: string
          is_protagonist?: boolean
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
          losing_shot: Database["public"]["Enums"]["shot_type"] | null
          rally_number: number
          serve_number: number
          serve_side: Database["public"]["Enums"]["serve_side"]
          server_id: string
          shot_count: number | null
          updated_at: string
          winner_id: string | null
          winning_shot: Database["public"]["Enums"]["shot_type"] | null
        }
        Insert: {
          created_at?: string
          end_reason: Database["public"]["Enums"]["end_reason"]
          error_detail?: Database["public"]["Enums"]["error_detail"] | null
          forced?: boolean | null
          game_id: string
          id?: string
          losing_shot?: Database["public"]["Enums"]["shot_type"] | null
          rally_number: number
          serve_number: number
          serve_side: Database["public"]["Enums"]["serve_side"]
          server_id: string
          shot_count?: number | null
          updated_at?: string
          winner_id?: string | null
          winning_shot?: Database["public"]["Enums"]["shot_type"] | null
        }
        Update: {
          created_at?: string
          end_reason?: Database["public"]["Enums"]["end_reason"]
          error_detail?: Database["public"]["Enums"]["error_detail"] | null
          forced?: boolean | null
          game_id?: string
          id?: string
          losing_shot?: Database["public"]["Enums"]["shot_type"] | null
          rally_number?: number
          serve_number?: number
          serve_side?: Database["public"]["Enums"]["serve_side"]
          server_id?: string
          shot_count?: number | null
          updated_at?: string
          winner_id?: string | null
          winning_shot?: Database["public"]["Enums"]["shot_type"] | null
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
          created_at: string | null
          date: string | null
          format: number | null
          games_won_p1: number | null
          games_won_p2: number | null
          match_id: string | null
          match_winner_id: string | null
          outcome: string | null
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
          losing_shot: Database["public"]["Enums"]["shot_type"] | null
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
          winner_id: string | null
          winning_shot: Database["public"]["Enums"]["shot_type"] | null
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
      create_match_with_game: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"] | null
          p_date: string
          p_format?: number | null
          p_let_resets_serve?: boolean
          p_player1_id: string
          p_player2_id: string
          p_serves_per_point?: number
          p_target_score?: number
          p_tiebreak?: Database["public"]["Enums"]["tiebreak"]
          p_venue?: string | null
        }
        Returns: string
      }
      comeback_rallies: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_deficit?: number
          p_opponent_id?: string
          p_player_id: string
        }
        Returns: {
          ball_type: Database["public"]["Enums"]["ball_type"] | null
          date: string | null
          end_reason: Database["public"]["Enums"]["end_reason"] | null
          error_detail: Database["public"]["Enums"]["error_detail"] | null
          forced: boolean | null
          game_id: string | null
          game_number: number | null
          id: string | null
          is_let: boolean | null
          losing_shot: Database["public"]["Enums"]["shot_type"] | null
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
          winner_id: string | null
          winning_shot: Database["public"]["Enums"]["shot_type"] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "rallies_scored"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      error_profile: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_opponent_id?: string
          p_player_id: string
        }
        Returns: {
          detail_untagged: number
          errors_total: number
          forced_errors: number
          games_played: number
          not_up: number
          out_back: number
          out_side: number
          out_top: number
          tin: number
          trend: Json
          unforced_errors: number
          untagged_errors: number
        }[]
      }
      error_rallies: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_opponent_id?: string
          p_player_id: string
        }
        Returns: {
          ball_type: Database["public"]["Enums"]["ball_type"] | null
          date: string | null
          end_reason: Database["public"]["Enums"]["end_reason"] | null
          error_detail: Database["public"]["Enums"]["error_detail"] | null
          forced: boolean | null
          game_id: string | null
          game_number: number | null
          id: string | null
          is_let: boolean | null
          losing_shot: Database["public"]["Enums"]["shot_type"] | null
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
          winner_id: string | null
          winning_shot: Database["public"]["Enums"]["shot_type"] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "rallies_scored"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      filtered_games: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_opponent_id?: string
          p_player_id: string
        }
        Returns: {
          ball_type: Database["public"]["Enums"]["ball_type"]
          created_at: string
          date: string
          game_id: string
          game_number: number
          is_undecided: boolean
          match_id: string
          opponent_id: string
          opponent_score: number
          player_score: number
          won: boolean
        }[]
      }
      filtered_matches: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_opponent_id?: string
          p_player_id: string
        }
        Returns: {
          ball_type: Database["public"]["Enums"]["ball_type"]
          created_at: string
          date: string
          match_id: string
          opponent_games: number
          opponent_id: string
          player_games: number
          winner_id: string
          won: boolean
        }[]
      }
      filtered_rallies: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_opponent_id?: string
          p_player_id: string
        }
        Returns: {
          ball_type: Database["public"]["Enums"]["ball_type"] | null
          date: string | null
          end_reason: Database["public"]["Enums"]["end_reason"] | null
          error_detail: Database["public"]["Enums"]["error_detail"] | null
          forced: boolean | null
          game_id: string | null
          game_number: number | null
          id: string | null
          is_let: boolean | null
          losing_shot: Database["public"]["Enums"]["shot_type"] | null
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
          winner_id: string | null
          winning_shot: Database["public"]["Enums"]["shot_type"] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "rallies_scored"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      h2h: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_player1_id: string
          p_player2_id: string
        }
        Returns: {
          games_decided: number
          games_won_p1: number
          games_won_p2: number
          match_history: Json
          matches_decided: number
          matches_won_p1: number
          matches_won_p2: number
        }[]
      }
      h2h_rallies: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_player1_id: string
          p_player2_id: string
        }
        Returns: {
          ball_type: Database["public"]["Enums"]["ball_type"] | null
          date: string | null
          end_reason: Database["public"]["Enums"]["end_reason"] | null
          error_detail: Database["public"]["Enums"]["error_detail"] | null
          forced: boolean | null
          game_id: string | null
          game_number: number | null
          id: string | null
          is_let: boolean | null
          losing_shot: Database["public"]["Enums"]["shot_type"] | null
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
          winner_id: string | null
          winning_shot: Database["public"]["Enums"]["shot_type"] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "rallies_scored"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      insert_rally_at: {
        Args: {
          p_end_reason: Database["public"]["Enums"]["end_reason"]
          p_error_detail?: Database["public"]["Enums"]["error_detail"]
          p_forced?: boolean
          p_game_id: string
          p_id: string
          p_losing_shot?: Database["public"]["Enums"]["shot_type"]
          p_rally_number: number
          p_serve_number: number
          p_serve_side: Database["public"]["Enums"]["serve_side"]
          p_server_id: string
          p_shot_count?: number
          p_winner_id: string
          p_winning_shot?: Database["public"]["Enums"]["shot_type"]
        }
        Returns: string
      }
      is_owner: { Args: never; Returns: boolean }
      decisive_shots: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_opponent_id?: string
          p_player_id: string
        }
        Returns: {
          losing_boast: number
          losing_drive: number
          losing_drop: number
          winning_boast: number
          winning_drive: number
          winning_drop: number
        }[]
      }
      momentum: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_deficit?: number
          p_opponent_id?: string
          p_player_id: string
        }
        Returns: {
          close_rallies: number
          close_wins: number
          comeback_games: Json
          comebacks: number
          early_rallies: number
          early_wins: number
          longest_streak: number
          longest_streak_game_id: string
          mid_rallies: number
          mid_wins: number
        }[]
      }
      player_headline: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_opponent_id?: string
          p_player_id: string
        }
        Returns: {
          clean_finish_wins: number
          games_decided: number
          games_won: number
          matches_decided: number
          matches_won: number
          player_id: string
          points_won: number
          recent_games: Json
          signature_trait: string
        }[]
      }
      players_headline: {
        Args: never
        Returns: {
          clean_finish_wins: number
          games_decided: number
          games_won: number
          handedness: Database["public"]["Enums"]["handedness"]
          matches_decided: number
          matches_won: number
          name: string
          player_id: string
          points_won: number
          recent_games: Json
          signature_trait: string
        }[]
      }
      records: {
        Args: never
        Returns: {
          record_key: string
          player_id: string | null
          player1_id: string
          player2_id: string
          value: number
          detail: string | null
          match_id: string
          date: string
        }[]
      }
      rally_length_rallies: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_bucket?: string
          p_date_from?: string
          p_date_to?: string
          p_opponent_id?: string
          p_player_id: string
        }
        Returns: {
          ball_type: Database["public"]["Enums"]["ball_type"] | null
          date: string | null
          end_reason: Database["public"]["Enums"]["end_reason"] | null
          error_detail: Database["public"]["Enums"]["error_detail"] | null
          forced: boolean | null
          game_id: string | null
          game_number: number | null
          id: string | null
          is_let: boolean | null
          losing_shot: Database["public"]["Enums"]["shot_type"] | null
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
          winner_id: string | null
          winning_shot: Database["public"]["Enums"]["shot_type"] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "rallies_scored"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      rally_lengths: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_opponent_id?: string
          p_player_id: string
        }
        Returns: {
          avg_length: number
          long_rallies: number
          long_wins: number
          longest: number
          medium_rallies: number
          medium_wins: number
          short_rallies: number
          short_wins: number
          total_rallies: number
        }[]
      }
      serve_rallies: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_opponent_id?: string
          p_player_id: string
        }
        Returns: {
          ball_type: Database["public"]["Enums"]["ball_type"] | null
          date: string | null
          end_reason: Database["public"]["Enums"]["end_reason"] | null
          error_detail: Database["public"]["Enums"]["error_detail"] | null
          forced: boolean | null
          game_id: string | null
          game_number: number | null
          id: string | null
          is_let: boolean | null
          losing_shot: Database["public"]["Enums"]["shot_type"] | null
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
          winner_id: string | null
          winning_shot: Database["public"]["Enums"]["shot_type"] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "rallies_scored"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      serve_stats: {
        Args: {
          p_ball_type?: Database["public"]["Enums"]["ball_type"]
          p_date_from?: string
          p_date_to?: string
          p_opponent_id?: string
          p_player_id: string
        }
        Returns: {
          aces: number
          double_faults: number
          first_serve_faults: number
          left_served: number
          left_wins: number
          rallies_returned: number
          rallies_served: number
          return_wins: number
          right_served: number
          right_wins: number
          serve_wins: number
          serve1_served: number
          serve1_wins: number
          serve2_served: number
          serve2_wins: number
          two_serve_rallies_served: number
        }[]
      }
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
