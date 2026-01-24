import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export default function ReloadPrompt() {
  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (offlineReady || needRefresh) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
    }
  }, [offlineReady, needRefresh]);

  if (!show) return null;

  const onReload = async () => {
    await updateServiceWorker(true);
    setShow(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white p-3 rounded shadow flex items-center gap-3">
        <div>
          {needRefresh
            ? "Nova versão disponível"
            : "Aplicação disponível offline"}
        </div>
        {needRefresh && (
          <Button variant="primary" onClick={onReload}>
            Atualizar
          </Button>
        )}
        <Button variant="outline" onClick={() => setShow(false)}>
          Fechar
        </Button>
      </div>
    </div>
  );
}
