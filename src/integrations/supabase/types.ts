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
      assinaturas: {
        Row: {
          cancelou_em: string | null
          created_at: string
          gateway: string
          gateway_id: string | null
          id: string
          iniciou_em: string | null
          metodo_pagamento: string | null
          plano: string
          proxima_cobranca_em: string | null
          status: string
          updated_at: string
          user_id: string
          valor_centavos: number
          vence_em: string | null
        }
        Insert: {
          cancelou_em?: string | null
          created_at?: string
          gateway?: string
          gateway_id?: string | null
          id?: string
          iniciou_em?: string | null
          metodo_pagamento?: string | null
          plano: string
          proxima_cobranca_em?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valor_centavos: number
          vence_em?: string | null
        }
        Update: {
          cancelou_em?: string | null
          created_at?: string
          gateway?: string
          gateway_id?: string | null
          id?: string
          iniciou_em?: string | null
          metodo_pagamento?: string | null
          plano?: string
          proxima_cobranca_em?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor_centavos?: number
          vence_em?: string | null
        }
        Relationships: []
      }
      cobrancas: {
        Row: {
          assinatura_id: string
          created_at: string
          gateway_charge_id: string | null
          id: string
          pago_em: string | null
          status: string
          tentativa: number
          user_id: string
          valor_centavos: number
          vencimento: string
        }
        Insert: {
          assinatura_id: string
          created_at?: string
          gateway_charge_id?: string | null
          id?: string
          pago_em?: string | null
          status?: string
          tentativa?: number
          user_id: string
          valor_centavos: number
          vencimento: string
        }
        Update: {
          assinatura_id?: string
          created_at?: string
          gateway_charge_id?: string | null
          id?: string
          pago_em?: string | null
          status?: string
          tentativa?: number
          user_id?: string
          valor_centavos?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobrancas_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_estudo: {
        Row: {
          created_at: string
          cronograma: Json
          dias_semana: number
          horas_dia: number
          id: string
          meta: string | null
          pontos_fracos: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          cronograma: Json
          dias_semana: number
          horas_dia: number
          id?: string
          meta?: string | null
          pontos_fracos?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          cronograma?: Json
          dias_semana?: number
          horas_dia?: number
          id?: string
          meta?: string | null
          pontos_fracos?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          plan: string
          plan_expires_at: string | null
          plan_vitalicio: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          plan?: string
          plan_expires_at?: string | null
          plan_vitalicio?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          plan?: string
          plan_expires_at?: string | null
          plan_vitalicio?: boolean
        }
        Relationships: []
      }
      questoes_simulado: {
        Row: {
          alt_a: string
          alt_b: string
          alt_c: string
          alt_d: string
          alt_e: string | null
          area: string
          enunciado: string
          id: string
          numero: number
          peso: number
          resposta_correta: string
          simulado_id: string
        }
        Insert: {
          alt_a: string
          alt_b: string
          alt_c: string
          alt_d: string
          alt_e?: string | null
          area: string
          enunciado: string
          id?: string
          numero: number
          peso?: number
          resposta_correta: string
          simulado_id: string
        }
        Update: {
          alt_a?: string
          alt_b?: string
          alt_c?: string
          alt_d?: string
          alt_e?: string | null
          area?: string
          enunciado?: string
          id?: string
          numero?: number
          peso?: number
          resposta_correta?: string
          simulado_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_simulado_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
        ]
      }
      redacoes: {
        Row: {
          competencia_1: number | null
          competencia_2: number | null
          competencia_3: number | null
          competencia_4: number | null
          competencia_5: number | null
          created_at: string
          feedback: Json | null
          id: string
          modo_rigido: boolean
          nota_total: number | null
          tema: string | null
          texto: string
          user_id: string
        }
        Insert: {
          competencia_1?: number | null
          competencia_2?: number | null
          competencia_3?: number | null
          competencia_4?: number | null
          competencia_5?: number | null
          created_at?: string
          feedback?: Json | null
          id?: string
          modo_rigido?: boolean
          nota_total?: number | null
          tema?: string | null
          texto: string
          user_id: string
        }
        Update: {
          competencia_1?: number | null
          competencia_2?: number | null
          competencia_3?: number | null
          competencia_4?: number | null
          competencia_5?: number | null
          created_at?: string
          feedback?: Json | null
          id?: string
          modo_rigido?: boolean
          nota_total?: number | null
          tema?: string | null
          texto?: string
          user_id?: string
        }
        Relationships: []
      }
      respostas_aluno: {
        Row: {
          correta: boolean | null
          created_at: string
          id: string
          questao_id: string
          resposta_marcada: string | null
          tentativa_id: string
          user_id: string
        }
        Insert: {
          correta?: boolean | null
          created_at?: string
          id?: string
          questao_id: string
          resposta_marcada?: string | null
          tentativa_id: string
          user_id: string
        }
        Update: {
          correta?: boolean | null
          created_at?: string
          id?: string
          questao_id?: string
          resposta_marcada?: string | null
          tentativa_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "respostas_aluno_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questoes_simulado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_aluno_tentativa_id_fkey"
            columns: ["tentativa_id"]
            isOneToOne: false
            referencedRelation: "tentativas_simulado"
            referencedColumns: ["id"]
          },
        ]
      }
      simulados: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          total_questoes: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          total_questoes: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          total_questoes?: number
        }
        Relationships: []
      }
      tentativas_simulado: {
        Row: {
          acertos: number | null
          acertos_por_area: Json | null
          finished_at: string | null
          id: string
          nota_total: number | null
          simulado_id: string
          started_at: string
          total: number | null
          user_id: string
        }
        Insert: {
          acertos?: number | null
          acertos_por_area?: Json | null
          finished_at?: string | null
          id?: string
          nota_total?: number | null
          simulado_id: string
          started_at?: string
          total?: number | null
          user_id: string
        }
        Update: {
          acertos?: number | null
          acertos_por_area?: Json | null
          finished_at?: string | null
          id?: string
          nota_total?: number | null
          simulado_id?: string
          started_at?: string
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tentativas_simulado_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          id: string | null
          primeiro_nome: string | null
        }
        Insert: {
          id?: string | null
          primeiro_nome?: never
        }
        Update: {
          id?: string | null
          primeiro_nome?: never
        }
        Relationships: []
      }
      ranking_global: {
        Row: {
          melhor_nota: number | null
          nome: string | null
          total_redacoes: number | null
          ultima_redacao: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_assinatura_ativa: { Args: { _user_id: string }; Returns: boolean }
      plano_ativo: { Args: { _user_id: string }; Returns: boolean }
      pode_corrigir_redacao: { Args: { _user_id: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
