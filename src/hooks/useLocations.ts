import { useCallback, useEffect, useState } from "react";
import supabase from "../services/supabase";
import type { Location } from "../types/database.types";

interface FetchParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface UseLocationsResult {
  locations: Location[];
  total: number;
  loading: boolean;
  error: string | null;
  fetch: (params?: FetchParams) => Promise<void>;
  create: (
    data: Omit<Location, "id" | "created_at" | "updated_at">,
  ) => Promise<Location | null>;
  update: (id: string, data: Partial<Location>) => Promise<Location | null>;
  remove: (id: string) => Promise<void>;
}

export default function useLocations(): UseLocationsResult {
  const [locations, setLocations] = useState<Location[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (params: FetchParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc("get_locations", {
        p_search_term: params.search || null,
        p_status: params.status || null,
        p_limit: params.limit || 20,
        p_offset: ((params.page || 1) - 1) * (params.limit || 20),
      });
      if (error) throw error;
      if (data) {
        // rpc returns array of records with total_count column on each row
        type RpcLocation = Location & { total_count: number };
        const arr = data as RpcLocation[];
        setTotal(arr.length > 0 ? arr[0].total_count : 0);
        setLocations(arr.map(({ total_count: _ignored, ...loc }) => loc));
      }
    } catch (err: unknown) {
      console.error("useLocations fetch error", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Erro ao carregar unidades");
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarrega quando houver alterações de locations em outras abas/componentes
  useEffect(() => {
    const onChange = () => {
      void fetch();
    };
    window.addEventListener("locations:changed", onChange as EventListener);
    return () =>
      window.removeEventListener(
        "locations:changed",
        onChange as EventListener,
      );
  }, [fetch]);

  const create = useCallback(
    async (data: Omit<Location, "id" | "created_at" | "updated_at">) => {
      setLoading(true);
      setError(null);
      try {
        const { data: result, error } = await supabase.rpc("create_location", {
          p_name: data.name,
          p_address: data.address,
          p_max_capacity: data.max_capacity,
          p_status: data.status,
          p_facilities: data.facilities,
          p_metadata: data.metadata,
        });
        if (error) throw error;
        const loc = result as Location;
        try {
          window.dispatchEvent(
            new CustomEvent("locations:changed", { detail: { id: loc?.id } }),
          );
        } catch (_: unknown) {
          /* CustomEvent dispatch may throw in test/restricted environments */
        }
        return loc;
      } catch (err: unknown) {
        console.error("useLocations create error", err);
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Erro ao criar unidade");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const update = useCallback(async (id: string, data: Partial<Location>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase.rpc("update_location", {
        p_id: id,
        p_name: data.name,
        p_address: data.address,
        p_max_capacity: data.max_capacity,
        p_status: data.status,
        p_facilities: data.facilities,
        p_metadata: data.metadata,
      });
      if (error) throw error;
      const loc = result as Location;
      try {
        window.dispatchEvent(
          new CustomEvent("locations:changed", { detail: { id: loc?.id } }),
        );
      } catch (_: unknown) {
        /* CustomEvent dispatch may throw in test/restricted environments */
      }
      return loc as Location;
    } catch (err: unknown) {
      console.error("useLocations update error", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Erro ao atualizar unidade");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.rpc("delete_location", { p_id: id });
      if (error) throw error;
      try {
        window.dispatchEvent(
          new CustomEvent("locations:changed", { detail: { id } }),
        );
      } catch (_: unknown) {
        /* CustomEvent dispatch may throw in test/restricted environments */
      }
    } catch (err: unknown) {
      console.error("useLocations delete error", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Erro ao remover unidade");
    } finally {
      setLoading(false);
    }
  }, []);

  return { locations, total, loading, error, fetch, create, update, remove };
}
