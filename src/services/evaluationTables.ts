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

function isRpcMissingError(err: unknown): boolean {
  const error = err as { code?: string; message?: string } | null;
  return (
    error?.code === "PGRST202" &&
    typeof error.message === "string" &&
    error.message.includes("Could not find the function")
  );
}

function isMissingCategoryColumnError(err: unknown): boolean {
  const error = err as { code?: string; message?: string } | null;
  return (
    error?.code === "42703" &&
    typeof error.message === "string" &&
    error.message.includes("evaluation_index_rows.category")
  );
}

export async function fetchEvaluationIndexRows(
  category: EvaluationIndexCategory,
): Promise<EvaluationIndexRow[]> {
  const buildBaseQuery = () =>
    supabase
      .from("evaluation_index_rows")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("faixa", { ascending: true });

  const { data: directData, error: directError } = await buildBaseQuery().eq(
    "category",
    category,
  );

  if (!directError) {
    return (directData ?? []) as EvaluationIndexRow[];
  }

  if (isMissingCategoryColumnError(directError)) {
    const {
      data: directDataWithoutCategory,
      error: directErrorWithoutCategory,
    } = await buildBaseQuery();

    if (directErrorWithoutCategory) {
      throw directErrorWithoutCategory;
    }

    return (directDataWithoutCategory ?? []).map((row) => ({
      ...(row as EvaluationIndexRow),
      category,
    }));
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_evaluation_index_rows",
    {
      p_category: category,
    },
  );

  if (rpcError) {
    if (isRpcMissingError(rpcError)) {
      throw directError;
    }

    throw rpcError;
  }

  return (rpcData ?? []) as EvaluationIndexRow[];
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
    if (!isRpcMissingError(error)) {
      throw error;
    }

    if (payload.id) {
      const { data: updated, error: updateError } = await supabase
        .from("evaluation_index_rows")
        .update({
          category: payload.category,
          faixa: payload.faixa,
          corrida: payload.corrida,
          flexao: payload.flexao,
          abdominal: payload.abdominal,
          conceito: payload.conceito,
          sort_order: payload.sort_order,
        })
        .eq("id", payload.id)
        .select("*")
        .single();

      if (isMissingCategoryColumnError(updateError)) {
        const {
          data: updatedWithoutCategory,
          error: updateWithoutCategoryErr,
        } = await supabase
          .from("evaluation_index_rows")
          .update({
            faixa: payload.faixa,
            corrida: payload.corrida,
            flexao: payload.flexao,
            abdominal: payload.abdominal,
            conceito: payload.conceito,
            sort_order: payload.sort_order,
          })
          .eq("id", payload.id)
          .select("*")
          .single();

        if (updateWithoutCategoryErr) {
          throw updateWithoutCategoryErr;
        }

        return {
          ...(updatedWithoutCategory as EvaluationIndexRow),
          category: payload.category,
        };
      }

      if (updateError) {
        throw updateError;
      }

      return updated as EvaluationIndexRow;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("evaluation_index_rows")
      .insert({
        category: payload.category,
        faixa: payload.faixa,
        corrida: payload.corrida,
        flexao: payload.flexao,
        abdominal: payload.abdominal,
        conceito: payload.conceito,
        sort_order: payload.sort_order,
      })
      .select("*")
      .single();

    if (isMissingCategoryColumnError(insertError)) {
      const { data: insertedWithoutCategory, error: insertWithoutCategoryErr } =
        await supabase
          .from("evaluation_index_rows")
          .insert({
            faixa: payload.faixa,
            corrida: payload.corrida,
            flexao: payload.flexao,
            abdominal: payload.abdominal,
            conceito: payload.conceito,
            sort_order: payload.sort_order,
          })
          .select("*")
          .single();

      if (insertWithoutCategoryErr) {
        throw insertWithoutCategoryErr;
      }

      return {
        ...(insertedWithoutCategory as EvaluationIndexRow),
        category: payload.category,
      };
    }

    if (insertError) {
      throw insertError;
    }

    return inserted as EvaluationIndexRow;
  }

  return data as EvaluationIndexRow;
}

export async function removeEvaluationIndexRow(id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_evaluation_index_row", {
    p_id: id,
  });

  if (error) {
    if (!isRpcMissingError(error)) {
      throw error;
    }

    const { error: deleteError } = await supabase
      .from("evaluation_index_rows")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }
  }
}
