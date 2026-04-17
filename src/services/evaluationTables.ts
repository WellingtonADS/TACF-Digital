import supabase from "@/services/supabase";

export type EvaluationIndexCategory = "masculino" | "feminino";

export type EvaluationIndexRow = {
  id: string;
  category: EvaluationIndexCategory;
  faixa: string;
  corrida: string;
  flexao: string;
  abdominal: string;
  conceito: string;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export type EvaluationIndexRowInput = Omit<
  EvaluationIndexRow,
  "id" | "created_at" | "updated_at"
>;

export async function fetchEvaluationIndexRows(
  category: EvaluationIndexCategory,
): Promise<EvaluationIndexRow[]> {
  const { data, error } = await supabase.rpc("get_evaluation_index_rows", {
    p_category: category,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as EvaluationIndexRow[];
}

export async function saveEvaluationIndexRow(
  payload: Partial<EvaluationIndexRow> & {
    category: EvaluationIndexCategory;
    faixa: string;
    corrida: string;
    flexao: string;
    abdominal: string;
    conceito: string;
    sort_order: number;
  },
): Promise<EvaluationIndexRow> {
  const { data, error } = await supabase.rpc("upsert_evaluation_index_row", {
    p_id: payload.id ?? null,
    p_category: payload.category,
    p_faixa: payload.faixa,
    p_corrida: payload.corrida,
    p_flexao: payload.flexao,
    p_abdominal: payload.abdominal,
    p_conceito: payload.conceito,
    p_sort_order: payload.sort_order,
  });

  if (error) {
    throw error;
  }

  return data as EvaluationIndexRow;
}

export async function removeEvaluationIndexRow(id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_evaluation_index_row", {
    p_id: id,
  });

  if (error) {
    throw error;
  }
}
