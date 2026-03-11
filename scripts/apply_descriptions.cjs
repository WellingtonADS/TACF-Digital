const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

const mapping = {
  "src/pages/AccessProfilesManagement.tsx":
    "Gestão de perfis de acesso e suas permissões.",
  "src/pages/AdminDashboard.tsx":
    "Painel administrativo com métricas e atalhos.",
  "src/pages/AnalyticsDashboard.tsx":
    "Visualização analítica de indicadores e relatórios.",
  "src/pages/AppealRequest.tsx":
    "Formulário para solicitações de recurso/apelação.",
  "src/pages/AppointmentConfirmation.tsx":
    "Confirmação e detalhes de agendamento.",
  "src/pages/AuditLog.tsx": "Exibição do registro de auditoria do sistema.",
  "src/pages/ClassCreationForm.tsx":
    "Formulário para criação de turmas/sessões.",
  "src/pages/DigitalTicket.tsx":
    "Geração e visualização de bilhete digital (QR/PDF).",
  "src/pages/Documents.tsx": "Gerenciamento e listagem de documentos.",
  "src/pages/ForgotPassword.tsx": "Fluxo de recuperação de senha.",
  "src/pages/Login.tsx": "Tela de autenticação de usuários.",
  "src/pages/OmLocationEditor.tsx":
    "Edição de locais/Organizações Militares (OM).",
  "src/pages/OmLocationManager.tsx":
    "Gerenciamento de locais/Organizações Militares.",
  "src/pages/OmScheduleEditor.tsx": "Edição de cronogramas e horários das OM.",
  "src/pages/OperationalDashboard.tsx":
    "Painel operacional com estado e ações rápidas.",
  "src/pages/PersonnelEditor.tsx": "Edição de informações de pessoal.",
  "src/pages/PersonnelManagement.tsx": "Listagem e gestão de pessoal.",
  "src/pages/Register.tsx": "Tela de registro de novos usuários.",
  "src/pages/ReschedulingManagement.tsx": "Gestão de pedidos de reagendamento.",
  "src/pages/ReschedulingNotification.tsx":
    "Notificações e detalhes de reagendamentos.",
  "src/pages/ResultsHistory.tsx": "Histórico de resultados e avaliações.",
  "src/pages/Scheduling.tsx": "Interface de agendamento de sessões.",
  "src/pages/ScoreEntry.tsx": "Registro de notas e avaliações.",
  "src/pages/SessionBookingsManagement.tsx": "Gestão de reservas por sessão.",
  "src/pages/SessionEditor.tsx": "Edição de detalhes de sessão.",
  "src/pages/SessionsManagement.tsx": "Administração geral das sessões.",
  "src/pages/SystemSettings.tsx":
    "Configurações globais e parâmetros do sistema.",
  "src/pages/UserProfilesManagement.tsx":
    "Gestão de perfis de usuário e papéis/roles.",

  "src/containers/BookingContainer.tsx":
    "Container para fluxos de reserva e agendamento.",
  "src/containers/DashboardContainer.tsx":
    "Container que compõe dashboards com dados.",
  "src/containers/ProfileContainer.tsx":
    "Container para visualização e edição do perfil do usuário.",

  "src/main.tsx":
    "Ponto de entrada da aplicação e configuração de providers/rotas.",

  "src/components/AdminRoute.tsx":
    "Guard de rota para acessos administrativos.",
  "src/components/AuthLayout.tsx": "Layout usado nas telas de autenticação.",
  "src/components/AutoRedirect.tsx":
    "Redirecionamento automático baseado em estado ou papel.",
  "src/components/Breadcrumbs.tsx": "Componente de breadcrumbs para navegação.",
  "src/components/ForbiddenState.tsx":
    "Tela/estado exibido quando acesso é proibido.",
  "src/components/FullPageLoading.tsx":
    "Componente de carregamento em tela cheia.",
  "src/components/PageSkeleton.tsx":
    "Esqueleto de página visível durante carregamento.",
  "src/components/ProtectedRoute.tsx":
    "Guard de rota para usuários autenticados.",
  "src/components/RescheduleDrawer.tsx":
    "Drawer para solicitar ou visualizar trocas de sessão.",
  "src/components/TicketModal.tsx": "Modal para visualizar ou baixar bilhetes.",
  "src/components/TicketsListModal.tsx":
    "Modal com lista de tickets vinculados ao usuário.",
  "src/components/UserRoute.tsx": "Guard de rota para usuários comuns.",

  "src/components/layout/Layout.tsx":
    "Layout principal com sidebar, topbar e conteúdo.",
  "src/components/layout/Topbar.tsx":
    "Barra superior com navegação e ações rápidas.",
  "src/components/layout/Sidebar.tsx": "Menu lateral de navegação.",
  "src/components/layout/Footer.tsx": "Rodapé com informações e links úteis.",

  "src/components/atomic/AppIcon.tsx": "Wrapper de ícones do design system.",
  "src/components/atomic/Button.tsx":
    "Componente de botão atômico com variantes.",
  "src/components/atomic/Card.tsx":
    "Cartão reutilizável com elevação e estados.",
  "src/components/atomic/Icon.tsx": "Componente SVG genérico para ícones.",
  "src/components/atomic/Input.tsx":
    "Campo de entrada reutilizável com tipagem.",
  "src/components/atomic/NotificationCard.tsx":
    "Card para exibir notificações e alertas.",
  "src/components/atomic/PasswordInput.tsx":
    "Campo de senha com toggle de visibilidade.",
  "src/components/atomic/QuickActionCard.tsx":
    "Cartão de ação rápida com ícone e texto.",
  "src/components/atomic/SidebarItem.tsx": "Item reutilizável do menu lateral.",
  "src/components/atomic/StatCard.tsx":
    "Cartão para exibir métricas e estatísticas.",
};

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(walk(full));
    else if (e.isFile() && full.endsWith(".tsx")) files.push(full);
  }
  return files;
}

function setDescription(block, descr) {
  const lines = block.split(/\r?\n/);
  let replaced = false;
  const out = lines.map((ln) => {
    if (/\*\s*@description/.test(ln)) {
      replaced = true;
      return ` * @description ${descr}`;
    }
    return ln;
  });
  if (!replaced) {
    // insert after opening /**
    const idx = out.findIndex((ln) => /\/\*/.test(ln));
    out.splice(idx + 1, 0, ` * @description ${descr}`);
  }
  return out.join("\n");
}

function processFile(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  const descr = mapping[rel];
  if (!descr) return false; // skip if not in mapping
  const content = fs.readFileSync(file, "utf8");
  const m = content.match(/^([\s\t]*\/\*[\s\S]*?\*\/\s*)/);
  if (!m) {
    // create header
    const header = `/**\n * @description ${descr}\n * @path ${rel}\n */\n\n`;
    fs.writeFileSync(file, header + content, "utf8");
    return true;
  }
  const block = m[1];
  const newBlock = setDescription(block, descr);
  if (newBlock === block) return false;
  const newContent = newBlock + content.slice(block.length);
  fs.writeFileSync(file, newContent, "utf8");
  return true;
}

function run() {
  const files = walk(SRC);
  console.log(`Found ${files.length} .tsx files under src/`);
  let changed = 0;
  for (const f of files) {
    try {
      const ok = processFile(f);
      if (ok) {
        changed++;
        console.log(`Updated: ${path.relative(ROOT, f)}`);
      }
    } catch (err) {
      console.error(`Error processing ${f}:`, err.message);
    }
  }
  console.log(`Done. Files changed: ${changed}`);
}

run();
