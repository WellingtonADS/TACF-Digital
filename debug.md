PS D:\Users\well\Projetos\Desenvolvimento\tacf-digital> yarn dev --debug    
yarn run v1.22.22
$ vite --debug
  vite:config bundled config file loaded in 111.17ms +0ms
  vite:config using resolved config: {
  vite:config   plugins: [
  vite:config     'vite:optimized-deps',
  vite:config     'vite:watch-package-data',
  vite:config     'vite:pre-alias',
  vite:config     'alias',
  vite:config     'vite:react-babel',
  vite:config     'vite:react-refresh',
  vite:config     'vite:modulepreload-polyfill',
  vite:config     'vite:resolve',
  vite:config     'vite:html-inline-proxy',
  vite:config     'vite:css',
  vite:config     'vite:esbuild',
  vite:config     'vite:json',
  vite:config     'vite:wasm-helper',
  vite:config     'vite:worker',
  vite:config     'vite:asset',
  vite:config     'vite:wasm-fallback',
  vite:config     'vite:define',
  vite:config     'vite:css-post',
  vite:config     'vite:worker-import-meta-url',
  vite:config     'vite:asset-import-meta-url',
  vite:config     'vite:dynamic-import-vars',
  vite:config     'vite:import-glob',
  vite:config     'vite:client-inject',
  vite:config     'vite:css-analysis',
  vite:config     'vite:import-analysis'
  vite:config   ],
  vite:config   resolve: {
  vite:config     mainFields: [ 'browser', 'module', 'jsnext:main', 'jsnext' ],
  vite:config     conditions: [],
  vite:config     extensions: [
  vite:config       '.mjs',  '.js',
  vite:config       '.mts',  '.ts',
  vite:config       '.jsx',  '.tsx',
  vite:config       '.json'
  vite:config     ],
  vite:config     dedupe: [ 'react', 'react-dom' ],
  vite:config     preserveSymlinks: false,
  vite:config     alias: [
  vite:config       [Object], [Object],
  vite:config       [Object], [Object],
  vite:config       [Object], [Object],
  vite:config       [Object], [Object],
  vite:config       [Object], [Object],
  vite:config       [Object]
  vite:config     ]
  vite:config   },
  vite:config   optimizeDeps: {
  vite:config     holdUntilCrawlEnd: true,
  vite:config     force: undefined,
  vite:config     esbuildOptions: { preserveSymlinks: false, jsx: 'automatic' },
  vite:config     include: [
  vite:config       'react',
  vite:config       'react-dom',
  vite:config       'react/jsx-dev-runtime',
  vite:config       'react/jsx-runtime'
  vite:config     ]
  vite:config   },
  vite:config   server: {
  vite:config     preTransformRequests: true,
  vite:config     host: undefined,
  vite:config     sourcemapIgnoreList: [Function: isInNodeModules$1],
  vite:config     middlewareMode: false,
  vite:config     fs: {
  vite:config       strict: true,
  vite:config       allow: [Array],
  vite:config       deny: [Array],
  vite:config       cachedChecks: undefined
  vite:config     }
  vite:config   },
  vite:config   esbuild: { jsxDev: true, jsx: 'automatic', jsxImportSource: undefined },
  vite:config   build: {
  vite:config     target: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config     cssTarget: [ 'es2020', 'edge88', 'firefox78', 'chrome87', 'safari14' ],
  vite:config     outDir: 'dist',
  vite:config     assetsDir: 'assets',
  vite:config     assetsInlineLimit: 4096,
  vite:config     cssCodeSplit: true,
  vite:config     sourcemap: false,
  vite:config     rollupOptions: { onwarn: [Function: onwarn] },
  vite:config     minify: 'esbuild',
  vite:config     terserOptions: {},
  vite:config     write: true,
  vite:config     emptyOutDir: null,
  vite:config     copyPublicDir: true,
  vite:config     manifest: false,
  vite:config     lib: false,
  vite:config     ssr: false,
  vite:config     ssrManifest: false,
  vite:config     ssrEmitAssets: false,
  vite:config     reportCompressedSize: true,
  vite:config     chunkSizeWarningLimit: 500,
  vite:config     watch: null,
  vite:config     commonjsOptions: { include: [Array], extensions: [Array] },
  vite:config     dynamicImportVarsOptions: { warnOnError: true, exclude: [Array] },
  vite:config     modulePreload: { polyfill: true },
  vite:config     cssMinify: true
  vite:config   },
  vite:config   configFile: 'D:/Users/well/Projetos/Desenvolvimento/tacf-digital/vite.config.ts',     
  vite:config   configFileDependencies: [
  vite:config     'D:/Users/well/Projetos/Desenvolvimento/tacf-digital/vite.config.ts'
  vite:config   ],
  vite:config   inlineConfig: {
  vite:config     root: undefined,
  vite:config     base: undefined,
  vite:config     mode: undefined,
  vite:config     configFile: undefined,
  vite:config     logLevel: undefined,
  vite:config     clearScreen: undefined,
  vite:config     optimizeDeps: { force: undefined },
  vite:config     server: { host: undefined }
  vite:config   },
  vite:config   root: 'D:/Users/well/Projetos/Desenvolvimento/tacf-digital',
  vite:config   base: '/',
  vite:config   decodedBase: '/',
  vite:config   rawBase: '/',
  vite:config   publicDir: 'D:/Users/well/Projetos/Desenvolvimento/tacf-digital/public',
  vite:config   cacheDir: 'D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/.vite',   
  vite:config   command: 'serve',
  vite:config   mode: 'development',
  vite:config   ssr: {
  vite:config     target: 'node',
  vite:config     optimizeDeps: { noDiscovery: true, esbuildOptions: [Object] }
  vite:config   },
  vite:config   isWorker: false,
  vite:config   mainConfig: null,
  vite:config   bundleChain: [],
  vite:config   isProduction: false,
  vite:config   css: { lightningcss: undefined },
  vite:config   preview: {
  vite:config     port: undefined,
  vite:config     strictPort: undefined,
  vite:config     host: undefined,
  vite:config     allowedHosts: undefined,
  vite:config     https: undefined,
  vite:config     open: undefined,
  vite:config     proxy: undefined,
  vite:config     cors: undefined,
  vite:config     headers: undefined
  vite:config   },
  vite:config   envDir: 'D:/Users/well/Projetos/Desenvolvimento/tacf-digital',
  vite:config   env: {
  vite:config     VITE_SUPABASE_URL: 'https://bgtgffxvajngjhdlvrxo.supabase.co',
  vite:config     VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJndGdmZnh2YWpuZ2poZGx2cnhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE5OTEzMSwiZXhwIjoyMDg0Nzc1MTMxfQ.GHp0AU18SX0AN_5QfQ87cWnllKYHYnbPlB-_ZAewYxg',
  vite:config     VITE_APP_NAME: 'TACF HACO',
  vite:config     VITE_APP_VERSION: '0.0.1',
  vite:config     VITE_ENABLE_ADMIN: 'true',
  vite:config     VITE_GOOG_API_KEY: 'AQ.Ab8RN6J285ffjk4yUoP3-WMcH_5kTIkS6Vo45_uCQaVTLvY0VA',
  vite:config     VITE_GOOG_PROJECT_ID: '10775490936116846734',
  vite:config     BASE_URL: '/',
  vite:config     MODE: 'development',
  vite:config     DEV: true,
  vite:config     PROD: false
  vite:config   },
  vite:config   assetsInclude: [Function: assetsInclude],
  vite:config   logger: {
  vite:config     hasWarned: false,
  vite:config     info: [Function: info],
  vite:config     warn: [Function: warn],
  vite:config     warnOnce: [Function: warnOnce],
  vite:config     error: [Function: error],
  vite:config     clearScreen: [Function: clearScreen],
  vite:config     hasErrorLogged: [Function: hasErrorLogged]
  vite:config   },
  vite:config   packageCache: Map(1) {
  vite:config     'fnpd_D:/Users/well/Projetos/Desenvolvimento/tacf-digital' => {
  vite:config       dir: 'D:/Users/well/Projetos/Desenvolvimento/tacf-digital',
  vite:config       data: [Object],
  vite:config       hasSideEffects: [Function: hasSideEffects],
  vite:config       webResolvedImports: {},
  vite:config       nodeResolvedImports: {},
  vite:config       setResolvedCache: [Function: setResolvedCache],
  vite:config       getResolvedCache: [Function: getResolvedCache]
  vite:config     },
  vite:config     set: [Function (anonymous)]
  vite:config   },
  vite:config   createResolver: [Function: createResolver],
  vite:config   worker: { format: 'iife', plugins: '() => plugins', rollupOptions: {} },
  vite:config   appType: 'spa',
  vite:config   experimental: { importGlobRestoreExtension: false, hmrPartialAccept: false },
  vite:config   webSocketToken: 's2nWmNDVbOsm',
  vite:config   additionalAllowedHosts: [],
  vite:config   getSortedPlugins: [Function: getSortedPlugins],
  vite:config   getSortedPluginHooks: [Function: getSortedPluginHooks]
  vite:config } +26ms
  vite:deps removing old cache dir D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/.vite/deps +0ms
  vite:resolve 4.29ms react -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react/index.js +0ms
  vite:resolve 6.22ms react-dom -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-dom/index.js +7ms
  vite:resolve 1.50ms react/jsx-dev-runtime -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react/jsx-dev-runtime.js +5ms
  vite:resolve 5.27ms react/jsx-runtime -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react/jsx-runtime.js +6ms
  vite:deps scanning for dependencies... +0ms

  VITE v5.4.21  ready in 929 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
  vite:deps Crawling dependencies using entries: 
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/index.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_access_profiles_management/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_admin_dashboard/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_analytics_dashboard/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_appeal_request/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_appointment_confirmation/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_audit_log/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_class_creation_form/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_digital_ticket/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_om_&_location_management/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_operational_dashboard/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_personnel_management/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_rescheduling_management/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_rescheduling_notification/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_results_history/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_scheduling_screen/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_score_entry_screen/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_system_settings/code.html
  vite:deps   D:/Users/well/Projetos/Desenvolvimento/tacf-digital/stitch_screens/stitch_tacf_digital_screen/tacf-digital_user_profiles_management/code.html +0ms
  vite:resolve 0.61ms /src/main.tsx -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/main.tsx +2s
  vite:resolve 2.79ms react -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react/index.js +7ms
  vite:resolve 1.71ms react-dom/client -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-dom/client.js +4ms
  vite:resolve 1.80ms ./App.tsx -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/App.tsx +4ms
  vite:resolve 0.84ms react/jsx-runtime -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react/jsx-runtime.js +1ms
  vite:resolve 4.15ms react-router-dom -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-router-dom/dist/index.js +11ms
  vite:resolve 2.95ms sonner -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/sonner/dist/index.mjs +7ms
  vite:resolve 1.75ms ./contexts/AuthContext -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/contexts/AuthContext.tsx +16ms
  vite:resolve 1.12ms ./pages/Login -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/pages/Login.tsx +17ms
  vite:resolve 0.98ms ./pages/UserDashboard -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/pages/UserDashboard.tsx +12ms
  vite:resolve 0.93ms ./pages/UserProfile -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/pages/UserProfile.tsx +3ms
  vite:resolve 0.92ms ./components/Admin/AdminRoute -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Admin/AdminRoute.tsx +3ms
  vite:resolve 1.02ms ./components/Layout/Shell -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Layout/Shell.tsx +8ms
  vite:resolve 0.74ms ./components/ErrorBoundary -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ErrorBoundary.tsx +2ms
  vite:resolve 1.34ms ./pages/AdminDashboard -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/pages/AdminDashboard.tsx +3ms
  vite:resolve 1.44ms ./pages/AdminSessions -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/pages/AdminSessions.tsx +3ms
  vite:resolve 1.28ms ./pages/AdminSwapRequests -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/pages/AdminSwapRequests.tsx +3ms
  vite:resolve 0.80ms ./pages/AdminUsers -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/pages/AdminUsers.tsx +5ms
  vite:resolve 2.09ms ./pages/AdminPersonnelManagement -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/pages/AdminPersonnelManagement.tsx +4ms
  vite:resolve 1.64ms ./pages/AdminAnalyticsDashboard -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/pages/AdminAnalyticsDashboard.tsx +7ms
  vite:resolve 0.90ms ./pages/AdminAuditLog -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/pages/AdminAuditLog.tsx +7ms
  vite:resolve 0.97ms ./pages/SystemSettings -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/pages/SystemSettings.tsx +2ms
  vite:resolve 1.81ms ./pages/AccessProfilesManagement -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/pages/AccessProfilesManagement.tsx +3ms
  vite:resolve 1.02ms ./pages/ScoreEntryScreen -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/pages/ScoreEntryScreen.tsx +11ms
  vite:resolve 1.24ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/services/supabase -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/supabase.ts +25ms
  vite:resolve 8.34ms @/services/supabase -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/supabase.ts +6ms
  vite:resolve 1.72ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/ui/icons -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/icons.tsx +3ms
  vite:resolve 5.32ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/ui/Button -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Button.tsx +4ms
  vite:resolve 6.32ms @/components/ui/icons -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/icons.tsx +1ms
  vite:resolve 6.56ms @/components/ui/Button -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Button.tsx +0ms
  vite:resolve 0.85ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/ui/PageHeader -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/PageHeader.tsx +2ms
  vite:resolve 1.73ms @/components/ui/PageHeader -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/PageHeader.tsx +1ms
  vite:resolve 0.88ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/ui/Typography -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Typography.tsx +32ms        
  vite:resolve 11.64ms @/components/ui/Typography -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Typography.tsx +11ms
  vite:resolve 1.05ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/ui -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/index.ts +3ms
  vite:resolve 2.45ms @/components/ui -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/index.ts +1ms
  vite:resolve 5.39ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/Admin/AdminRoute -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Admin/AdminRoute.tsx +10ms  
  vite:resolve 8.48ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/ui/Card -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Card.tsx +3ms
  vite:resolve 10.00ms @/components/Admin/AdminRoute -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Admin/AdminRoute.tsx +1ms
  vite:resolve 11.87ms @/components/ui/Card -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Card.tsx +2ms
  vite:resolve 5.76ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/contexts/AuthContext -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/contexts/AuthContext.tsx +19ms
  vite:resolve 6.38ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/hooks/useSessions -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/hooks/useSessions.ts +1ms
  vite:resolve 13.05ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/Admin/SessionEditModal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Admin/SessionEditModal.tsx +6ms
  vite:resolve 18.99ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/Booking/BookingConfirmationModal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Booking/BookingConfirmationModal.tsx +6ms
  vite:resolve 22.11ms @/contexts/AuthContext -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/contexts/AuthContext.tsx +2ms
  vite:resolve 22.48ms @/hooks/useSessions -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/hooks/useSessions.ts +0ms
  vite:resolve 22.96ms @/components/Admin/SessionEditModal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Admin/SessionEditModal.tsx +1ms
  vite:resolve 23.45ms @/components/Booking/BookingConfirmationModal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Booking/BookingConfirmationModal.tsx +1ms
  vite:resolve 5.84ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/Admin/UserEditModal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Admin/UserEditModal.tsx +7ms
  vite:resolve 7.40ms @/components/Admin/UserEditModal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Admin/UserEditModal.tsx +2ms
  vite:resolve 8.54ms @mui/icons-material -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/index.js +12ms
  vite:resolve 13.37ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/ui/Input -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Input.tsx +5ms
  vite:resolve 15.18ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/services/api -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/api.ts +2ms
  vite:resolve 15.98ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/Calendar/CalendarGrid -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Calendar/CalendarGrid.tsx +1ms
  vite:resolve 16.40ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/Booking/ComprovanteTicket -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Booking/ComprovanteTicket.tsx +0ms
  vite:resolve 18.61ms @/components/ui/Input -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Input.tsx +0ms
  vite:resolve 18.52ms @/services/api -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/api.ts +1ms
  vite:resolve 18.24ms @/components/Calendar/CalendarGrid -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Calendar/CalendarGrid.tsx +0ms
  vite:resolve 18.19ms @/components/Booking/ComprovanteTicket -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Booking/ComprovanteTicket.tsx +0ms
  vite:resolve 0.83ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/ui/StatCard -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/StatCard.tsx +4ms
  vite:resolve 1.28ms @/components/ui/StatCard -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/StatCard.tsx +0ms
  vite:resolve 4.47ms ../ui/Sidebar -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Sidebar.tsx +6ms
  vite:resolve 4.29ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/services/admin -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/admin.ts +1ms
  vite:resolve 4.81ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/utils/seasonal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/utils/seasonal.ts +1ms
  vite:resolve 7.19ms @/services/admin -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/admin.ts +0ms
  vite:resolve 6.95ms @/utils/seasonal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/utils/seasonal.ts +0ms
  vite:resolve 1.62ms ../ui/SidebarItem -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/SidebarItem.tsx +10ms
  vite:resolve 2.75ms @supabase/supabase-js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@supabase/supabase-js/dist/index.mjs +6ms
  vite:resolve 1.44ms @mui/icons-material/CalendarToday -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/CalendarToday.js +3ms
  vite:resolve 10.85ms date-fns -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/date-fns/index.mjs +13ms
  vite:resolve 11.47ms ./Content -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Layout/Content.tsx +1ms
  vite:resolve 1.11ms @mui/icons-material/Dashboard -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Dashboard.js +2ms
  vite:resolve 2.69ms date-fns/locale -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/date-fns/locale.mjs +5ms
  vite:resolve 3.02ms ./TopNav -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Layout/TopNav.tsx +0ms
  vite:resolve 3.68ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/utils/toast -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/utils/toast.ts +1ms
  vite:resolve 4.82ms @/utils/toast -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/utils/toast.ts +0ms
  vite:resolve 2.50ms @mui/icons-material/People -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/People.js +4ms
  vite:resolve 1.23ms @mui/icons-material/SwapHoriz -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/SwapHoriz.js +8ms
  vite:resolve 1.01ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/utils/cn -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/utils/cn.ts +8ms
  vite:resolve 4.77ms @/utils/cn -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/utils/cn.ts +3ms
  vite:resolve 1.43ms @mui/icons-material/AccessTime -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/AccessTime.js +4ms
  vite:resolve 2.60ms ./admin/accessProfiles -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/admin/accessProfiles.ts +7ms
  vite:resolve 4.25ms @mui/icons-material/Add -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Add.js +2ms
  vite:resolve 6.42ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/services/bookings -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/bookings.ts +3ms
  vite:resolve 9.07ms @/services/bookings -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/bookings.ts +2ms
  vite:resolve 2.61ms ./admin/audit -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/admin/audit.ts +9ms
  vite:resolve 3.37ms @mui/icons-material/ArrowForward -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/ArrowForward.js +1ms
  vite:resolve 4.84ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/ui/Modal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Modal.tsx +2ms
  vite:resolve 5.82ms @/components/ui/Modal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Modal.tsx +1ms
  vite:resolve 1.14ms ./CalendarBody -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Calendar/CalendarBody.tsx +6ms
  vite:resolve 1.09ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/components/ui/Select -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Select.tsx +7ms
  vite:resolve 3.65ms @/components/ui/Select -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Select.tsx +2ms
  vite:resolve 1.29ms ./admin/sessions -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/admin/sessions.ts +6ms
  vite:resolve 5.64ms @mui/icons-material/CalendarMonth -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/CalendarMonth.js +6ms
  vite:resolve 5.87ms clsx -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/clsx/dist/clsx.mjs +1ms
  vite:resolve 6.09ms ./CalendarHeader -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Calendar/CalendarHeader.tsx +0ms
  vite:resolve 5.74ms ./Badge -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Badge.tsx +8ms
  vite:resolve 7.58ms ./admin/settings -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/admin/settings.ts +2ms
  vite:resolve 7.92ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/hooks/useUserForm -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/hooks/useUserForm.ts +0ms
  vite:resolve 8.99ms @/hooks/useUserForm -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/hooks/useUserForm.ts +1ms
  vite:resolve 4.65ms @mui/icons-material/Check -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Check.js +5ms
  vite:resolve 5.29ms tailwind-merge -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/tailwind-merge/dist/bundle-mjs.mjs +1ms
  vite:resolve 7.71ms ./supabase -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/supabase.ts +9ms
  vite:resolve 8.07ms ./Button -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Button.tsx +1ms
  vite:resolve 8.35ms ./admin/users -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/admin/users.ts +0ms
  vite:resolve 8.57ms @headlessui/react -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@headlessui/react/dist/headlessui.esm.js +0ms
  vite:resolve 1.25ms @mui/icons-material/CheckCircle -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/CheckCircle.js +4ms
  vite:resolve 6.67ms ./Card -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Card.tsx +9ms
  vite:resolve 7.57ms ./bookings -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/bookings.ts +1ms
  vite:resolve 0.92ms @mui/icons-material/ChevronLeft -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/ChevronLeft.js +18ms
  vite:resolve 2.62ms @mui/icons-material/ChevronRight -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/ChevronRight.js +71ms
  vite:resolve 4.84ms ../ui/Button -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Button.tsx +17ms
  vite:resolve 49.78ms ./Icon -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Icon.tsx +45ms
  vite:resolve 51.83ms ../supabase -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/services/supabase.ts +3ms
  vite:resolve 0.93ms @mui/icons-material/Close -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Close.js +3ms
  vite:resolve 1.92ms ../ui/ConfirmModal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/ConfirmModal.tsx +4ms
  vite:resolve 2.24ms ./Input -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Input.tsx +0ms
  vite:resolve 1.32ms @mui/icons-material/DeleteOutline -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/DeleteOutline.js +2ms
  vite:resolve 2.44ms ./UserForm -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Admin/UserForm.tsx +9ms
  vite:resolve 3.12ms ./Modal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Modal.tsx +1ms
  vite:resolve 0.99ms @mui/icons-material/Download -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Download.js +2ms
  vite:resolve 0.96ms @mui/icons-material/Edit -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Edit.js +48ms
  vite:resolve 2.04ms ./Typography -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/ui/Typography.tsx +4ms
  vite:resolve 2.47ms @mui/icons-material/ErrorOutline -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/ErrorOutline.js +6ms
  vite:resolve 3.63ms ./CalendarDay -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Calendar/CalendarDay.tsx +8ms
  vite:resolve 0.99ms @mui/icons-material/EventAvailable -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/EventAvailable.js +3ms
  vite:resolve 2.56ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/hooks/useBookingConfirmation -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/hooks/useBookingConfirmation.ts +4ms  
  vite:resolve 5.60ms @/hooks/useBookingConfirmation -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/hooks/useBookingConfirmation.ts +3ms
  vite:resolve 0.82ms @mui/icons-material/ExpandMore -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/ExpandMore.js +2ms
  vite:resolve 0.74ms @mui/icons-material/Flight -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Flight.js +2ms
  vite:resolve 1.28ms @mui/icons-material/Group -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Group.js +23ms
  vite:resolve 5.09ms react-qr-code -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-qr-code/lib/index.js +14ms
  vite:resolve 5.38ms ./PeriodSelector -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Booking/PeriodSelector.tsx +0ms
  vite:resolve 6.30ms @mui/icons-material/History -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/History.js +1ms
  vite:resolve 5.60ms react-dom -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-dom/index.js +18ms
  vite:resolve 6.39ms @radix-ui/react-select -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-select/dist/index.mjs +0ms
  vite:resolve 9.68ms @mui/icons-material/InfoOutlined -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/InfoOutlined.js +4ms
  vite:resolve 11.45ms ./TafSelector -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Booking/TafSelector.tsx +2ms
  vite:resolve 0.79ms ./SwapRequestModal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/components/Booking/SwapRequestModal.tsx +4ms
  vite:resolve 1.36ms @mui/icons-material/LocationOn -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/LocationOn.js +3ms
  vite:resolve 0.82ms D:\Users\well\Projetos\Desenvolvimento\tacf-digital\src/utils/receipt/generateReceipt -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/utils/receipt/generateReceipt.ts +5ms
  vite:resolve 1.43ms @/utils/receipt/generateReceipt -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/src/utils/receipt/generateReceipt.ts +0ms
  vite:resolve 2.19ms @mui/icons-material/Logout -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Logout.js +5ms
  vite:resolve 0.73ms @mui/icons-material/MailOutline -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/MailOutline.js +5ms
  vite:resolve 1.79ms @mui/icons-material/ManageAccounts -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/ManageAccounts.js +8ms
  vite:resolve 1.79ms @mui/icons-material/Menu -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Menu.js +11ms
  vite:resolve 2.12ms qrcode -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/qrcode/lib/browser.js +4ms
  vite:resolve 1.15ms @mui/icons-material/NightsStay -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/NightsStay.js +6ms
  vite:resolve 2.18ms jspdf -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/jspdf/dist/jspdf.es.min.js +4ms
  vite:resolve 1.83ms @mui/icons-material/Person -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Person.js +2ms
  vite:resolve 2.43ms jspdf-autotable -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.mjs +5ms
  vite:resolve 2.64ms @mui/icons-material/Refresh -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Refresh.js +1ms
  vite:resolve 1.01ms @mui/icons-material/Security -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Security.js +5ms
  vite:resolve 0.71ms @mui/icons-material/Tag -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Tag.js +5ms
  vite:resolve 1.49ms @mui/icons-material/WarningAmber -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/WarningAmber.js +3ms
  vite:resolve 0.78ms @mui/icons-material/WbSunny -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/WbSunny.js +3ms
  vite:resolve 2.23ms @mui/material/CircularProgress -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/material/esm/CircularProgress/index.js +5ms
  vite:deps Scan completed in 2720.68ms: 
  vite:deps   @headlessui/react -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@headlessui/react/dist/headlessui.esm.js
  vite:deps   @mui/icons-material -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/index.js
  vite:deps   @mui/icons-material/AccessTime -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/AccessTime.js
  vite:deps   @mui/icons-material/Add -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Add.js
  vite:deps   @mui/icons-material/ArrowForward -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/ArrowForward.js
  vite:deps   @mui/icons-material/CalendarMonth -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/CalendarMonth.js
  vite:deps   @mui/icons-material/CalendarToday -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/CalendarToday.js
  vite:deps   @mui/icons-material/Check -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Check.js
  vite:deps   @mui/icons-material/CheckCircle -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/CheckCircle.js
  vite:deps   @mui/icons-material/ChevronLeft -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/ChevronLeft.js
  vite:deps   @mui/icons-material/ChevronRight -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/ChevronRight.js
  vite:deps   @mui/icons-material/Close -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Close.js
  vite:deps   @mui/icons-material/Dashboard -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Dashboard.js
  vite:deps   @mui/icons-material/DeleteOutline -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/DeleteOutline.js
  vite:deps   @mui/icons-material/Download -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Download.js
  vite:deps   @mui/icons-material/Edit -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Edit.js
  vite:deps   @mui/icons-material/ErrorOutline -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/ErrorOutline.js
  vite:deps   @mui/icons-material/EventAvailable -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/EventAvailable.js
  vite:deps   @mui/icons-material/ExpandMore -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/ExpandMore.js
  vite:deps   @mui/icons-material/Flight -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Flight.js
  vite:deps   @mui/icons-material/Group -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Group.js
  vite:deps   @mui/icons-material/History -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/History.js
  vite:deps   @mui/icons-material/InfoOutlined -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/InfoOutlined.js
  vite:deps   @mui/icons-material/LocationOn -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/LocationOn.js
  vite:deps   @mui/icons-material/Logout -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Logout.js
  vite:deps   @mui/icons-material/MailOutline -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/MailOutline.js
  vite:deps   @mui/icons-material/ManageAccounts -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/ManageAccounts.js
  vite:deps   @mui/icons-material/Menu -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Menu.js
  vite:deps   @mui/icons-material/NightsStay -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/NightsStay.js
  vite:deps   @mui/icons-material/People -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/People.js
  vite:deps   @mui/icons-material/Person -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Person.js
  vite:deps   @mui/icons-material/Refresh -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Refresh.js
  vite:deps   @mui/icons-material/Security -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Security.js
  vite:deps   @mui/icons-material/SwapHoriz -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/SwapHoriz.js
  vite:deps   @mui/icons-material/Tag -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/Tag.js
  vite:deps   @mui/icons-material/WarningAmber -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/WarningAmber.js
  vite:deps   @mui/icons-material/WbSunny -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/icons-material/esm/WbSunny.js
  vite:deps   @mui/material/CircularProgress -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/material/esm/CircularProgress/index.js
  vite:deps   @radix-ui/react-select -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-select/dist/index.mjs
  vite:deps   @supabase/supabase-js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@supabase/supabase-js/dist/index.mjs
  vite:deps   clsx -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/clsx/dist/clsx.mjs
  vite:deps   date-fns -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/date-fns/index.mjs
  vite:deps   date-fns/locale -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/date-fns/locale.mjs
  vite:deps   jspdf -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/jspdf/dist/jspdf.es.min.js
  vite:deps   jspdf-autotable -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.mjs
  vite:deps   qrcode -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/qrcode/lib/browser.js
  vite:deps   react -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react/index.js
  vite:deps   react-dom -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-dom/index.js
  vite:deps   react-dom/client -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-dom/client.js
  vite:deps   react-qr-code -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-qr-code/lib/index.js
  vite:deps   react-router-dom -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-router-dom/dist/index.js
  vite:deps   react/jsx-runtime -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react/jsx-runtime.js
  vite:deps   sonner -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/sonner/dist/index.mjs
  vite:deps   tailwind-merge -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/tailwind-merge/dist/bundle-mjs.mjs +1s
  vite:deps creating package.json in D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/.vite/deps_temp_b7ea1ed4 +3s
  vite:resolve 2.57ms @supabase/functions-js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@supabase/functions-js/dist/module/index.js +514ms
  vite:resolve 1.94ms @supabase/postgrest-js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@supabase/postgrest-js/dist/index.mjs +10ms
  vite:resolve 5.61ms react -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react/index.js +25ms
  vite:resolve 1.23ms react-dom -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-dom/index.js +8ms
  vite:resolve 6.08ms @supabase/realtime-js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@supabase/realtime-js/dist/module/index.js +17ms
  vite:resolve 7.01ms react-dom -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-dom/index.js +3ms
  vite:resolve 8.03ms prop-types -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/prop-types/index.js +1ms
  vite:resolve 7.55ms @radix-ui/number -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/number/dist/index.mjs +41ms
  vite:resolve 8.89ms @supabase/storage-js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@supabase/storage-js/dist/index.mjs +1ms
  vite:resolve 11.37ms qr.js/lib/ErrorCorrectLevel -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/qr.js/lib/ErrorCorrectLevel.js +3ms
  vite:resolve 2.46ms react-router -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-router/dist/index.js +14ms
  vite:resolve 5.84ms @radix-ui/primitive -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/primitive/dist/index.mjs +29ms
  vite:resolve 27.47ms @supabase/auth-js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@supabase/auth-js/dist/module/index.js +22ms
  vite:resolve 27.82ms qr.js/lib/QRCode -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/qr.js/lib/QRCode.js +0ms
  vite:resolve 1.32ms react -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react/index.js +14ms
  vite:resolve 2.95ms @remix-run/router -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@remix-run/router/dist/router.js +9ms
  vite:resolve 28.57ms @radix-ui/react-collection -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-collection/dist/index.mjs +26ms
  vite:resolve 1.90ms @radix-ui/react-compose-refs -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-compose-refs/dist/index.mjs +4ms
  vite:resolve 2.81ms @radix-ui/react-context -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-context/dist/index.mjs +56ms
  vite:resolve 2.28ms @radix-ui/react-direction -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-direction/dist/index.mjs +6ms
  vite:resolve 2.17ms iceberg-js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/iceberg-js/dist/index.mjs +58ms
  vite:resolve 1.63ms @radix-ui/react-dismissable-layer -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs +22ms
  vite:resolve 3.43ms @radix-ui/react-focus-guards -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-focus-guards/dist/index.mjs +42ms
  vite:resolve 3.45ms @babel/runtime/helpers/typeof -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@babel/runtime/helpers/esm/typeof.js +15ms
  vite:resolve 2.00ms @radix-ui/react-focus-scope -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-focus-scope/dist/index.mjs +12ms
  vite:resolve 2.24ms fflate -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/fflate/esm/browser.js +8ms
  vite:resolve 1.70ms @radix-ui/react-id -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-id/dist/index.mjs +7ms
  vite:resolve 0.80ms @babel/runtime/helpers/slicedToArray -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@babel/runtime/helpers/esm/slicedToArray.js +2ms
  vite:resolve 1.63ms @radix-ui/react-popper -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-popper/dist/index.mjs +3ms
  vite:resolve 1.96ms fast-png -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/fast-png/lib-esm/index.js +8ms
  vite:resolve 2.51ms @radix-ui/react-portal -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-portal/dist/index.mjs +15ms
  vite:resolve 7.48ms html2canvas -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/html2canvas/dist/html2canvas.esm.js +32ms
  vite:resolve 4.01ms @radix-ui/react-primitive -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-primitive/dist/index.mjs +5ms
  vite:resolve 2.31ms dompurify -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/dompurify/dist/purify.es.mjs +8ms
  vite:resolve 2.26ms @radix-ui/react-slot -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-select/node_modules/@radix-ui/react-slot/dist/index.mjs +3ms
  vite:resolve 1.95ms canvg -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/canvg/lib/index.es.js +3ms
  vite:resolve 1.56ms @radix-ui/react-use-callback-ref -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs +6ms
  vite:resolve 1.61ms @radix-ui/react-use-controllable-state -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs +42ms
  vite:resolve 1.69ms @radix-ui/react-use-layout-effect -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs +25ms
  vite:resolve 0.90ms react/jsx-runtime -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react/jsx-runtime.js +16ms
  vite:resolve 2.94ms @react-aria/focus -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@react-aria/focus/dist/import.mjs +38ms
  vite:resolve 9.01ms @radix-ui/react-use-previous -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-use-previous/dist/index.mjs +43ms
  vite:resolve 1.72ms @react-aria/interactions -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@react-aria/interactions/dist/import.mjs +11ms
  vite:resolve 12.23ms @mui/material/utils -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/material/esm/utils/index.js +56ms
  vite:resolve 37.15ms @radix-ui/react-visually-hidden -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-visually-hidden/dist/index.mjs +26ms
  vite:resolve 38.03ms use-sync-external-store/with-selector -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/use-sync-external-store/with-selector.js +1ms
  vite:resolve 2.77ms @mui/utils/ClassNameGenerator -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/ClassNameGenerator/index.js +17ms
  vite:resolve 11.38ms @mui/utils/generateUtilityClasses -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/generateUtilityClasses/index.js +9ms
  vite:resolve 5.28ms @tanstack/react-virtual -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@tanstack/react-virtual/dist/esm/index.js +6ms
  vite:resolve 6.05ms aria-hidden -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/aria-hidden/dist/es2015/index.js +1ms
  vite:resolve 1.23ms @mui/utils/generateUtilityClass -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/generateUtilityClass/index.js +2ms
  vite:resolve 1.99ms @react-aria/utils -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@react-aria/utils/dist/import.mjs +12ms
  vite:resolve 1.49ms clsx -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/clsx/dist/clsx.mjs +4ms
  vite:resolve 0.80ms @mui/utils/capitalize -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/capitalize/index.js +7ms
  vite:resolve 1.81ms @mui/utils/createChainedFunction -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/createChainedFunction/index.js +2ms
  vite:resolve 1.22ms @mui/utils/debounce -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/debounce/index.js +3ms
  vite:resolve 1.50ms @mui/utils/deprecatedPropType -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/deprecatedPropType/index.js +0ms
  vite:resolve 0.97ms @mui/utils/isMuiElement -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/isMuiElement/index.js +5ms
  vite:resolve 2.23ms react-remove-scroll -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-remove-scroll/dist/es2015/index.js +7ms
  vite:resolve 1.68ms prop-types -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/prop-types/index.js +5ms
  vite:resolve 5.95ms @mui/system -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/system/esm/index.js +10ms
  vite:resolve 6.25ms @mui/utils/ownerDocument -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/ownerDocument/index.js +0ms
  vite:resolve 3.53ms @mui/utils/ownerWindow -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/ownerWindow/index.js +5ms
  vite:resolve 4.16ms @mui/utils/unsupportedProp -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/unsupportedProp/index.js +0ms
  vite:resolve 4.60ms @mui/utils/requirePropFactory -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/requirePropFactory/index.js +1ms
  vite:resolve 4.89ms @mui/utils/useControlled -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/useControlled/index.js +0ms
  vite:resolve 5.64ms @mui/utils/setRef -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/setRef/index.js +1ms
  vite:resolve 6.38ms @mui/utils/useEnhancedEffect -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/useEnhancedEffect/index.js +9ms
  vite:resolve 7.87ms @mui/utils/useEventCallback -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/useEventCallback/index.js +2ms
  vite:resolve 8.67ms @mui/utils/useId -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/useId/index.js +1ms
  vite:resolve 8.93ms @mui/utils/useForkRef -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/useForkRef/index.js +0ms
  vite:resolve 2.81ms scheduler -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/scheduler/index.js +6ms
  vite:resolve 2.04ms @mui/utils/formatMuiErrorMessage -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/formatMuiErrorMessage/index.js +31ms
  vite:resolve 2.43ms @mui/styled-engine -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/styled-engine/esm/index.js +15ms
  vite:resolve 3.09ms @mui/utils/chainPropTypes -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/chainPropTypes/index.js +17ms
  vite:resolve 6.17ms react-is -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-is/index.js +30ms
  vite:resolve 13.21ms @mui/utils/composeClasses -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/composeClasses/index.js +18ms
  vite:resolve 21.81ms @floating-ui/react-dom -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@floating-ui/react-dom/dist/floating-ui.react-dom.mjs +9ms
  vite:resolve 7.03ms @radix-ui/react-arrow -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-arrow/dist/index.mjs +87ms
  vite:resolve 9.97ms @radix-ui/react-slot -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-primitive/node_modules/@radix-ui/react-slot/dist/index.mjs +3ms
  vite:resolve 7.22ms @radix-ui/react-use-effect-event -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-use-effect-event/dist/index.mjs +8ms
  vite:resolve 10.94ms tslib -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/tslib/tslib.es6.mjs +4ms
  vite:resolve 13.09ms @floating-ui/react -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@floating-ui/react/dist/floating-ui.react.mjs +2ms
  vite:resolve 1.57ms @radix-ui/react-slot -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-collection/node_modules/@radix-ui/react-slot/dist/index.mjs +27ms
  vite:resolve 2.20ms @react-stately/utils -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@react-stately/utils/dist/import.mjs +45ms
  vite:resolve 1.37ms @mui/utils/clamp -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/clamp/index.js +3ms
  vite:resolve 1.74ms @mui/utils/deepmerge -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/deepmerge/index.js +4ms
  vite:resolve 2.34ms core-js/modules/es.promise.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/es.promise.js +18ms
  vite:resolve 2.68ms @emotion/styled -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@emotion/styled/dist/emotion-styled.browser.development.esm.js +5ms
  vite:resolve 2.58ms @babel/runtime/helpers/asyncToGenerator -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js +29ms
  vite:resolve 5.01ms @emotion/serialize -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@emotion/serialize/dist/emotion-serialize.development.esm.js +19ms
  vite:resolve 23.60ms @radix-ui/react-use-escape-keydown -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-use-escape-keydown/dist/index.mjs +19ms
  vite:resolve 1.18ms @mui/system/styleFunctionSx -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/system/esm/styleFunctionSx/index.js +44ms
  vite:resolve 1.15ms core-js/modules/es.string.match.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/es.string.match.js +78ms
  vite:resolve 4.67ms @emotion/react -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@emotion/react/dist/emotion-react.browser.development.esm.js +7ms
  vite:resolve 2.16ms @react-stately/flags -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@react-stately/flags/dist/import.mjs +64ms
  vite:resolve 4.75ms core-js/modules/es.string.replace.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/es.string.replace.js +30ms
  vite:resolve 5.90ms @mui/private-theming -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/private-theming/esm/index.js +1ms
  vite:resolve 8.45ms @react-aria/ssr -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@react-aria/ssr/dist/import.mjs +9ms
  vite:resolve 4.02ms core-js/modules/es.string.starts-with.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/es.string.starts-with.js +7ms
  vite:resolve 7.15ms @radix-ui/react-use-size -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@radix-ui/react-use-size/dist/index.mjs +3ms
  vite:resolve 3.28ms @mui/system/DefaultPropsProvider -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/system/esm/DefaultPropsProvider/index.js +16ms
  vite:resolve 1.92ms @mui/utils/resolveProps -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/resolveProps/index.js +31ms
  vite:resolve 6.17ms react-is -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/node_modules/react-is/index.js +10ms
  vite:resolve 18.92ms @tanstack/virtual-core -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@tanstack/virtual-core/dist/esm/index.js +13ms
  vite:resolve 11.88ms core-js/modules/es.array.iterator.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/es.array.iterator.js +15ms
  vite:resolve 25.76ms object-assign -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/object-assign/index.js +14ms
  vite:resolve 25.52ms @mui/utils/exactProp -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/exactProp/index.js +1ms
  vite:resolve 32.87ms @mui/utils/getDisplayName -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/utils/esm/getDisplayName/index.js +7ms
  vite:resolve 34.28ms @swc/helpers/_/_class_private_field_get -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@swc/helpers/esm/_class_private_field_get.js +2ms
  vite:resolve 3.60ms use-sidecar -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/use-sidecar/dist/es2015/index.js +5ms
  vite:resolve 2.56ms @emotion/hash -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@emotion/hash/dist/emotion-hash.esm.js +23ms
  vite:resolve 1.52ms core-js/modules/web.dom-collections.iterator.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/web.dom-collections.iterator.js +61ms
  vite:resolve 4.91ms @emotion/utils -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@emotion/utils/dist/emotion-utils.browser.esm.js +15ms
  vite:resolve 11.82ms @swc/helpers/_/_class_private_field_init -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@swc/helpers/esm/_class_private_field_init.js +7ms
  vite:resolve 2.84ms @emotion/unitless -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@emotion/unitless/dist/emotion-unitless.esm.js +8ms
  vite:resolve 1.61ms @babel/runtime/helpers/extends -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@babel/runtime/helpers/esm/extends.js +5ms
  vite:resolve 3.56ms @emotion/use-insertion-effect-with-fallbacks -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@emotion/use-insertion-effect-with-fallbacks/dist/emotion-use-insertion-effect-with-fallbacks.browser.esm.js +13ms
  vite:resolve 23.35ms @babel/runtime/helpers/defineProperty -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@babel/runtime/helpers/esm/defineProperty.js +20ms
  vite:resolve 6.05ms @mui/system/createStyled -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/system/esm/createStyled/index.js +7ms
  vite:resolve 7.43ms @swc/helpers/_/_class_private_field_set -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@swc/helpers/esm/_class_private_field_set.js +2ms
  vite:resolve 10.92ms iobuffer -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/iobuffer/lib-esm/IOBuffer.js +3ms
  vite:resolve 6.47ms react-remove-scroll-bar/constants -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-remove-scroll-bar/dist/es2015/constants.js +12ms
  vite:resolve 9.11ms @emotion/memoize -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@emotion/memoize/dist/emotion-memoize.esm.js +2ms
  vite:resolve 6.13ms @floating-ui/dom -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs +7ms
  vite:resolve 0.78ms core-js/modules/es.array.reduce.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/es.array.reduce.js +13ms
  vite:resolve 2.10ms @emotion/cache -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@emotion/cache/dist/emotion-cache.browser.development.esm.js +10ms
  vite:resolve 1.54ms pako -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/pako/dist/pako.esm.mjs +5ms
  vite:resolve 6.74ms use-callback-ref -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/use-callback-ref/dist/es2015/index.js +22ms
  vite:resolve 7.03ms core-js/modules/es.string.ends-with.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/es.string.ends-with.js +1ms
  vite:resolve 3.87ms @emotion/sheet -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@emotion/sheet/dist/emotion-sheet.development.esm.js +8ms
  vite:resolve 6.14ms dijkstrajs -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/dijkstrajs/dijkstra.js +2ms
  vite:resolve 0.72ms @floating-ui/react/utils -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@floating-ui/react/dist/floating-ui.react.utils.mjs +218ms
  vite:resolve 1.79ms @floating-ui/utils -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs +95ms
  vite:resolve 1.83ms core-js/modules/es.string.split.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/es.string.split.js +8ms
  vite:resolve 2.16ms @floating-ui/utils/dom -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs +5ms
  vite:resolve 1.57ms detect-node-es -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/detect-node-es/esm/browser.js +7ms
  vite:resolve 5.07ms @floating-ui/core -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@floating-ui/core/dist/floating-ui.core.mjs +20ms
  vite:resolve 16.07ms raf -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/raf/index.js +11ms
  vite:resolve 16.69ms @emotion/weak-memoize -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@emotion/weak-memoize/dist/emotion-weak-memoize.esm.js +1ms
  vite:resolve 4.31ms react-remove-scroll-bar -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-remove-scroll-bar/dist/es2015/index.js +7ms
  vite:resolve 5.22ms @mui/system/colorManipulator -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/system/esm/colorManipulator/index.js +1ms
  vite:resolve 5.49ms tabbable -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/tabbable/dist/index.esm.js +1ms
  vite:resolve 3.32ms core-js/modules/es.string.trim.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/es.string.trim.js +8ms
  vite:resolve 4.39ms stylis -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/stylis/index.js +2ms
  vite:resolve 5.45ms hoist-non-react-statics -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/hoist-non-react-statics/dist/hoist-non-react-statics.cjs.js +8ms
  vite:resolve 9.75ms @mui/system/createTheme -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/system/esm/createTheme/index.js +4ms
  vite:resolve 11.06ms react-style-singleton -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/react-style-singleton/dist/es2015/index.js +2ms
  vite:resolve 5.57ms @emotion/is-prop-valid -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@emotion/is-prop-valid/dist/emotion-is-prop-valid.esm.js +7ms
  vite:resolve 5.84ms rgbcolor -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/rgbcolor/index.js +0ms
  vite:resolve 6.09ms @mui/system/spacing -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/system/esm/spacing/index.js +0ms
  vite:resolve 1.59ms get-nonce -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/get-nonce/dist/es2015/index.js +12ms
  vite:resolve 6.91ms core-js/modules/es.array.index-of.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/es.array.index-of.js +14ms
  vite:resolve 10.44ms @babel/runtime/helpers/esm/extends -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@babel/runtime/helpers/esm/extends.js +4ms
  vite:resolve 15.35ms @mui/system/cssVars -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/@mui/system/esm/cssVars/index.js +4ms
  vite:resolve 1.54ms core-js/modules/es.string.includes.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/es.string.includes.js +12ms
  vite:resolve 1.31ms core-js/modules/es.array.reverse.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/es.array.reverse.js +4ms
  vite:resolve 2.15ms svg-pathdata -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/svg-pathdata/lib/SVGPathData.module.js +14ms
  vite:resolve 0.70ms core-js/modules/es.regexp.to-string.js -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/core-js/modules/es.regexp.to-string.js +4ms
  vite:resolve 2.16ms stackblur-canvas -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/stackblur-canvas/dist/stackblur-es.js +9ms
  vite:resolve 1.85ms performance-now -> D:/Users/well/Projetos/Desenvolvimento/tacf-digital/node_modules/performance-now/lib/performance-now.js +8ms
  vite:deps Dependencies bundled in 81266.20ms +1m
