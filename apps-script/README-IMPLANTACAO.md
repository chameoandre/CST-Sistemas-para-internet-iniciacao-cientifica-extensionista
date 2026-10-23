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

### Passo 2.1 — Criar o Projeto Apps Script
Você não precisa criar a planilha manualmente. O script cria tudo sozinho no seu Google Drive com formatação e cabeçalhos oficiais:

1. Acesse **[script.google.com](https://script.google.com/)** logado com sua conta do IFSC (ou clique em "Novo Projeto").
2. Dê o nome ao projeto de: `ICE-2026-2 — API Iniciação Científica e Extensionista`.
3. Apague o código inicial e cole todo o conteúdo do arquivo [`apps-script/Code.gs`](Code.gs).
4. Salve o projeto (`Ctrl+S` / `Cmd+S`).

---

### Passo 2.2 — Executar a Função `instalar` (Criação Automática da Planilha)
1. Na barra superior do Apps Script, ao lado do botão "Depurar", clique na caixa de seleção de funções e escolha: **`instalar`**.
2. Clique no botão **Executar**.
3. O Google solicitará autorização de permissões (Spreadsheet e Drive). Clique em **Revisar permissões**, selecione sua conta e autorize.
4. Ao concluir, abra o painel **"Registro de execução"** (abaixo do editor):
   - O script terá criado no seu Google Drive a planilha:  
     `ICE-2026-2 — Iniciação Científica e Extensionista (IFSC Garopaba)`;
   - Já estruturada com as abas `Visao-geral`, `membros` e `alteracoes`;
   - O log exibirá a **URL direta** e o **ID da Planilha** gerado.


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
