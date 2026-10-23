/* Configuração do dashboard Iniciação Científica & Extensionista (CST Sistemas para a Internet - 2026/2).
   Os valores abaixo são públicos por natureza; nenhuma senha ou segredo fica aqui.
   Enquanto apiUrl estiver vazio, o dashboard roda em modo demonstração/local com persistência. */
window.ICE_CONFIG = {
  // URL do app da web do Apps Script (termina em /exec). Ver apps-script/README-IMPLANTACAO.md
  apiUrl: 'https://script.google.com/macros/s/AKfycby_KgiYSL2uFJWkMMjr45wNocNajf0r-yCWJ-6mDoE1TmNmIlvjHpqUZFyLayS7reQ/exec',

  // ID do cliente OAuth do Google Cloud (termina em .apps.googleusercontent.com)
  googleClientId: '827223670130-f312ur39hg8bamvbce5noc0iaajq8b1a.apps.googleusercontent.com',

  // Planilha oficial do Google Sheets (gerada automaticamente ao rodar a função instalar() no Apps Script)
  sheetId: '1xhGSDm4AThKDu8lFJrtikYBWof80lvzt2dtRum8pOQM',
  sheetTab: 'Visao-geral',

  // Dias sem registro a partir dos quais uma dupla aparece como "atenção"
  diasParado: 14
};
