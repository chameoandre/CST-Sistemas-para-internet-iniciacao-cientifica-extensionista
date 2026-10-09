/**
 * Iniciação Científica & Extensionista (CST Sistemas para a Internet - IFSC Garopaba)
 * Backend Google Apps Script para Gestão de Duplas e Artigos COTB.
 */

var CONFIG = {
  // Planilha pública com a aba Visao-geral
  SHEET_ID: '',
  ABA_PROJETOS: 'Visao-geral',

  // ID do cliente OAuth do Google Cloud
  GOOGLE_CLIENT_ID: '827223670130-f312ur39hg8bamvbce5noc0iaajq8b1a.apps.googleusercontent.com',

  // Docentes com acesso total
  DOCENTES: [
    'andre.moraes@ifsc.edu.br',
    'adalberto.tabalipa@ifsc.edu.br',
    'chameoandre@gmail.com'
  ],

  // Domínios institucionais permitidos
  DOMINIOS_PERMITIDOS: ['ifsc.edu.br', 'aluno.ifsc.edu.br']
};

var CAB_MEMBROS = ['email', 'nome', 'projetos', 'papel', 'status', 'solicitado_em', 'decidido_por'];
var CAB_REGISTROS = ['id', 'data', 'projeto', 'email', 'autor', 'tipo', 'texto', 'evidencia', 'proximos_passos', 'dificuldades'];

function doGet(e) {
  try {
    var projetos = lerProjetos_();
    return ContentService.createTextOutput(JSON.stringify({ ok: true, projetos: projetos }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, erro: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var corpo = e.postData ? e.postData.contents : '';
    var dados = JSON.parse(corpo);
    var usuario = verificarToken_(dados.idToken);

    if (dados.acao === 'whoami') {
      return respostaJson_({ ok: true, usuario: usuario });
    }

    if (dados.acao === 'cadastrarDupla') {
      return respostaJson_(cadastrarDupla_(dados, usuario));
    }

    if (dados.acao === 'atualizarFicha') {
      return respostaJson_(atualizarFicha_(dados, usuario));
    }

    return respostaJson_({ ok: false, erro: 'Ação desconhecida: ' + dados.acao });
  } catch (err) {
    return respostaJson_({ ok: false, erro: String(err) });
  }
}

function verificarToken_(idToken) {
  if (!idToken) throw new Error('Token ausente');
  var url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) throw new Error('Token inválido');
  var payload = JSON.parse(resp.getContentText());
  var email = (payload.email || '').toLowerCase();

  var papel = 'visitante';
  if (CONFIG.DOCENTES.indexOf(email) !== -1) papel = 'docente';
  else papel = 'aluno';

  return { email: email, nome: payload.name || payload.given_name || 'Usuário', papel: papel };
}

function lerProjetos_() {
  if (!CONFIG.SHEET_ID) return [];
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var aba = ss.getSheetByName(CONFIG.ABA_PROJETOS);
  if (!aba) return [];
  var valores = aba.getDataRange().getValues();
  if (valores.length < 2) return [];

  var resultado = [];
  for (var i = 1; i < valores.length; i++) {
    var l = valores[i];
    if (!l[0]) continue;
    resultado.push({
      id: l[0],
      titulo: l[1],
      integrantes: l[2],
      trilha: l[3],
      objetivo: l[4],
      overleaf: l[5],
      github: l[6],
      checkpoint: l[7],
      avancos: l[8]
    });
  }
  return resultado;
}

function respostaJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
