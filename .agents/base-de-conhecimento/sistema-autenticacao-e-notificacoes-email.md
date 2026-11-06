# Sistema de Autenticação Google & Notificações por E-mail (Apps Script + GmailApp)

**Data do registro:** 06/11/2026  
**Referência:** Padrão unificado de Programação para a Internet II (`uc-programacao-para-a-internet-2`) e Projetos Integradores.

---

## 1. Visão Geral da Arquitetura

O sistema de gestão de duplas e candidaturas a temas da UC opera com arquitetura híbrida:

1. **Frontend (GitHub Pages):**
   - Autenticação via **Google Identity Services (GIS)** utilizando o Client ID OAuth 2.0 institucional (`827223670130-f312ur39hg8bamvbce5noc0iaajq8b1a.apps.googleusercontent.com`).
   - Sincronização em tempo real via polling silencioso a cada 25 segundos (`syncIntervalMs`).
   - Modo de contingência e persistência instantânea via `localStorage`.
   - Disparo de requisições POST autenticadas via `fetch` em `text/plain;charset=utf-8` para contornar pré-verificação restritiva de CORS.

2. **Backend (Google Apps Script Web App):**
   - Validação de JWT via endpoint oficial do Google (`oauth2.googleapis.com/tokeninfo`).
   - Verificação de domínios institucionais autorizados (`@ifsc.edu.br` e `@aluno.ifsc.edu.br`).
   - Gravação de dados e auditoria em Google Planilhas (`Visao-geral`, `membros`, `alteracoes`).

3. **Motor de E-mails em HTML Rico (`GmailApp`):**
   - Disparo automático para os docentes (`andre.moraes@ifsc.edu.br`, `adalberto.tabalipa@ifsc.edu.br`, `chameoandre@gmail.com`) e discentes.
   - Cabeçalho temático com cores institucionais:
     - **Verde IFSC (`#16a34a`):** Confirmação de Cadastro de Nova Dupla / Candidatura a Tema.
     - **Azul Oceano (`#0284c7`):** Notificação de nova dupla para a coordenação docente.
     - **Roxo (`#7c3aed`):** Atualização de link do Overleaf ou avanço de Checkpoint.
     - **Âmbar (`#d97706`):** Lembretes de andamento do Checkpoint 2.
     - **Vermelho (`#dc2626`):** Cobrança de link pendente do Overleaf.

---

## 2. Menu de Ações Rápidas no Google Sheets (`onOpen`)

Ao abrir a planilha vinculada no Google Drive, o menu superior **`🚀 ICE — Gestão & Notificações`** permite:

- **1. Inicializar / Verificar Abas da Planilha:** Criação e checagem de integridade das abas.
- **📧 Enviar Lembrete de Checkpoint 2 para Dupla Selecionada:** Dispara e-mail formatado em HTML diretamente para a dupla da linha ativa.
- **⚠️ Cobrar Duplas sem Link do Overleaf por E-mail:** Varre a coluna de Overleaf e notifica todos os grupos sem link cadastrado.
- **📢 Enviar Comunicado Geral da Turma por E-mail:** Disparo de avisos e recados para todas as duplas cadastradas.

---

## 3. Padrão Visual dos Cards de Equipes (`.pedagogical-card`)

Seguindo o padrão de Projeto Integrador 2 e dos Roteiros Práticos, os cards de equipes no Painel da Aba 4 utilizam:
- **Badge e Ícone Temático por Trilha:** Verde (`#16a34a`) para Ciência de Dados, Azul (`#0284c7`) para Acessibilidade, Âmbar (`#d97706`) para Desempenho e Roxo (`#7c3aed`) para Extensão Comunitária.
- **Clipart Vetorial SVG Dinâmico (`card-clipart-box`):** Ilustração customizada de acordo com a trilha da pesquisa (bancos de dados/gráficos, símbolo universal WCAG, velocímetro/latência, ou nós de rede comunitária).
- **Barra de Progresso do Checkpoint:** Marcadores de 25%, 50%, 75% e 100%.
- **Grupo de Ações Rápidas (`.pedagogical-actions-group`):** Acesso com um clique ao Overleaf, GitHub, modal de edição e visualização de detalhes.


