# Manual do Usuário — TACF Digital

> **Versão:** 1.0 · **Idioma:** Português Brasileiro  
> **Aplica-se a:** todos os militares com perfil `user`

---

## Sumário

1. [Primeiros Passos](#primeiros-passos)
   - 1.1 [Criando sua conta](#11-criando-sua-conta)
   - 1.2 [Completando seu perfil](#12-completando-seu-perfil)
   - 1.3 [Recuperando a senha](#13-recuperando-a-senha)
2. [Painel Operacional (`/app`)](#painel-operacional)
3. [Agendamentos (`/app/agendamentos`)](#agendamentos)
   - 3.1 [Visualizando sessões disponíveis](#31-visualizando-sessões-disponíveis)
   - 3.2 [Realizando um agendamento](#32-realizando-um-agendamento)
   - 3.3 [Cancelando um agendamento](#33-cancelando-um-agendamento)
   - 3.4 [Solicitando reagendamento](#34-solicitando-reagendamento)
4. [Histórico de Resultados (`/app/resultados`)](#histórico-de-resultados)
5. [Documentos (`/app/documentos`)](#documentos)
6. [Meu Perfil (`/app/perfil`)](#meu-perfil)
   - 6.1 [Atualizando dados cadastrais](#61-atualizando-dados-cadastrais)
   - 6.2 [Alterando a senha](#62-alterando-a-senha)
7. [Notificações e Comprovantes](#notificações-e-comprovantes)
8. [Perguntas Frequentes](#perguntas-frequentes)

---

## Primeiros Passos

### 1.1 Criando sua conta

1. Acesse a URL do sistema.
2. Na tela de login, clique em **Criar conta**.
3. Preencha:
   - E-mail institucional
   - Senha (mínimo 8 caracteres)
4. Confirme o e-mail pelo link recebido na caixa de entrada.
5. Faça login com as credenciais cadastradas.

> **Atenção:** Use preferencialmente o e-mail fornecido pela organização. Contas com e-mails pessoais podem ser bloqueadas por regra de domínio.

---

### 1.2 Completando seu perfil

Na **primeira vez** que você acessar o sistema, será solicitado que complete seu perfil antes de continuar. Os dados são necessários para o correto agrupamento nas sessões de avaliação.

**Campos obrigatórios:**

| Campo              | Descrição                                |
| ------------------ | ---------------------------------------- |
| Nome completo      | Nome civil completo                      |
| Nome de guerra     | Nome operacional                         |
| Posto/Graduação    | Ex.: Sgt, Ten, Cap                       |
| SARAM              | Número de matrícula militar              |
| Seção              | Unidade ou seção de lotação              |
| Telefone           | Contato para notificações                |
| Data de nascimento | DD/MM/AAAA                               |
| Grupo físico       | Definido pela organização (ex.: A, B, C) |

> Após salvar, você será redirecionado para o painel principal.

---

### 1.3 Recuperando a senha

1. Na tela de login, clique em **Esqueci minha senha**.
2. Informe seu e-mail cadastrado.
3. Verifique sua caixa de entrada e clique no link recebido.
4. Defina a nova senha e confirme.

O link de recuperação expira em **60 minutos**.

---

## Painel Operacional

**Rota:** `/app`

Tela inicial após o login. Apresenta um resumo da sua situação:

| Cartão             | Informação                                              |
| ------------------ | ------------------------------------------------------- |
| **Agendamentos**   | Quantidade de sessões nas quais você está inscrito      |
| **Resultados**     | Total de avaliações realizadas                          |
| **Próxima Sessão** | Data, horário e local da sua próxima avaliação agendada |
| **Notificações**   | Alertas de reagendamento, confirmações e lembretes      |

**Ações rápidas disponíveis no painel:**

- **Ver meus ingressos** — abre a lista de todos os seus comprovantes de agendamento
- **Cancelar agendamento** — cancela a inscrição na próxima sessão (se dentro do prazo permitido)
- **Solicitar reagendamento** — inicia o processo de troca de data

---

## Agendamentos

**Rota:** `/app/agendamentos`

### 3.1 Visualizando sessões disponíveis

A tela exibe um **calendário mensal** com as sessões disponíveis marcadas. O sistema seleciona automaticamente a **primeira sessão futura** do mês ao abrir a tela.

**Navegação:**

- Use as setas `‹` e `›` para navegar entre meses.
- Dias com sessões disponíveis aparecem destacados.
- Clique em um dia para ver os detalhes das sessões daquele dia.

> Se não houver sessões futuras no mês exibido, nenhuma data ficará selecionada. Navegue para o próximo mês.

---

### 3.2 Realizando um agendamento

1. Selecione um dia com sessão disponível no calendário.
2. No painel lateral, escolha o horário desejado.
3. Clique em **Agendar**.
4. Confirme no dialog de confirmação.
5. O sistema emitirá o **ingresso digital** com QR Code.

> **Restrições:**
>
> - Você pode ter apenas **um agendamento ativo** por vez.
> - A inscrição é possível somente enquanto houver vagas e dentro do prazo definido pela administração.
> - Validações de capacidade e quórum são aplicadas automaticamente.

---

### 3.3 Cancelando um agendamento

O cancelamento pode ser feito de dois lugares:

**A) Painel Operacional (`/app`)**

1. Clique em **Cancelar agendamento** no cartão da próxima sessão.
2. Confirme no dialog.

**B) Tela de Agendamentos (`/app/agendamentos`)**

1. Localize a sessão na qual você está inscrito.
2. Clique no seu ingresso.
3. No modal do ingresso, clique em **Cancelar inscrição**.
4. Confirme.

> **Prazo:** O cancelamento só é permitido dentro do período configurado pela administração. Após esse prazo, entre em contato com o coordenador responsável.

---

### 3.4 Solicitando reagendamento

Se você já possui um agendamento e precisa trocar de data:

1. No painel, clique em **Solicitar reagendamento**.
2. Escolha a nova sessão desejada no calendário.
3. Informe a **justificativa** (campo obrigatório).
4. Envie a solicitação.

A solicitação ficará com status **Pendente** até que o coordenador aprove ou rejeite. Você receberá uma notificação com o resultado.

> **Atenção:** Não cancele seu agendamento atual antes de ter a solicitação de reagendamento aprovada. Caso contrário, perderá sua vaga.

---

## Histórico de Resultados

**Rota:** `/app/resultados`

Exibe todas as suas avaliações físicas realizadas, em ordem cronológica decrescente.

**Informações por resultado:**

| Campo            | Descrição                            |
| ---------------- | ------------------------------------ |
| Data             | Data da sessão                       |
| Sessão           | Identificador da turma               |
| Resultado        | Apto / Inapto / Dispensado           |
| Pontuação        | Nota obtida (quando aplicável)       |
| Validade INSPSAU | Data até quando o resultado é válido |

Clique em qualquer linha para ver os **detalhes completos** da avaliação, incluindo desempenho por exercício.

---

## Documentos

**Rota:** `/app/documentos`

Área para acesso a documentos oficiais relacionados ao TACF:

- Regulamentos e normas
- Formulários para dispensa médica
- Orientações para o teste

> Os documentos são publicados pela administração. Caso precise de um documento não listado, contate o setor responsável.

---

## Meu Perfil

**Rota:** `/app/perfil`

### 6.1 Atualizando dados cadastrais

1. Acesse **Meu Perfil** no menu lateral.
2. Edite os campos desejados.
3. Clique em **Salvar alterações**.

**Campos editáveis:**

| Campo              | Observações                                  |
| ------------------ | -------------------------------------------- |
| Nome completo      | —                                            |
| Nome de guerra     | —                                            |
| Posto/Graduação    | —                                            |
| Seção              | —                                            |
| SARAM              | Contate o admin se precisar corrigir         |
| Telefone           | —                                            |
| Data de nascimento | —                                            |
| Grupo físico       | Definido pela administração                  |
| INSPSAU válida até | Atualizada pela administração após avaliação |

> **Nota:** Alguns campos como SARAM e grupo físico podem ser restritos. Caso não consiga editar, solicite a correção ao coordenador.

---

### 6.2 Alterando a senha

1. Na tela **Meu Perfil**, role até a seção **Segurança**.
2. Clique em **Alterar senha**.
3. Informe a senha atual.
4. Informe a nova senha e confirme.
5. Clique em **Salvar**.

**Requisitos da senha:**

- Mínimo de 8 caracteres
- Deve conter letras e números

---

## Notificações e Comprovantes

### Notificações

O sistema envia notificações nas seguintes situações:

| Evento                                          | Canal                           |
| ----------------------------------------------- | ------------------------------- |
| Confirmação de agendamento                      | E-mail + notificação no sistema |
| Cancelamento de sessão pelo admin               | E-mail + notificação no sistema |
| Resultado de reagendamento (aprovado/rejeitado) | E-mail + notificação no sistema |
| Lembrete de sessão (dia anterior)               | E-mail                          |
| INSPSAU próxima do vencimento                   | Notificação no sistema          |

Acesse o ícone de sino 🔔 no cabeçalho para ver todas as notificações.

### Comprovante / Ingresso Digital

Após o agendamento, um **ingresso digital com QR Code** é gerado automaticamente.

Para acessar seu ingresso:

1. No painel operacional, clique em **Ver meus ingressos**.
2. Localize o agendamento desejado.
3. Clique em **Abrir ingresso**.

O QR Code é utilizado pela administração no dia da sessão para confirmar sua presença.

> Você pode fazer uma captura de tela do ingresso ou acessá-lo pelo celular no dia da avaliação.

---

## Perguntas Frequentes

**Não consigo me inscrever. O que pode estar errado?**  
Verifique: (1) se há vagas disponíveis na sessão; (2) se você já possui outro agendamento ativo; (3) se o prazo de inscrição não encerrou. Em caso de dúvida, contate o coordenador.

---

**Posso ter dois agendamentos ao mesmo tempo?**  
Não. O sistema permite apenas um agendamento ativo por militar. Cancele o atual para fazer um novo.

---

**Minha sessão foi cancelada. O que acontece com meu agendamento?**  
Quando uma sessão é cancelada pela administração, todos os inscritos são notificados automaticamente. Você poderá se inscrever em outra sessão disponível.

---

**Fiz o teste mas o resultado não aparece no histórico.**  
O resultado é lançado manualmente pelo coordenador após a sessão. Aguarde até o fechamento oficial da turma. Se passar de 5 dias úteis, contate o coordenador.

---

**Como sei se minha INSPSAU está válida?**  
No painel operacional, o cartão de resultados exibe a data de validade atual. Você também receberá uma notificação quando a validade estiver próxima do vencimento.

---

**Esqueci minha senha e não recebi o e-mail de recuperação.**  
Verifique a pasta de spam. Se o e-mail não chegar em 5 minutos, tente novamente na tela de login. Caso o problema persista, contate o suporte ou o admin do sistema.

---

_Última atualização: gerada automaticamente via documentação do repositório._
