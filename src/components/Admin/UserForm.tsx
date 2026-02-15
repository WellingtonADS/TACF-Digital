import type { Profile } from "@/types/database.types";

type Props = {
  formData: Partial<Profile>;
  setFormData: (
    fn: Partial<Profile> | ((prev: Partial<Profile>) => Partial<Profile>),
  ) => void;
  loading?: boolean;
  deleting?: boolean;
  onSubmit: () => Promise<void>;
  onDelete?: () => Promise<void>;
  isNew?: boolean;
};

export default function UserForm({
  formData,
  setFormData,
  loading,
  deleting,
  onSubmit,
  onDelete,
  isNew,
}: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium">Nome completo</label>
        <input
          value={formData.full_name ?? ""}
          onChange={(e) =>
            setFormData({ ...formData, full_name: e.target.value })
          }
          className="mt-1 block w-full rounded border px-2 py-1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Posto/Graduação</label>
        <input
          value={formData.rank ?? ""}
          onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
          className="mt-1 block w-full rounded border px-2 py-1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Semestre</label>
        <input
          type="number"
          min={1}
          value={formData.semester ?? "1"}
          onChange={(e) =>
            setFormData({
              ...formData,
              semester: e.target.value || undefined,
            })
          }
          className="mt-1 block w-24 rounded border px-2 py-1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          value={formData.email ?? ""}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full rounded border px-2 py-1"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
          >
            {isNew ? "Criar" : "Salvar"}
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={() => {
                void onDelete?.();
              }}
              disabled={deleting}
              className="rounded bg-red-600 px-3 py-1 text-white disabled:opacity-50"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
