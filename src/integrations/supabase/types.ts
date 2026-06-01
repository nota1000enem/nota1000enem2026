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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          attempts: number
          codigo: string
          created_at: string
          email: string
          expires_at: string
          sent_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          codigo: string
          created_at?: string
          email: string
          expires_at: string
          sent_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          codigo?: string
          created_at?: string
          email?: string
          expires_at?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          created_at: string
          id: string
          mp_payment_id: string
          plan_type: string
          raw: Json | null
          status: string
          user_id: string
          valor_centavos: number
        }
        Insert: {
          created_at?: string
          id?: string
          mp_payment_id: string
          plan_type: string
          raw?: Json | null
          status: string
          user_id: string
          valor_centavos: number
        }
        Update: {
          created_at?: string
          id?: string
          mp_payment_id?: string
          plan_type?: string
          raw?: Json | null
          status?: string
          user_id?: string
          valor_centavos?: number
        }
        Relationships: []
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
          avatar_url: string | null
          created_at: string
          email: string | null
          email_verified_at: string | null
          estado: string | null
          full_name: string | null
          id: string
          idade: number | null
          mp_customer_id: string | null
          plan: string
          plan_expires_at: string | null
          plan_vitalicio: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_verified_at?: string | null
          estado?: string | null
          full_name?: string | null
          id: string
          idade?: number | null
          mp_customer_id?: string | null
          plan?: string
          plan_expires_at?: string | null
          plan_vitalicio?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_verified_at?: string | null
          estado?: string | null
          full_name?: string | null
          id?: string
          idade?: number | null
          mp_customer_id?: string | null
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
            referencedRelation: "questoes_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_aluno_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questoes_simulado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_aluno_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questoes_simulado_publica"
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
      subscriptions: {
        Row: {
          created_at: string
          credits_remaining: number
          current_period_end: string
          id: string
          plan_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          current_period_end: string
          id?: string
          plan_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          current_period_end?: string
          id?: string
          plan_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      video_lessons: {
        Row: {
          access_tier: string
          created_at: string
          id: string
          ordem: number
          subject: string
          title: string
          video_url: string
        }
        Insert: {
          access_tier: string
          created_at?: string
          id?: string
          ordem?: number
          subject: string
          title: string
          video_url: string
        }
        Update: {
          access_tier?: string
          created_at?: string
          id?: string
          ordem?: number
          subject?: string
          title?: string
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      questoes_publicas: {
        Row: {
          alt_a: string | null
          alt_b: string | null
          alt_c: string | null
          alt_d: string | null
          alt_e: string | null
          area: string | null
          enunciado: string | null
          id: string | null
          numero: number | null
          peso: number | null
          simulado_id: string | null
        }
        Insert: {
          alt_a?: string | null
          alt_b?: string | null
          alt_c?: string | null
          alt_d?: string | null
          alt_e?: string | null
          area?: string | null
          enunciado?: string | null
          id?: string | null
          numero?: number | null
          peso?: number | null
          simulado_id?: string | null
        }
        Update: {
          alt_a?: string | null
          alt_b?: string | null
          alt_c?: string | null
          alt_d?: string | null
          alt_e?: string | null
          area?: string | null
          enunciado?: string | null
          id?: string | null
          numero?: number | null
          peso?: number | null
          simulado_id?: string | null
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
      questoes_simulado_publica: {
        Row: {
          alt_a: string | null
          alt_b: string | null
          alt_c: string | null
          alt_d: string | null
          alt_e: string | null
          area: string | null
          enunciado: string | null
          id: string | null
          numero: number | null
          peso: number | null
          simulado_id: string | null
        }
        Insert: {
          alt_a?: string | null
          alt_b?: string | null
          alt_c?: string | null
          alt_d?: string | null
          alt_e?: string | null
          area?: string | null
          enunciado?: string | null
          id?: string | null
          numero?: number | null
          peso?: number | null
          simulado_id?: string | null
        }
        Update: {
          alt_a?: string | null
          alt_b?: string | null
          alt_c?: string | null
          alt_d?: string | null
          alt_e?: string | null
          area?: string | null
          enunciado?: string | null
          id?: string | null
          numero?: number | null
          peso?: number | null
          simulado_id?: string | null
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
    }
    Functions: {
      cleanup_redacoes_antigas: { Args: never; Returns: undefined }
      corrigir_simulado: {
        Args: { _respostas: Json; _simulado_id: string }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      gerar_codigo_verificacao_email: { Args: never; Returns: Json }
      get_minhas_tentativas: {
        Args: { _user_id: string }
        Returns: {
          acertos: number
          finished_at: string
          id: string
          nota_total: number
          simulado_nome: string
          total: number
        }[]
      }
      get_ranking_global: {
        Args: never
        Returns: {
          avatar_url: string
          estado: string
          idade: number
          melhor_nota: number
          nome: string
          total_redacoes: number
          user_id: string
        }[]
      }
      get_top_semana: {
        Args: never
        Returns: {
          melhor_nota: number
          nome: string
          user_id: string
        }[]
      }
      is_assinatura_ativa: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      plano_ativo: { Args: { _user_id: string }; Returns: boolean }
      pode_corrigir_redacao: { Args: { _user_id: string }; Returns: Json }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      tier_rank: { Args: { _t: string }; Returns: number }
      user_plan_tier: { Args: { _user_id: string }; Returns: string }
      verificar_codigo_email: { Args: { _codigo: string }; Returns: Json }
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
