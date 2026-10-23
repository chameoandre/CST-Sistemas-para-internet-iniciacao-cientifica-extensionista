# Implantação do Backend Google Apps Script — Iniciação Científica & Extensionista

Este documento detalha o passo a passo para conectar o dashboard da Unidade Curricular de **Iniciação Científica & Extensionista** (CST Sistemas para a Internet - IFSC Garopaba) ao backend em Google Apps Script e Google Planilhas, com autenticação Google OAuth 2.0.

---

## 1. Como Funciona a Arquitetura

```
Navegador do Aluno / Docente (GitHub Pages)
  │  1. Login via Google Sign-In (obtém ID Token JWT)
  │  2. Envio de requisições POST com { idToken, acao: 'cadastrarDupla' | 'atualizarFicha' }
  ▼
Google Apps Script (Web App /exec)
  │  Valida o token com a API do Google (oauth2.googleapis.com)
  │  Verifica permissão (Docente ou Aluno cadastrado)
  ▼
Google Planilhas (Armazenamento na Nuvem)
  ├─ Aba "Visao-geral": Duplas, Temas, Trilhas, Links Overleaf e GitHub
  └─ Aba "membros": E-mails, papéis e situação dos estudantes
```

---

## 2. Passo a Passo de Instalação

### Passo 2.1 — Planilha Oficial no Google Drive
A planilha já está associada ao projeto pelo ID:
`1LWF3DLsDpgntMYiLTiaC6b44A9LOLFHHGFFT3CXfRLc` (arquivo local de atalho: `2026-2/propostas-alunos-si-sistemas-internet-2025.gsheet`).

Caso crie uma nova planilha:
1. Renomeie a primeira aba para `Visao-geral`.
2. As colunas são geradas automaticamente rodando a função `instalar()` no Apps Script.
3. Colunas estruturadas (A a J):
   - **A:** ID
   - **B:** Título / Tema da Pesquisa
   - **C:** Integrantes
   - **D:** Trilha Extensionista
   - **E:** Objetivo / Pergunta de Pesquisa
   - **F:** Link Overleaf (/read/)
   - **G:** Repositório GitHub
   - **H:** Checkpoint Atual
   - **I:** Avanços Registrados
   - **J:** E-mails dos Autores

---

### Passo 2.2 — Criar o Projeto Apps Script
1. Na planilha, clique no menu superior em **Extensões** > **Apps Script**.
2. Apague o código padrão e cole todo o conteúdo do arquivo [`apps-script/Code.gs`](Code.gs).
3. O `SHEET_ID` padrão já vem configurado:
   ```javascript
   var CONFIG = {
     SHEET_ID: '1LWF3DLsDpgntMYiLTiaC6b44A9LOLFHHGFFT3CXfRLc',
     ABA_PROJETOS: 'Visao-geral',
     GOOGLE_CLIENT_ID: '827223670130-f312ur39hg8bamvbce5noc0iaajq8b1a.apps.googleusercontent.com',
     ...
   ```
4. No menu de funções, selecione `instalar` e clique em **Executar** uma vez para estruturar os cabeçalhos das abas.
5. Salve o projeto (`Ctrl+S` / `Cmd+S`).

---

### Passo 2.3 — Implantar como Aplicativo da Web
1. No canto superior direito do Apps Script, clique no botão azul **Implantar** > **Nova implantação**.
2. Clique no ícone de engrenagem ao lado de *Selecione o tipo* e escolha **Aplicativo da Web**.
3. Preencha as opções:
   - **Descrição:** `API Dashboard ICE 2026-2`
   - **Executar como:** **Eu** (`seu.email@ifsc.edu.br`)
   - **Quem tem acesso:** **Qualquer pessoa** *(necessário para o GitHub Pages conseguir enviar requisições)*
4. Clique em **Implantar** e autorize o acesso à sua conta Google.
5. Copie a **URL do aplicativo da Web** gerada (termina com `/exec`).

---

### Passo 2.4 — Configurar o Dashboard no GitHub Pages
1. Abra o arquivo [`2026-2/ice-config.js`](../2026-2/ice-config.js) no repositório.
2. Cole a URL da API no campo `apiUrl`:
   ```javascript
   window.ICE_CONFIG = {
     apiUrl: 'https://script.google.com/macros/s/SUA_URL_AQUI/exec',
     googleClientId: '827223670130-f312ur39hg8bamvbce5noc0iaajq8b1a.apps.googleusercontent.com',
     sheetId: 'SEU_ID_DA_PLANILHA',
     sheetTab: 'Visao-geral'
   };
   ```
3. Faça commit e push para o GitHub:
   ```bash
   git add .
   git commit -m "feat: conecta dashboard a api do apps script"
   git push origin main
   ```

Pronto! O dashboard passará a ler e salvar diretamente na planilha do Google Drive de forma autenticada e segura.
