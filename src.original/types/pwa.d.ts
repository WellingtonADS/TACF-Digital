declare module "virtual:pwa-register/react" {
  export function useRegisterSW(): {
    needRefresh: boolean;
    offlineReady: boolean;
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}
