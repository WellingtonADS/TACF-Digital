# Documentação do Projeto: TACF Digital - HACO

## 1. Folha de Requisitos (Business Requirements Document)

Baseado no documento oficial do Hospital da Aeronáutica de Canoas (HACO).

| ID     | Requisito           | Descrição Técnica                                                                                                               | Criticidade |
| ------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| REQ-01 | Turnos e Capacidade | O sistema não usa horários fixos, apenas turnos (Manhã/Tarde). Capacidade dinâmica entre 8 e 21 pessoas por turno.              | Alta        |
| REQ-02 | Sazonalidade        | O sistema opera em campanhas (Fev-Mai e Set-Nov). Fora desses períodos, deve estar fechado ou em modo leitura.                  | Média       |
| REQ-03 | Segurança de Dados  | Um militar não pode ver quem mais está agendado no mesmo dia (Privacidade/LGPD). Apenas o Admin vê a lista nominal.             | Crítica     |
| REQ-04 | Fluxo de Troca      | O militar não pode alterar a data sozinho após confirmada. Deve solicitar troca para aprovação do Coordenador (Auditabilidade). | Alta        |
| REQ-05 | Gestão de Sessão    | O Coordenador deve inserir nomes dos Aplicadores (Sgt X, Ten Y) no dia para constar na impressão.                               | Média       |
| REQ-06 | Acesso PWA          | O sistema deve ser instalável via QR Code e funcionar em dispositivos móveis (Android/iOS).                                     | Alta        |

---

## 2. Arquitetura da Solução

### Diagrama de Fluxo (Mermaid)

```mermaid
graph TD
    User((Militar)) -->|Acessa PWA| Front[React + Vite + Tailwind]
    Admin((Coordenador)) -->|Acessa Admin| Front

    subgraph "Frontend (Vercel)"
        Front -->|Instalação| PWA[Service Worker]
        Front -->|Gera PDF| PDFLib[jsPDF]
    end

    subgraph "Backend (Supabase)"
        Front -->|Auth| Auth[Supabase Auth]
        Front -->|Data| DB[(PostgreSQL)]
        Front -->|Logic| RPC[Database Functions]
    end

    subgraph "Segurança"
        DB -->|Protege| RLS[Row Level Security]
        RPC -->|Garante| Transaction[Anti-Race Condition]
    end
```

### Stack Tecnológica Definida

- **Frontend**: React 19, TypeScript 5.9, Vite, TailwindCSS v4, Lucide Icons
- **Backend**: Supabase (BaaS)
- **Banco de Dados**: PostgreSQL 15+
- **Hospedagem**: Vercel (Front) + Supabase Cloud (Back)
- **CI/CD**: GitHub Actions
- **Bibliotecas Especiais**:
  - `jspdf` + `jspdf-autotable` - Geração de PDF
  - `vite-plugin-pwa` - Suporte a Progressive Web App

---

## 3. Modelagem de Banco de Dados (ER Diagram)

Estrutura relacional para atender os requisitos de auditoria e limites.

```mermaid
erDiagram
    profiles ||--o{ bookings : "faz"
    profiles {
        uuid id PK
        string saram UK "Nº Ordem"
        string full_name
        string rank "Posto/Grad"
        enum role "admin/user"
        enum semester "1/2"
        timestamp created_at
    }

    sessions ||--o{ bookings : "contém"
    sessions {
        uuid id PK
        date date
        enum period "morning/afternoon"
        int max_capacity "8-21"
        string[] applicators
        enum status "open/closed"
        uuid coordinator_id FK
        timestamp created_at
    }

    bookings ||--o{ swap_requests : "gera"
    bookings {
        uuid id PK
        uuid user_id FK
        uuid session_id FK
        enum status "confirmed/pending_swap/cancelled"
        string swap_reason
        timestamp created_at
        timestamp updated_at
    }

    swap_requests {
        uuid id PK
        uuid booking_id FK
        uuid requested_by FK
        string reason
        string admin_response
        uuid processed_by FK
        enum status "pending/approved/rejected"
        timestamp created_at
        timestamp processed_at
    }
```

### Constraints Críticos

1. **UNIQUE(user_id, semester)** em `bookings` - Um militar só pode ter 1 agendamento ativo por semestre
2. **CHECK(max_capacity BETWEEN 8 AND 21)** em `sessions` - Limite de capacidade validado no banco
3. **RLS Policies**:
   - `profiles`: Usuários veem apenas o próprio perfil; Admins veem todos
   - `sessions`: Qualquer um vê datas/períodos (sem nomes); Admins veem detalhes completos
   - `bookings`: Usuários veem apenas os próprios; Admins veem todos

---

## 4. Planejamento de Sprints (Backlog)

Para organizar o desenvolvimento e o ensino posterior, dividiremos em 3 fases:

### Fase 1: Fundação (Setup & DB)

**Sprint 1-2 (2 semanas)**

- [ ] Configuração do Repositório Git
  - Estrutura de pastas (src/, docs/, public/)
  - ESLint + Prettier configurado
  - GitHub Actions básico (lint + build)
- [ ] Setup do Supabase
  - Criar projeto no Supabase Cloud
  - Configurar variáveis de ambiente (.env.local)
- [ ] Criação das Tabelas
  - Script SQL para `profiles`, `sessions`, `bookings`, `swap_requests`
  - Migração versionada (migrations/)
- [ ] Implementação do RLS (Segurança)
  - Policies para cada tabela
  - Testes de acesso (Admin vs User)

**Entregável**: Banco de dados funcional com RLS + CI/CD básico

---

### Fase 2: Core (O Agendamento)

**Sprint 3-5 (3 semanas)**

- [ ] Autenticação
  - Login com SARAM (número de ordem)
  - Proteção de rotas (PrivateRoute component)
  - Logout e refresh de sessão
- [ ] Visualização do Calendário
  - Componente `Calendar.tsx` (React hooks)
  - Lógica de cores: Verde (disponível) / Vermelho (lotado)
  - Integração com Supabase (fetch sessions + bookings)
- [ ] Lógica de Agendamento
  - Validação de capacidade (8-21)
  - Checagem de duplicidade (1 booking/semestre)
  - Confirmação visual (modal + QR Code do SARAM)
  - Tratamento de race conditions (usar Supabase RPC)

**Entregável**: Usuário consegue agendar e visualizar calendário funcional

---

### Fase 3: Admin & Refino

**Sprint 6-8 (3 semanas)**

- [ ] Painel do Coordenador
  - Componente `AdminSessionManager.tsx`
  - Edição de capacidade (slider 8-21)
  - Adição de Aplicadores (input de array)
  - Visualização da Lista Nominal (respeitando privacidade)
- [ ] Fluxo de Aprovação de Trocas
  - Tela de solicitação (user)
  - Tela de aprovação (admin)
  - Notificações de status
- [ ] Impressão de PDF
  - Função `generateCallList.ts`
  - Formato: Data, Turno, Aplicadores, Lista (SARAM + Nome)
  - Download automático
- [ ] PWA (Progressive Web App)
  - Configuração do `vite-plugin-pwa`
  - Manifest.json (ícones, nome, cores)
  - Service Worker para cache
  - QR Code para instalação
- [ ] Testes e Deploy
  - Testes E2E com Playwright (opcional)
  - Deploy no Vercel
  - Configuração de domínio (se aplicável)

**Entregável**: Sistema completo em produção, instalável via PWA

---

## 5. Fluxogramas de Processos Críticos

### Processo: Agendamento de Militar

```mermaid
flowchart TD
    A[Militar acessa calendário] --> B{Tem agendamento ativo?}
    B -->|Sim| C[Mostra agendamento atual]
    B -->|Não| D[Seleciona data]
    D --> E{Turno tem vaga?}
    E -->|Não| F[Exibe mensagem: Lotado]
    E -->|Sim| G[Confirma agendamento]
    G --> H{Sucesso?}
    H -->|Sim| I[Gera comprovante QR Code]
    H -->|Não| J[Erro: Outra pessoa ocupou]
    C --> K[Opção: Solicitar troca]
```

### Processo: Aprovação de Troca (Coordenador)

```mermaid
flowchart TD
    A[Coordenador acessa painel] --> B[Lista de solicitações pendentes]
    B --> C{Há solicitações?}
    C -->|Não| D[Dashboard vazio]
    C -->|Sim| E[Visualiza detalhes]
    E --> F{Aprovar ou Rejeitar?}
    F -->|Aprovar| G[Cancela booking antigo]
    G --> H[Cria novo booking]
    H --> I[Notifica militar]
    F -->|Rejeitar| J[Adiciona motivo]
    J --> I
```

---

## 6. Matriz de Riscos

| Risco                         | Probabilidade | Impacto | Mitigação                                   |
| ----------------------------- | ------------- | ------- | ------------------------------------------- |
| Race condition em agendamento | Média         | Alto    | Usar transações SQL via Supabase RPC        |
| Militar vê lista de outros    | Baixa         | Crítico | RLS rigoroso + Code review obrigatório      |
| Supabase fora do ar           | Baixa         | Alto    | Monitoramento + Fallback em cache local     |
| PWA não instala em iOS        | Média         | Médio   | Testes em Safari + Documentação alternativa |
| Capacidade de 21 excedida     | Média         | Médio   | CHECK constraint no DB + validação no front |

---

## 7. Checklist de Definição de Pronto (DoD)

Para considerar uma funcionalidade concluída:

- [ ] Código TypeScript com tipos explícitos
- [ ] Testes manuais em Chrome e Safari (mobile)
- [ ] RLS validado (user não vê dados de outros)
- [ ] ESLint sem erros
- [ ] Build (`yarn build`) sem falhas
- [ ] Documentação atualizada (se necessário)
- [ ] Deploy em preview (Vercel)

---

## 8. Referências e Links Úteis

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [React 19 Release Notes](https://react.dev/blog/2024/04/25/react-19)

---

**Última atualização**: 14 de janeiro de 2026  
**Responsável**: Equipe TACF Digital  
**Stakeholder**: Hospital da Aeronáutica de Canoas (HACO)
