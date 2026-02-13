# TACF-Digital

Sistema de gerenciamento de agendamentos e listas de chamada para o Teste de Avaliação de Condicionamento Físico (TACF) do Hospital da Aeronáutica de Canoas (HACO).

## 🎯 Sobre o Projeto

O TACF Digital é uma aplicação web moderna desenvolvida para automatizar e otimizar o processo de agendamento de testes de condicionamento físico, incluindo:

- Agendamento de sessões de teste
- Gestão de capacidade e quórum
- Geração automática de listas de chamada em PDF
- Sistema de permuta entre usuários
- Emissão de comprovantes e tickets
- Painel administrativo completo

## 🛠 Stack Tecnológico

### Frontend

- **React 18** - Biblioteca UI
- **TypeScript** (strict mode) - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utility-first
- **jsPDF + autotable** - Geração de PDFs

### Backend & Infraestrutura

- **Supabase** - Backend as a Service
  - PostgreSQL - Banco de dados relacional
  - Row Level Security (RLS) - Segurança em nível de linha
  - Realtime - Atualizações em tempo real
  - Auth - Autenticação e autorização

### Testes

- **Vitest** - Testes unitários
- **Playwright** - Testes E2E

### Ferramentas de Desenvolvimento

- **ESLint** - Linter
- **TypeScript Compiler** - Checagem de tipos
- **Yarn** - Gerenciador de pacotes

## 📁 Estrutura do Projeto

```
tacf-digital/
├── src/
│   ├── components/        # Componentes React organizados por domínio
│   │   ├── Admin/        # Componentes administrativos
│   │   ├── Booking/      # Sistema de reservas
│   │   ├── Calendar/     # Componentes de calendário
│   │   ├── Layout/       # Layout e navegação
│   │   └── ui/           # Componentes UI reutilizáveis
│   ├── contexts/         # Contextos React (AuthContext)
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Páginas da aplicação
│   ├── services/         # Serviços e integrações (Supabase)
│   ├── types/            # Definições de tipos TypeScript
│   └── utils/            # Utilitários e helpers
│       └── pdf/          # Geração de PDFs
├── supabase/
│   ├── migrations/       # Migrações do banco de dados
│   ├── policies/         # Políticas RLS
│   ├── rpc/              # Stored procedures
│   └── schema.sql        # Schema completo
├── e2e/                  # Testes end-to-end
└── docs/                 # Documentação do projeto

```

## 🚀 Como Começar

### Pré-requisitos

- Node.js 18+
- Yarn
- Conta no Supabase (para desenvolvimento)

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/WellingtonADS/TACF-Digital.git
cd tacf-digital

# Instalar dependências
yarn

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase
```

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
yarn dev

# O app estará disponível em http://localhost:5173
```

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
yarn dev              # Inicia servidor de desenvolvimento

# Build
yarn build           # Build de produção
yarn preview         # Preview do build de produção

# Qualidade de Código
yarn lint            # Executa ESLint
yarn type-check      # Verificação de tipos TypeScript (npx tsc --noEmit)

# Testes
yarn test            # Testes unitários com Vitest
yarn test:e2e        # Testes E2E com Playwright
yarn test:ui         # UI do Vitest

# Banco de Dados
yarn db:apply        # Aplica migrações do Supabase
```

## 🧪 Testes

### Testes Unitários (Vitest)

```bash
# Executar todos os testes
yarn test

# Modo watch
yarn test --watch

# Com coverage
yarn test --coverage
```

### Testes E2E (Playwright)

```bash
# Executar testes E2E
yarn test:e2e

# Modo UI para debug
yarn test:e2e --ui

# Executar em navegador específico
yarn test:e2e --project=chromium
```

## 📝 Convenções e Padrões

### TypeScript

- Modo `strict` ativado
- Evite `any` - use tipos explícitos
- Prefira interfaces para objetos públicos
- Use generics quando apropriado

### React

- Componentes funcionais com hooks
- JSX runtime (não importar `React` explicitamente)
- Estado preferencialmente local
- Props tipadas com TypeScript

### Estilo de Código

- Componentes organizados por domínio
- Um componente por arquivo
- Nomes de arquivos em PascalCase para componentes
- camelCase para utilities e services

### Regras de Negócio

- **Importante:** Validações de domínio (capacidade, quórum, ordem) devem residir no backend (RPCs)
- Não implemente lógica crítica de negócio no frontend
- Use os RPCs existentes em `supabase/rpc/`

## 🔒 Segurança

- Nunca commite credenciais ou chaves de API
- Use variáveis de ambiente (`.env`)
- Não altere políticas RLS sem aprovação
- Dados sensíveis protegidos por Row Level Security

## 🗄 Banco de Dados

### Migrações

Novas migrações devem ser criadas em `supabase/migrations/` seguindo o padrão:

```
YYYYMMDD_descricao_da_migracao.sql
```

### RPCs Importantes

- `book_session.sql` - Reserva de sessão
- `confirmar_agendamento.sql` - Confirmação de agendamento
- `approve_swap.sql` - Aprovação de permuta
- `get_sessions_availability.sql` - Disponibilidade de sessões

## 📚 Documentação Adicional

- [AGENTS.md](./AGENTS.md) - Diretrizes para agentes AI
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Processo de deploy
- [docs/SUPABASE_SECURITY.md](./docs/SUPABASE_SECURITY.md) - Segurança do Supabase
- [docs/PLANEJAMENTO.md](./docs/PLANEJAMENTO.md) - Planejamento do projeto

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Antes de Submeter PR

```bash
# Execute os checks obrigatórios
yarn lint
npx tsc --noEmit
yarn test
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

## 👥 Contato

Projeto desenvolvido para o Hospital da Aeronáutica de Canoas (HACO).

---

**Última atualização:** 13 de fevereiro de 2026
