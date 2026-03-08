# TACF-Digital — Instruções de Uso do Software

## 1. Objetivo

Este guia descreve o uso operacional do TACF-Digital, cobrindo acesso, perfis, fluxos principais,
operações administrativas e orientações de segurança. Destina-se a militares e administradores.

## 2. Visão Geral Rápida (Resumo)

- **Acesso:** login com e-mail e senha; recuperação por e-mail.
- **Perfis:** `Militar` e `Administrador` com permissões distintas.
- **Fluxos principais:** agendamento, confirmação, geração de ticket digital, reagendamento e auditoria.

---

## 3. Acesso ao Sistema

### 3.1 Pré-requisitos

- Conta cadastrada e validação de e-mail;
- Credenciais (e-mail e senha) em ambiente seguro;
- Navegador moderno (Chrome, Edge, Firefox) atualizado.

### 3.2 Login

1. Acesse a página de login.
2. Insira e-mail e senha.
3. Caso habilitado, use autenticação multifator (MFA).
4. Clique em Entrar.

### 3.3 Recuperação de conta

1. Clique em "Esqueci a senha".
2. Siga as instruções enviadas ao e-mail cadastrado.
3. Se houver problema com o e-mail, contate o suporte responsável.

---

## 4. Perfis e Permissões

- **Militar:** acesso aos módulos de agendamento, ticket digital, histórico e documentos pessoais.
- **Administrador:** gerenciamento de turmas, locais, horários, relatórios, auditoria e configurações do sistema.

As permissões específicas são controladas centralmente pelo backend/Supabase (RLS e RPCs). Não altere regras de negócio no frontend.

---

## 5. Fluxo do Usuário Militar

### 5.1 Dashboard operacional

Ao entrar, o usuário vê indicadores de sessão, vagas disponíveis e alertas. Use os atalhos para iniciar agendamentos.

### 5.2 Agendamento passo a passo

1. Acesse o módulo `Agendamentos`.
2. Escolha `Local`, `Data` e `Horário` disponíveis.
3. Preencha dados solicitados (informações funcionais mínimas).
4. Revise e confirme a solicitação.
5. Receba confirmação por tela e e-mail; gere o `Ticket Digital`.

Observações:

- O frontend apenas envia a solicitação — regras de validação (quórum, capacidade, conflitos) são aplicadas no banco via RPCs.
- Em caso de erro, consulte a mensagem retornada e abra um chamado se necessário.

### 5.3 Ticket Digital

O ticket contém:

- identificador único e status;
- QR Code para verificação;
- instruções e contatos de suporte.

### 5.4 Histórico e Resultados

Consulte avaliações anteriores, notas e relatórios no módulo `Resultados`.

---

## 6. Fluxos do Administrador

### 6.1 Dashboard administrativo

Painel de controle com métricas de ocupação, próximos eventos e alertas de conflitos.

### 6.2 Gestão de turmas e sessões

1. Criar/editar turmas: definir data, horário, capacidade e requisitos.
2. Publicar vagas: torne disponibilidade visível aos militares.
3. Cancelar ou reagendar sessões: registre justificativa para auditoria.

### 6.3 Validação e regras de negócio

Todas as regras críticas (quórum, capacidade máxima, políticas de reagendamento) devem ser implementadas e mantidas no Supabase (migrations/RPCs). Evite duplicar validações no cliente.

### 6.4 Auditoria

Use o módulo de auditoria para consultar logs de ações, alterações em turmas e decisões de reagendamento. Mantenha justificativas claras em cada operação.

---

## 7. Procedimentos Operacionais (Checklists)

### 7.1 Checklist rápido — Criar turma

- Definir `OM` responsável;
- Informar `Data/Horário` e `Capacidade`;
- Definir `Requisitos` (ex.: exame médico);
- Confirmar publicação e comunicação ao efetivo.

### 7.2 Checklist rápido — Confirmar resultados

- Validar dados pessoais antes do lançamento;
- Conferir cálculos e regras de pontuação;
- Registrar responsável e timestamp para auditoria.

---

## 8. Suporte e Contatos

- Para problemas de acesso ou dados: contato da TI/Helpdesk local.
- Para dúvidas sobre regras operacionais: coordenação do TACF.
- Sempre inclua `ID do usuário`, `ID da sessão` e prints quando abrir chamado.

---

## 9. Situações Comuns e Resolução

### 9.1 Não consigo acessar

- Verifique e-mail e senha;
- Redefina senha via link;
- Se persistir, contate suporte com `prints` e `logs`.

### 9.2 Falha ao agendar / conflitos de vaga

- Verifique mensagens de erro no frontend;
- Confirme disponibilidade em outro local/data;
- Se conflito persistir, reporte para análise dos RPCs no banco.

### 9.3 Reagendamento pendente

- Verifique o histórico do pedido e a justificativa;
- Se necessário, escalone ao administrador responsável.

---

## 10. Segurança e Boas Práticas

- Mantenha credenciais pessoais seguras;
- Não compartilhe contas; use contas individuais;
- Use MFA quando disponível;
- Não mova regras críticas para o cliente — mantenha lógica no banco.

---

## 11. Glossário (rápido)

- **OM:** Organização Militar;
- **RPC:** função remota no Supabase/Postgres;
- **RLS:** Row Level Security (políticas de acesso no Postgres);
- **Ticket Digital:** comprovante de agendamento com QR Code.

---

## 12. Histórico de Alterações (Resumo)

- 2026-03-07 — Documento ampliado com checklists, suporte e procedimentos operacionais.

---

## 13. Observações finais

Este documento é uma referência operacional. Alterações em regras de negócio ou políticas do banco devem ser coordenadas com a equipe responsável e documentadas em `supabase/` (migrations e RPCs).
