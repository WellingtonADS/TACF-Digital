import type { Database } from "@/types/database.types";
import supabase from "./supabase";

export type EvaluationIndexRow =
  Database["public"]["Tables"]["evaluation_index_rows"]["Row"];

export type SaveEvaluationIndexRowInput = Pick<
  EvaluationIndexRow,
  "id" | "faixa" | "corrida" | "flexao" | "abdominal" | "conceito"
> &
  Partial<Pick<EvaluationIndexRow, "sort_order">>;

export async function fetchEvaluationIndexRows(): Promise<EvaluationIndexRow[]> {
  const { data, error } = await supabase.rpc("get_evaluation_index_rows");
  if (error) throw error;

  return (data ?? []) as EvaluationIndexRow[];
}

export async function saveEvaluationIndexRow(
  row: SaveEvaluationIndexRowInput,
): Promise<EvaluationIndexRow> {
  const { data, error } = await supabase.rpc("save_evaluation_index_row", {
    p_id: row.id,
    p_faixa: row.faixa,
    p_corrida: row.corrida,
    p_flexao: row.flexao,
    p_abdominal: row.abdominal,
    p_conceito: row.conceito,
    p_sort_order: row.sort_order ?? null,
  });

  if (error) throw error;

  return data as EvaluationIndexRow;
}
