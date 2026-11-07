/**
 * Iniciação Científica & Extensionista (CST Sistemas para a Internet - IFSC Garopaba)
 * Backend Google Apps Script para Gestão de Duplas, Artigos COTB e Notificações por E-mail.
 *
 * Padrão Unificado com Programação para a Internet II e Projetos Integradores.
 *
 * Funcionalidades:
 * - Autenticação Google Identity Services (OAuth 2.0 / JWT) com validação de domínios institucionais
 * - Gestão de Duplas e Fichas de Pesquisa (Visao-geral, membros, alteracoes)
 * - Disparo automático de e-mails em HTML rico institucional (GmailApp):
 *     • Nova Dupla / Candidatura a Tema de Pesquisa (Cabeçalho Verde IFSC #16a34a)
 *     • Atualização de Link do Overleaf & Avanço de Checkpoint (Cabeçalho Azul #0284c7)
 *     • Lembretes de Checkpoint 2 e Cobrança de Links Pendentes (Cabeçalho Âmbar #d97706)
 *     • Comunicados Gerais da Equipe Docente (Cabeçalho Roxo #7c3aed)
 * - Menu customizado na planilha (onOpen) para ações docentes com 1 clique
 *
 * Implantação e instruções: apps-script/README-IMPLANTACAO.md
 */

var CONFIG = {
  // Planilha oficial de propostas (aba Visao-geral).
  SHEET_ID: '1xhGSDm4AThKDu8lFJrtikYBWof80lvzt2dtRum8pOQM',
  ABA_PROJETOS: 'Visao-geral',

  // ID do cliente OAuth do Google Cloud
  GOOGLE_CLIENT_ID: '827223670130-f312ur39hg8bamvbce5noc0iaajq8b1a.apps.googleusercontent.com',

  // URL do Dashboard oficial
  DASHBOARD_URL: 'https://chameoandre.github.io/CST-Sistemas-para-internet-iniciacao-cientifica-extensionista/2026-2/',

  // Identidade das Notificações
  NOME_REMETENTE: 'Iniciação Científica & Extensionista • IFSC Garopaba',
  DISCIPLINA_CURTA: 'ICE 2026/2',

  // Docentes com acesso total irrestrito e cópia das notificações
  DOCENTES: [
    'andre.moraes@ifsc.edu.br',
    'adalberto.tabalipa@ifsc.edu.br',
    'alberto.barros@ifsc.edu.br',
    'chameoandre@gmail.com'
  ],

  // Domínios institucionais aceitos
  DOMINIOS_PERMITIDOS: ['ifsc.edu.br', 'aluno.ifsc.edu.br'],

  // Flag de envio de e-mails
  NOTIFICAR_EMAIL: true
};

var CAB_PROJETOS = ['id', 'titulo', 'integrantes', 'trilha', 'objetivo', 'overleaf', 'github', 'checkpoint', 'avancos', 'emails'];
var CAB_MEMBROS = ['email', 'nome', 'projetos', 'papel', 'status', 'cadastrado_em'];
var CAB_ALTERACOES = ['data', 'projeto', 'email', 'autor', 'campo', 'valor_anterior', 'valor_novo'];
var CAB_RECADOS = ['id', 'data_hora', 'autor_nome', 'autor_email', 'papel', 'tipo_destinatario', 'projeto_id_alvo', 'equipe_alvo', 'titulo', 'conteudo', 'categoria', 'link_apoio', 'fixado', 'status'];

// ============================ MENU NA PLANILHA ============================
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('🚀 ICE — Gestão & Notificações')
      .addItem('1. Inicializar / Verificar Abas da Planilha', 'instalar')
      .addSeparator()
      .addItem('📧 Enviar Lembrete de Checkpoint 2 para Dupla Selecionada', 'menuDispararLembreteLinha_')
      .addItem('⚠️ Cobrar Duplas sem Link do Overleaf por E-mail', 'menuCobrarOverleafPendentes_')
      .addItem('📢 Enviar Comunicado Geral da Turma por E-mail', 'menuEnviarComunicadoTurma_')
      .addToUi();
  } catch (e) {
    Logger.log('onOpen fora de contexto UI: ' + e);
  }
}

// Planilha começa limpa sem dados mockados. As equipes aparecerão conforme as duplas se cadastrarem.
var DADOS_INICIAIS_PADRAO = [];

/**
 * Retorna a planilha oficial. Se não existir, cria automaticamente via instalar().
 */
function obterPlanilha_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID') || CONFIG.SHEET_ID;
  var ss = null;

  if (id) {
    try {
      ss = SpreadsheetApp.openById(id);
    } catch (e) {
      ss = null;
    }
  }

  if (!ss) {
    instalar();
    var novoId = props.getProperty('SHEET_ID');
    ss = SpreadsheetApp.openById(novoId);
  }

  return ss;
}

/**
 * Endpoint GET: Devolve a lista pública de projetos/duplas, avaliações e recados em formato JSON.
 * Também aceita requisições com ?payload=... como fallback resiliente contra bloqueios de CORS/302.
 */
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.payload) {
      try {
        var fakePost = { postData: { contents: e.parameter.payload } };
        return doPost(fakePost);
      } catch (postErr) {
        return respostaJson_({ ok: false, erro: String(postErr.message || postErr) });
      }
    }

    var projetos = lerProjetos_();
    var avaliacoes = lerAvaliacoes_();
    var recados = lerRecados_();
    var docentes = lerDocentes_();
    return respostaJson_({ ok: true, projetos: projetos, avaliacoes: avaliacoes, recados: recados, docentes: docentes });
  } catch (err) {
    return respostaJson_({ ok: false, erro: String(err) });
  }
}

/**
 * Endpoint POST: Processa ações autenticadas com ID Token Google.
 * Recebe payload no corpo como text/plain para evitar pré-verificação CORS.
 */
function doPost(e) {
  try {
    var corpo = e.postData ? e.postData.contents : '';
    if (!corpo) {
      return respostaJson_({ ok: false, erro: 'Corpo da requisição vazio' });
    }

    var dados = JSON.parse(corpo);
    var usuario = verificarToken_(dados.idToken);

    if (dados.acao === 'whoami') {
      return respostaJson_({ ok: true, usuario: usuario });
    }

    if (dados.acao === 'cadastrarDupla') {
      return respostaJson_(cadastrarDupla_(dados.projeto || dados, usuario));
    }

    if (dados.acao === 'atualizarFicha') {
      return respostaJson_(atualizarFicha_(dados.projeto || dados, usuario));
    }

    if (dados.acao === 'excluirDupla') {
      return respostaJson_(excluirDupla_(dados.id, usuario));
    }

    if (dados.acao === 'salvarAvaliacao') {
      return respostaJson_(salvarAvaliacao_(dados.avaliacao || dados, usuario));
    }

    if (dados.acao === 'listarAvaliacoes') {
      return respostaJson_({ ok: true, avaliacoes: lerAvaliacoes_() });
    }

    if (dados.acao === 'salvarRecado') {
      return respostaJson_(salvarRecado_(dados.recado || dados, usuario));
    }

    if (dados.acao === 'excluirRecado') {
      return respostaJson_(excluirRecado_(dados.id, usuario));
    }

    if (dados.acao === 'listarRecados') {
      return respostaJson_({ ok: true, recados: lerRecados_() });
    }

    if (dados.acao === 'listarDocentes') {
      return respostaJson_({ ok: true, docentes: lerDocentes_() });
    }

    if (dados.acao === 'salvarDocente') {
      if (usuario.papel !== 'docente') {
        throw new Error('Apenas docentes podem cadastrar ou atualizar outros orientadores.');
      }
      return respostaJson_(salvarDocente_(dados.docente || dados, usuario));
    }

    if (dados.acao === 'removerDocente') {
      if (usuario.papel !== 'docente') {
        throw new Error('Apenas docentes podem remover outros orientadores.');
      }
      return respostaJson_(removerDocente_(dados.email, usuario));
    }

    if (dados.acao === 'dispararLembreteDupla') {
      if (usuario.papel !== 'docente') {
        throw new Error('Apenas docentes podem disparar lembretes.');
      }
      return respostaJson_(dispararLembreteDuplaIndividual_(dados.id, dados.tipo, usuario));
    }

    if (dados.acao === 'cobrarOverleafEmMassa') {
      if (usuario.papel !== 'docente') {
        throw new Error('Apenas docentes podem disparar cobranças em massa.');
      }
      return respostaJson_(cobrarOverleafEmMassaDireto_());
    }

    if (dados.acao === 'dispararLembreteTurma' || dados.acao === 'dispararLembreteCheckpoint2EmMassa') {
      if (usuario.papel !== 'docente') {
        throw new Error('Apenas docentes podem disparar lembretes em massa.');
      }
      return respostaJson_(dispararLembreteTurmaCheckpoint2Direto_());
    }

    if (dados.acao === 'enviarComunicado') {
      if (usuario.papel !== 'docente') {
        throw new Error('Apenas docentes podem enviar comunicados gerais.');
      }
      return respostaJson_(enviarComunicadoTurma_(dados.titulo, dados.mensagem, usuario));
    }

    return respostaJson_({ ok: false, erro: 'Ação desconhecida: ' + dados.acao });
  } catch (err) {
    return respostaJson_({ ok: false, erro: String(err) });
  }
}

/**
 * Valida o JWT do Google via endpoint oficial do Google OAuth2.
 */
function verificarToken_(idToken) {
  if (!idToken) throw new Error('Token de autenticação ausente');

  var docentesAutorizados = obterListaDocentes_();

  // Suporte a modo simulado/demonstração
  if (typeof idToken === 'string' && idToken.indexOf('simulado:') === 0) {
    var emailSimulado = idToken.replace('simulado:', '').toLowerCase().trim();
    var isDocSim = docentesAutorizados.indexOf(emailSimulado) !== -1 ||
                   emailSimulado.indexOf('alberto.barros') !== -1 ||
                   emailSimulado.indexOf('andre.moraes') !== -1 ||
                   emailSimulado.indexOf('adalberto') !== -1;
    return {
      email: emailSimulado,
      nome: emailSimulado.split('@')[0].replace('.', ' '),
      papel: isDocSim ? 'docente' : 'aluno'
    };
  }

  var url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) {
    throw new Error('Token Google inválido ou expirado. Faça login novamente.');
  }

  var payload = JSON.parse(resp.getContentText());
  var email = (payload.email || '').toLowerCase().trim();

  // Validação opcional de domínio institucional
  if (CONFIG.DOMINIOS_PERMITIDOS.length > 0) {
    var dominio = email.split('@')[1] || '';
    var permitido = CONFIG.DOMINIOS_PERMITIDOS.indexOf(dominio) !== -1 || docentesAutorizados.indexOf(email) !== -1;
    if (!permitido) {
      throw new Error('Utilize um e-mail institucional (@ifsc.edu.br ou @aluno.ifsc.edu.br).');
    }
  }

  var isDocente = docentesAutorizados.indexOf(email) !== -1 ||
                  email.indexOf('alberto.barros') !== -1 ||
                  email.indexOf('andre.moraes') !== -1 ||
                  email.indexOf('adalberto.tabalipa') !== -1;
  var papel = isDocente ? 'docente' : 'aluno';
  var nome = payload.name || payload.given_name || email.split('@')[0];

  return { email: email, nome: nome, papel: papel, picture: payload.picture || '' };
}

/**
 * Lê todas as duplas e propostas cadastradas na aba Visao-geral.
 */
function lerProjetos_() {
  var ss = obterPlanilha_();
  var aba = ss.getSheetByName(CONFIG.ABA_PROJETOS);
  if (!aba) {
    aba = ss.insertSheet(CONFIG.ABA_PROJETOS);
    aba.appendRow(CAB_PROJETOS);
    return [];
  }

  var valores = aba.getDataRange().getValues();
  if (valores.length < 2) return [];

  var resultado = [];
  for (var i = 1; i < valores.length; i++) {
    var l = valores[i];
    var idNum = parseInt(l[0], 10);
    if (!idNum) continue;

    var emailsLista = [];
    if (l[9]) {
      emailsLista = String(l[9]).split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
    }

    resultado.push({
      id: idNum,
      titulo: String(l[1] || ''),
      integrantes: String(l[2] || ''),
      trilha: String(l[3] || 'Trilha 1: Ciência de Dados & Dados Abertos'),
      objetivo: String(l[4] || ''),
      overleaf: String(l[5] || ''),
      github: String(l[6] || ''),
      checkpoint: String(l[7] || 'Checkpoint 1: Tema & Lattes'),
      avancos: String(l[8] || 'Proposta cadastrada.'),
      emails: emailsLista,
      progresso: calcularProgresso_(String(l[7] || '')),
      status: 'ativo'
    });
  }
  return resultado;
}

/**
 * Cadastra uma nova proposta / dupla na planilha.
 */
function cadastrarDupla_(p, usuario) {
  if (!p.titulo) throw new Error('O título ou tema provisório da pesquisa é obrigatório.');
  if (!p.integrantes) throw new Error('O nome dos integrantes é obrigatório.');

  var ss = obterPlanilha_();
  var aba = ss.getSheetByName(CONFIG.ABA_PROJETOS);
  if (!aba) {
    aba = ss.insertSheet(CONFIG.ABA_PROJETOS);
    aba.appendRow(CAB_PROJETOS);
  }

  var valores = aba.getDataRange().getValues();
  var maiorId = 0;
  for (var i = 1; i < valores.length; i++) {
    var valId = parseInt(valores[i][0], 10);
    if (valId && valId > maiorId) maiorId = valId;
  }
  var novoId = maiorId + 1;

  var emailsArr = [];
  if (Array.isArray(p.emails)) {
    emailsArr = p.emails;
  } else if (typeof p.emails === 'string') {
    emailsArr = p.emails.split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
  }

  // Garante que o e-mail do autor autenticado esteja na lista de permissões
  if (usuario && usuario.email && emailsArr.indexOf(usuario.email) === -1) {
    emailsArr.push(usuario.email);
  }

  var emailsStr = emailsArr.join(', ');
  var trilha = p.trilha || 'Trilha 1: Ciência de Dados & Dados Abertos';
  var checkpoint = p.checkpoint || 'Checkpoint 1: Tema & Lattes';
  var avancos = p.avancos || 'Proposta cadastrada no dashboard.';

  aba.appendRow([
    novoId,
    p.titulo,
    p.integrantes,
    trilha,
    p.objetivo || '',
    p.overleaf || '',
    p.github || '',
    checkpoint,
    avancos,
    emailsStr
  ]);

  // Registra os integrantes na aba membros
  var abaMembros = garantirAba_(ss, 'membros', CAB_MEMBROS);
  var agora = new Date().toISOString();
  emailsArr.forEach(function (em) {
    abaMembros.appendRow([em, p.integrantes, String(novoId), 'aluno', 'ativo', agora]);
  });

  var objRetorno = {
    id: novoId,
    titulo: p.titulo,
    integrantes: p.integrantes,
    trilha: trilha,
    objetivo: p.objetivo || '',
    overleaf: p.overleaf || '',
    github: p.github || '',
    checkpoint: checkpoint,
    avancos: avancos,
    emails: emailsArr,
    progresso: calcularProgresso_(checkpoint),
    status: 'ativo'
  };

  // Disparo automático de e-mail institucional
  if (CONFIG.NOTIFICAR_EMAIL) {
    try {
      enviarEmailCandidaturaDupla_(ss, objRetorno, usuario);
    } catch (errEmail) {
      Logger.log('Erro ao enviar e-mail de cadastro da dupla: ' + errEmail);
    }
  }

  return {
    ok: true,
    mensagem: 'Proposta #' + novoId + ' cadastrada com sucesso na planilha oficial!',
    projeto: objRetorno
  };
}

/**
 * Atualiza a ficha de uma dupla já existente na planilha.
 */
function atualizarFicha_(p, usuario) {
  var idAlvo = parseInt(p.id, 10);
  if (!idAlvo) throw new Error('ID do projeto inválido para edição.');

  var ss = obterPlanilha_();
  var aba = ss.getSheetByName(CONFIG.ABA_PROJETOS);
  if (!aba) throw new Error('Aba ' + CONFIG.ABA_PROJETOS + ' não encontrada.');

  var valores = aba.getDataRange().getValues();
  var linhaAlvo = -1;
  var linhaDados = null;

  for (var i = 1; i < valores.length; i++) {
    if (parseInt(valores[i][0], 10) === idAlvo) {
      linhaAlvo = i + 1; // 1-based no Sheets
      linhaDados = valores[i];
      break;
    }
  }

  if (linhaAlvo === -1) {
    throw new Error('Projeto #' + idAlvo + ' não foi encontrado na planilha.');
  }

  // Verifica permissão: Docente ou membro autorizado da dupla
  var isDocente = usuario && usuario.papel === 'docente';
  var emailsCadastrados = String(linhaDados[9] || '').split(',').map(function (s) { return s.trim().toLowerCase(); });
  var isMembro = usuario && emailsCadastrados.indexOf(usuario.email) !== -1;

  if (!isDocente && !isMembro) {
    throw new Error('Acesso negado: você não tem permissão para editar o Projeto #' + idAlvo + '.');
  }

  // Atualização dos campos
  var novoTitulo = p.titulo !== undefined ? p.titulo : linhaDados[1];
  var novoIntegrantes = (isDocente && p.integrantes !== undefined) ? p.integrantes : linhaDados[2];
  var novaTrilha = p.trilha !== undefined ? p.trilha : linhaDados[3];
  var novoObjetivo = p.objetivo !== undefined ? p.objetivo : linhaDados[4];
  var novoOverleaf = p.overleaf !== undefined ? p.overleaf : linhaDados[5];
  var novoGithub = p.github !== undefined ? p.github : linhaDados[6];
  var novoCheckpoint = p.checkpoint !== undefined ? p.checkpoint : linhaDados[7];
  var novosAvancos = p.avancos !== undefined ? p.avancos : linhaDados[8];

  aba.getRange(linhaAlvo, 2).setValue(novoTitulo);
  aba.getRange(linhaAlvo, 3).setValue(novoIntegrantes);
  aba.getRange(linhaAlvo, 4).setValue(novaTrilha);
  aba.getRange(linhaAlvo, 5).setValue(novoObjetivo);
  aba.getRange(linhaAlvo, 6).setValue(novoOverleaf);
  aba.getRange(linhaAlvo, 7).setValue(novoGithub);
  aba.getRange(linhaAlvo, 8).setValue(novoCheckpoint);
  aba.getRange(linhaAlvo, 9).setValue(novosAvancos);

  // Registro de auditoria
  try {
    var abaAlt = garantirAba_(ss, 'alteracoes', CAB_ALTERACOES);
    abaAlt.appendRow([
      new Date().toISOString(),
      idAlvo,
      usuario.email,
      usuario.nome,
      'atualizarFicha',
      JSON.stringify({ titulo: linhaDados[1], cp: linhaDados[7], overleaf: linhaDados[5] }),
      JSON.stringify({ titulo: novoTitulo, cp: novoCheckpoint, overleaf: novoOverleaf })
    ]);
  } catch (e) {
    // Falha silenciosa de auditoria não impede salvamento principal
  }

  var objAtualizado = {
    id: idAlvo,
    titulo: novoTitulo,
    integrantes: novoIntegrantes,
    trilha: novaTrilha,
    objetivo: novoObjetivo,
    overleaf: novoOverleaf,
    github: novoGithub,
    checkpoint: novoCheckpoint,
    avancos: novosAvancos,
    emails: emailsCadastrados,
    progresso: calcularProgresso_(novoCheckpoint),
    status: 'ativo'
  };

  // Se houve alteração relevante (Overleaf ou Checkpoint), notifica por e-mail
  if (CONFIG.NOTIFICAR_EMAIL) {
    var mudouOverleaf = (novoOverleaf !== String(linhaDados[5] || '')) && novoOverleaf;
    var mudouCheckpoint = (novoCheckpoint !== String(linhaDados[7] || ''));
    if (mudouOverleaf || mudouCheckpoint) {
      try {
        enviarEmailAtualizacaoFicha_(ss, objAtualizado, usuario, {
          mudouOverleaf: mudouOverleaf,
          mudouCheckpoint: mudouCheckpoint,
          overleafAnterior: linhaDados[5],
          checkpointAnterior: linhaDados[7]
        });
      } catch (errEmail) {
        Logger.log('Erro ao enviar e-mail de atualização: ' + errEmail);
      }
    }
  }

  return {
    ok: true,
    mensagem: 'Ficha #' + idAlvo + ' atualizada com sucesso!',
    projeto: objAtualizado
  };
}

/**
 * Exclui permanentemente uma candidatura/dupla da planilha oficial (exclusivo docente).
 */
function excluirDupla_(idAlvo, usuario) {
  var idNum = parseInt(idAlvo, 10);
  if (!idNum) throw new Error('ID do projeto inválido para exclusão.');
  if (!usuario || usuario.papel !== 'docente') {
    throw new Error('Acesso negado: apenas docentes podem excluir candidaturas e projetos.');
  }

  var ss = obterPlanilha_();
  var aba = ss.getSheetByName(CONFIG.ABA_PROJETOS);
  if (!aba) throw new Error('Aba ' + CONFIG.ABA_PROJETOS + ' não encontrada.');

  var valores = aba.getDataRange().getValues();
  var linhaAlvo = -1;
  var tituloProj = '';

  for (var i = 1; i < valores.length; i++) {
    if (parseInt(valores[i][0], 10) === idNum) {
      linhaAlvo = i + 1;
      tituloProj = valores[i][1];
      break;
    }
  }

  if (linhaAlvo === -1) {
    throw new Error('Projeto #' + idNum + ' não foi encontrado na planilha oficial.');
  }

  // Remove a linha na aba Visao-geral
  aba.deleteRow(linhaAlvo);

  // Remove membros vinculados
  try {
    var abaMembros = ss.getSheetByName('membros');
    if (abaMembros) {
      var dadosMembros = abaMembros.getDataRange().getValues();
      for (var j = dadosMembros.length - 1; j >= 1; j--) {
        if (String(dadosMembros[j][2]) === String(idNum)) {
          abaMembros.deleteRow(j + 1);
        }
      }
    }
  } catch (e) {}

  // Auditoria
  try {
    var abaAlt = garantirAba_(ss, 'alteracoes', CAB_ALTERACOES);
    abaAlt.appendRow([
      new Date().toISOString(),
      idNum,
      usuario.email,
      usuario.nome,
      'excluirDupla',
      tituloProj,
      'EXCLUÍDO'
    ]);
  } catch (e) {}

  return { ok: true, mensagem: 'Projeto #' + idNum + ' excluído com sucesso!' };
}

/**
 * Lança ou atualiza uma avaliação formativa de uma entrega/checkpoint (exclusivo docente).
 */
function salvarAvaliacao_(aval, usuario) {
  if (!usuario || usuario.papel !== 'docente') {
    throw new Error('Apenas docentes podem lançar avaliações formativas.');
  }

  var idProj = parseInt(aval.projetoId, 10);
  if (!idProj) throw new Error('ID do projeto inválido.');

  var ss = obterPlanilha_();
  var cabAv = ['id', 'data', 'projeto_id', 'equipe', 'instrumento', 'nota', 'feedback', 'avaliador'];
  var aba = garantirAba_(ss, 'Avaliacoes', cabAv);
  formatarAbaCabecalho_(aba);

  var agora = new Date().toLocaleString('pt-BR');
  var instrumento = aval.instrumento || 'A2 (Checkpoints)';
  var idAv = 'AV-' + idProj + '-' + instrumento.replace(/[^a-zA-Z0-9]/g, '');
  var valores = aba.getDataRange().getValues();
  var linhaAlvo = -1;

  for (var i = 1; i < valores.length; i++) {
    if (String(valores[i][0]) === idAv || (parseInt(valores[i][2], 10) === idProj && String(valores[i][4]) === instrumento)) {
      linhaAlvo = i + 1;
      break;
    }
  }

  var notaNum = Number(aval.nota != null ? aval.nota : 10);
  var linha = [
    idAv,
    agora,
    idProj,
    aval.equipe || '',
    instrumento,
    notaNum,
    aval.feedback || '',
    usuario.nome || 'Prof. André Moraes'
  ];

  if (linhaAlvo > 1) {
    aba.getRange(linhaAlvo, 1, 1, linha.length).setValues([linha]);
  } else {
    aba.appendRow(linha);
  }

  // Notificação por e-mail da devolutiva se solicitado
  var emails = aval.emails || [];
  if (!emails.length) {
    // Busca e-mails do projeto na aba Visao-geral
    var abaProj = ss.getSheetByName(CONFIG.ABA_PROJETOS);
    if (abaProj) {
      var dProj = abaProj.getDataRange().getValues();
      for (var k = 1; k < dProj.length; k++) {
        if (parseInt(dProj[k][0], 10) === idProj) {
          emails = String(dProj[k][9] || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
          break;
        }
      }
    }
  }

  if (CONFIG.NOTIFICAR_EMAIL && aval.notificarEmail !== false && emails.length > 0) {
    var assunto = '[' + CONFIG.DISCIPLINA_CURTA + ' AVALIAÇÃO] ' + instrumento + ' — ' + (aval.equipe || ('Projeto #' + idProj)) + ' (Nota: ' + notaNum.toFixed(1) + ')';
    var html = montarHtmlEmailICE_({
      tipo: 'avaliacao',
      corCabecalho: '#059669',
      tituloCabecalho: 'Avaliação & Devolutiva Formativa',
      subtituloCabecalho: 'Parecer da equipe docente sobre o andamento do seu artigo científico',
      id: idProj,
      titulo: aval.titulo || ('Projeto #' + idProj),
      trilha: aval.trilha || 'Iniciação Científica e Extensionista',
      integrantes: aval.equipe || '',
      checkpoint: instrumento,
      destinatarioNome: aval.equipe || '',
      mensagemExtra: '<strong>Instrumento:</strong> ' + instrumento + '<br>' +
        '<strong>Nota Atribuída:</strong> ' + notaNum.toFixed(1) + ' / 10,0<br>' +
        '<strong>Parecer do Professor:</strong> ' + (aval.feedback || 'Avaliação formativa registrada com sucesso.')
    });

    emails.forEach(function (to) {
      try {
        GmailApp.sendEmail(to, assunto, 'Avaliação da entrega: ' + CONFIG.DASHBOARD_URL, {
          htmlBody: html,
          name: CONFIG.NOME_REMETENTE
        });
      } catch (e) {}
    });
  }

  return { ok: true, mensagem: 'Avaliação registrada e notificada com sucesso!' };
}

/**
 * Lê todas as avaliações formativas cadastradas.
 */
function lerAvaliacoes_() {
  var ss = obterPlanilha_();
  var aba = ss.getSheetByName('Avaliacoes');
  if (!aba) return [];

  var valores = aba.getDataRange().getValues();
  if (valores.length < 2) return [];

  var resultado = [];
  for (var i = 1; i < valores.length; i++) {
    var l = valores[i];
    if (!l[0]) continue;
    resultado.push({
      id: String(l[0]),
      data: String(l[1]),
      projetoId: parseInt(l[2], 10),
      equipe: String(l[3]),
      instrumento: String(l[4]),
      nota: Number(l[5]),
      feedback: String(l[6]),
      avaliador: String(l[7])
    });
  }
  return resultado;
}

/**
 * Salva ou atualiza um recado/demanda no Mural da disciplina.
 */
function salvarRecado_(r, usuario) {
  var ss = obterPlanilha_();
  var aba = garantirAba_(ss, 'Recados', CAB_RECADOS);
  formatarAbaCabecalho_(aba);

  var id = r.id || ('REC-' + new Date().getTime());
  var agora = new Date().toLocaleString('pt-BR');
  var autorNome = usuario.nome || r.autorNome || r.autor_nome || 'Estudante';
  var autorEmail = (usuario.email || r.autorEmail || r.autor_email || '').toLowerCase().trim();
  var papel = usuario.papel || r.papel || 'aluno';
  var tipoDest = (r.tipoDestinatario || r.tipo_destinatario) === 'equipe' ? 'equipe' : 'geral';
  var projAlvo = tipoDest === 'equipe' ? (parseInt(r.projetoIdAlvo || r.projeto_id_alvo, 10) || '') : '';
  var equipeAlvo = tipoDest === 'equipe' ? (r.equipeAlvo || r.equipe_alvo || ('Projeto #' + projAlvo)) : 'Toda a Turma';
  var titulo = String(r.titulo || 'Sem título').trim();
  var conteudo = String(r.conteudo || r.descricao || '').trim();
  var categoria = r.categoria || 'aviso';
  var linkApoio = String(r.linkApoio || r.link_apoio || '').trim();
  var fixado = (papel === 'docente' && !!r.fixado) ? true : false;
  var status = 'ativo';

  var linha = [
    id, agora, autorNome, autorEmail, papel, tipoDest,
    projAlvo, equipeAlvo, titulo, conteudo, categoria, linkApoio, fixado, status
  ];

  aba.appendRow(linha);

  // Disparo opcional de notificação por e-mail
  if (r.notificarEmail && CONFIG.NOTIFICAR_EMAIL) {
    try {
      var assunto = '[' + CONFIG.DISCIPLINA_CURTA + ' MURAL] ' + (tipoDest === 'equipe' ? '[Recado Direcionado] ' : '') + titulo;
      var destinatarios = [];

      if (tipoDest === 'equipe' && projAlvo) {
        var abaProj = ss.getSheetByName(CONFIG.ABA_PROJETOS);
        if (abaProj) {
          var dP = abaProj.getDataRange().getValues();
          for (var k = 1; k < dP.length; k++) {
            if (parseInt(dP[k][0], 10) === projAlvo) {
              destinatarios = String(dP[k][9] || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
              break;
            }
          }
        }
      } else if (papel === 'docente') {
        var abaProj2 = ss.getSheetByName(CONFIG.ABA_PROJETOS);
        if (abaProj2) {
          var dP2 = abaProj2.getDataRange().getValues();
          for (var j = 1; j < dP2.length; j++) {
            var ems = String(dP2[j][9] || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
            ems.forEach(function (e) { if (destinatarios.indexOf(e) === -1) destinatarios.push(e); });
          }
        }
      }

      if (destinatarios.length > 0) {
        var htmlMsg = montarHtmlEmailICE_({
          tipo: 'mural',
          corCabecalho: papel === 'docente' ? '#f59e0b' : '#16a34a',
          tituloCabecalho: 'Novo Recado no Mural da Disciplina',
          subtituloCabecalho: tipoDest === 'equipe' ? ('Recado direcionado para ' + equipeAlvo) : 'Recado geral para toda a turma',
          id: id,
          titulo: titulo,
          trilha: categoria,
          integrantes: equipeAlvo,
          destinatarioNome: equipeAlvo,
          mensagemExtra: '<strong>Postado por:</strong> ' + autorNome + '<br><br>' + conteudo.replace(/\n/g, '<br>') + (linkApoio ? ('<br><br><strong>Link de Apoio:</strong> <a href="' + linkApoio + '">' + linkApoio + '</a>') : '')
        });

        destinatarios.forEach(function (to) {
          try {
            GmailApp.sendEmail(to, assunto, conteudo + '\n\nAcesse o Mural: ' + CONFIG.DASHBOARD_URL, {
              htmlBody: htmlMsg,
              name: CONFIG.NOME_REMETENTE
            });
          } catch (e) {}
        });
      }
    } catch (errNotif) {
      Logger.log('Erro ao enviar e-mail do mural: ' + errNotif);
    }
  }

  return {
    ok: true,
    mensagem: 'Recado publicado com sucesso no Mural!',
    recado: {
      id: id,
      dataHora: agora,
      autorNome: autorNome,
      autorEmail: autorEmail,
      papel: papel,
      tipoDestinatario: tipoDest,
      projetoIdAlvo: projAlvo,
      equipeAlvo: equipeAlvo,
      titulo: titulo,
      conteudo: conteudo,
      categoria: categoria,
      linkApoio: linkApoio,
      fixado: fixado,
      status: status
    }
  };
}

/**
 * Exclui um recado do Mural (docente ou próprio autor).
 */
function excluirRecado_(idAlvo, usuario) {
  if (!idAlvo) throw new Error('ID do recado inválido.');
  var ss = obterPlanilha_();
  var aba = ss.getSheetByName('Recados');
  if (!aba) throw new Error('Aba Recados não encontrada.');

  var valores = aba.getDataRange().getValues();
  var linhaAlvo = -1;
  var autorRecado = '';

  for (var i = 1; i < valores.length; i++) {
    if (String(valores[i][0]) === String(idAlvo)) {
      linhaAlvo = i + 1;
      autorRecado = String(valores[i][3] || '').toLowerCase().trim();
      break;
    }
  }

  if (linhaAlvo === -1) {
    throw new Error('Recado ' + idAlvo + ' não foi encontrado.');
  }

  var isDocente = usuario && usuario.papel === 'docente';
  var isAutor = usuario && usuario.email && usuario.email.toLowerCase().trim() === autorRecado;

  if (!isDocente && !isAutor) {
    throw new Error('Acesso negado: você só pode excluir recados criados por você mesmo.');
  }

  aba.deleteRow(linhaAlvo);
  return { ok: true, mensagem: 'Recado excluído com sucesso do mural.' };
}

/**
 * Lê todos os recados cadastrados na aba Recados.
 */
function lerRecados_() {
  var ss = obterPlanilha_();
  var aba = ss.getSheetByName('Recados');
  if (!aba) {
    aba = ss.insertSheet('Recados');
    aba.appendRow(CAB_RECADOS);
    formatarAbaCabecalho_(aba);
    var agora = new Date().toLocaleString('pt-BR');
    aba.appendRow([
      'REC-INICIAL-01', agora, 'Prof. André Moraes', 'andre.moraes@ifsc.edu.br', 'docente',
      'geral', '', 'Toda a Turma',
      'Boas-vindas ao Mural de Recados & Articulação Científica!',
      'Este é o canal oficial de comunicação assíncrona da disciplina. Aqui compartilhamos avisos de aula, links de pesquisas, dúvidas entre equipes e demandas de orientação para o COTB.',
      'aviso', '', true, 'ativo'
    ]);
  }

  var valores = aba.getDataRange().getValues();
  if (valores.length < 2) return [];

  var resultado = [];
  for (var i = 1; i < valores.length; i++) {
    var l = valores[i];
    if (!l[0]) continue;
    resultado.push({
      id: String(l[0]),
      dataHora: String(l[1]),
      autorNome: String(l[2]),
      autorEmail: String(l[3]),
      papel: String(l[4]),
      tipoDestinatario: String(l[5]),
      projetoIdAlvo: l[6] ? parseInt(l[6], 10) : null,
      equipeAlvo: String(l[7]),
      titulo: String(l[8]),
      conteudo: String(l[9]),
      categoria: String(l[10]),
      linkApoio: String(l[11]),
      fixado: String(l[12]).toLowerCase() === 'true' || l[12] === true,
      status: String(l[13] || 'ativo')
    });
  }
  return resultado;
}

/**
 * Retorna lista consolidada de e-mails de docentes autorizados (CONFIG + aba membros).
 */
function obterListaDocentes_(ss) {
  var lista = CONFIG.DOCENTES.slice();
  try {
    if (!ss) ss = obterPlanilha_();
    var aba = ss.getSheetByName('membros');
    if (aba && aba.getLastRow() >= 2) {
      var valores = aba.getDataRange().getValues();
      for (var i = 1; i < valores.length; i++) {
        var email = String(valores[i][0] || '').toLowerCase().trim();
        var papel = String(valores[i][3] || '').toLowerCase().trim();
        var status = String(valores[i][4] || '').toLowerCase().trim();
        if (email && papel === 'docente' && (status === 'ativo' || status === 'substituto' || status === 'temporario')) {
          if (lista.indexOf(email) === -1) {
            lista.push(email);
          }
        }
      }
    }
  } catch (e) {
    Logger.log('Aviso ao consultar docentes na aba membros: ' + e);
  }
  return lista;
}

/**
 * Lê todos os docentes cadastrados na aba membros e complementa com os titulares.
 */
function lerDocentes_() {
  var ss = obterPlanilha_();
  var aba = ss.getSheetByName('membros');
  var resultado = [];
  var vistos = {};

  var docentesPadrao = [
    {
      nome: 'Prof. Dr. André Moraes',
      email: 'andre.moraes@ifsc.edu.br',
      tipo: 'titular',
      status: 'ativo',
      periodo: 'Semestre 2026/2 (Titular)',
      observacao: 'Docente titular responsável pelo laboratório e submissão COTB'
    },
    {
      nome: 'Prof. Me. Adalberto Tabalipa',
      email: 'adalberto.tabalipa@ifsc.edu.br',
      tipo: 'titular',
      status: 'ativo',
      periodo: 'Semestre 2026/2 (Titular)',
      observacao: 'Docente titular responsável pela fundamentação metodológica e Lattes'
    },
    {
      nome: 'Prof. Alberto Barros',
      email: 'alberto.barros@ifsc.edu.br',
      tipo: 'substituto',
      status: 'ativo',
      periodo: 'Sextas-feiras (2 semanas)',
      observacao: 'Docente orientador substituto com acesso administrativo total ao dashboard'
    },
    {
      nome: 'Prof. André Moraes (Pessoal / Testes)',
      email: 'chameoandre@gmail.com',
      tipo: 'titular',
      status: 'ativo',
      periodo: 'Acesso Administrativo',
      observacao: 'Conta para testes de contingência'
    }
  ];

  if (aba && aba.getLastRow() >= 2) {
    var valores = aba.getDataRange().getValues();
    for (var i = 1; i < valores.length; i++) {
      var email = String(valores[i][0] || '').toLowerCase().trim();
      var nome = String(valores[i][1] || '');
      var tipoPeriodo = String(valores[i][2] || '');
      var papel = String(valores[i][3] || '').toLowerCase().trim();
      var status = String(valores[i][4] || 'ativo').toLowerCase().trim();

      if (papel === 'docente' && email) {
        var tipo = 'substituto';
        var periodo = tipoPeriodo;
        if (tipoPeriodo.indexOf('titular') !== -1 || email === 'andre.moraes@ifsc.edu.br' || email === 'adalberto.tabalipa@ifsc.edu.br') {
          tipo = 'titular';
        } else if (tipoPeriodo.indexOf('coorientador') !== -1) {
          tipo = 'coorientador';
        }

        vistos[email] = true;
        resultado.push({
          nome: nome || email.split('@')[0],
          email: email,
          tipo: tipo,
          status: status || 'ativo',
          periodo: periodo || (tipo === 'titular' ? 'Semestre 2026/2' : 'Temporário'),
          observacao: 'Cadastrado no sistema'
        });
      }
    }
  }

  docentesPadrao.forEach(function (dp) {
    if (!vistos[dp.email]) {
      resultado.push(dp);
    }
  });

  return resultado;
}

/**
 * Cadastra ou atualiza um docente orientador na aba membros.
 */
function salvarDocente_(doc, usuario) {
  if (!doc || !doc.email) {
    throw new Error('E-mail institucional do docente orientador é obrigatório.');
  }

  var email = String(doc.email).toLowerCase().trim();
  var nome = String(doc.nome || email.split('@')[0]);
  var tipo = String(doc.tipo || 'substituto');
  var periodo = String(doc.periodo || '');
  var status = String(doc.status || 'ativo');
  var agora = new Date().toISOString();

  var ss = obterPlanilha_();
  var aba = garantirAba_(ss, 'membros', CAB_MEMBROS);
  var valores = aba.getDataRange().getValues();
  var linhaAtualizada = -1;

  for (var i = 1; i < valores.length; i++) {
    var emailLinha = String(valores[i][0] || '').toLowerCase().trim();
    if (emailLinha === email) {
      linhaAtualizada = i + 1;
      break;
    }
  }

  var tipoPeriodo = tipo + (periodo ? ': ' + periodo : '');

  if (linhaAtualizada > 0) {
    aba.getRange(linhaAtualizada, 2).setValue(nome);
    aba.getRange(linhaAtualizada, 3).setValue(tipoPeriodo);
    aba.getRange(linhaAtualizada, 4).setValue('docente');
    aba.getRange(linhaAtualizada, 5).setValue(status);
  } else {
    aba.appendRow([email, nome, tipoPeriodo, 'docente', status, agora]);
  }

  return {
    ok: true,
    mensagem: 'Docente orientador ' + nome + ' (' + email + ') salvo com sucesso!',
    docente: {
      nome: nome,
      email: email,
      tipo: tipo,
      status: status,
      periodo: periodo,
      observacao: doc.observacao || ''
    }
  };
}

/**
 * Remove um docente orientador da aba membros (impede remoção do titular).
 */
function removerDocente_(emailDoc, usuario) {
  if (!emailDoc) throw new Error('E-mail não informado');
  var email = String(emailDoc).toLowerCase().trim();
  if (email === 'andre.moraes@ifsc.edu.br') {
    throw new Error('O docente titular Prof. André Moraes não pode ser removido.');
  }

  var ss = obterPlanilha_();
  var aba = ss.getSheetByName('membros');
  if (aba && aba.getLastRow() >= 2) {
    var valores = aba.getDataRange().getValues();
    for (var i = valores.length - 1; i >= 1; i--) {
      var em = String(valores[i][0] || '').toLowerCase().trim();
      var pap = String(valores[i][3] || '').toLowerCase().trim();
      if (em === email && pap === 'docente') {
        aba.deleteRow(i + 1);
      }
    }
  }
  return { ok: true, mensagem: 'Docente orientador ' + email + ' removido com sucesso.' };
}

/**
 * Dispara lembrete individual via requisição web (Painel Docente).
 */
function dispararLembreteDuplaIndividual_(idProj, tipo, usuario) {
  var idNum = parseInt(idProj, 10);
  var ss = obterPlanilha_();
  var aba = ss.getSheetByName(CONFIG.ABA_PROJETOS);
  var valores = aba.getDataRange().getValues();

  for (var i = 1; i < valores.length; i++) {
    if (parseInt(valores[i][0], 10) === idNum) {
      var p = {
        id: idNum,
        titulo: valores[i][1],
        integrantes: valores[i][2],
        trilha: valores[i][3],
        overleaf: valores[i][5],
        checkpoint: valores[i][7],
        emails: String(valores[i][9] || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean)
      };

      if (!p.emails.length) throw new Error('A dupla não possui e-mails cadastrados.');

      var assunto = '[' + CONFIG.DISCIPLINA_CURTA + ' LEMBRETE] ' + (tipo === 'overleaf' ? 'Link do Overleaf Pendente' : 'Andamento do Checkpoint 2') + ' — ' + p.integrantes;
      var html = montarHtmlEmailICE_({
        tipo: 'lembrete',
        corCabecalho: tipo === 'overleaf' ? '#dc2626' : '#d97706',
        tituloCabecalho: tipo === 'overleaf' ? 'Lembrete: Link do Overleaf Pendente' : 'Lembrete de Andamento: Checkpoint 2',
        subtituloCabecalho: 'Alinhamento prático com a coordenação docente',
        id: idNum,
        titulo: p.titulo,
        trilha: p.trilha,
        integrantes: p.integrantes,
        checkpoint: p.checkpoint,
        overleaf: p.overleaf,
        destinatarioNome: p.integrantes,
        mensagemExtra: tipo === 'overleaf'
          ? 'Por favor, criem ou abram o projeto no Overleaf (Roteiro 01) e registrem o link de leitura no Painel de Equipes do Dashboard para mentoria contínua.'
          : 'Lembrem-se de concluir a Oficina Integrada (Roteiro 03): gerar os gráficos no Colab e inseri-los no <code>main.tex</code> do Overleaf com a tabela de resultados.'
      });

      p.emails.forEach(function (to) {
        try {
          GmailApp.sendEmail(to, assunto, 'Lembrete docente: ' + CONFIG.DASHBOARD_URL, {
            htmlBody: html,
            name: CONFIG.NOME_REMETENTE
          });
        } catch (e) {}
      });

      return { ok: true, mensagem: 'Lembrete disparado com sucesso para ' + p.emails.length + ' estudante(s)!' };
    }
  }

  throw new Error('Projeto #' + idNum + ' não encontrado.');
}

/**
 * Dispara cobrança em massa de links de Overleaf ausentes (Painel Docente).
 */
function cobrarOverleafEmMassaDireto_() {
  var ss = obterPlanilha_();
  var aba = ss.getSheetByName(CONFIG.ABA_PROJETOS);
  var valores = aba.getDataRange().getValues();
  var total = 0;

  for (var i = 1; i < valores.length; i++) {
    var l = valores[i];
    var overleaf = String(l[5] || '').trim();
    if (!overleaf || overleaf.indexOf('http') === -1) {
      var id = l[0];
      var emails = String(l[9] || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
      if (emails.length > 0) {
        var assunto = '[' + CONFIG.DISCIPLINA_CURTA + ' PENDÊNCIA] Link do Overleaf Ausente — Projeto #' + id;
        var html = montarHtmlEmailICE_({
          tipo: 'cobranca_overleaf',
          corCabecalho: '#dc2626',
          tituloCabecalho: 'Cadastro Pendente: Link do Overleaf',
          subtituloCabecalho: 'Precisamos do link de leitura do Overleaf para mentoria do seu artigo',
          id: id,
          titulo: l[1],
          trilha: l[3],
          integrantes: l[2],
          checkpoint: l[7],
          destinatarioNome: l[2],
          mensagemExtra: 'Identificamos que a sua dupla ainda não cadastrou o <strong>link de leitura do Overleaf</strong> no Painel de Equipes. Acesse o Dashboard e clique em <em>Editar Ficha</em> para colar o link do projeto gerado a partir do Roteiro 01.'
        });

        emails.forEach(function (to) {
          try {
            GmailApp.sendEmail(to, assunto, 'Link do Overleaf pendente: ' + CONFIG.DASHBOARD_URL, {
              htmlBody: html,
              name: CONFIG.NOME_REMETENTE
            });
            total++;
          } catch (e) {}
        });
      }
    }
  }

  return { ok: true, total: total, mensagem: 'Cobrança enviada para ' + total + ' estudante(s) com Overleaf pendente!' };
}

/**
 * Dispara lembrete em massa do Checkpoint 2 para todas as duplas cadastradas.
 */
function dispararLembreteTurmaCheckpoint2Direto_() {
  var ss = obterPlanilha_();
  var aba = ss.getSheetByName(CONFIG.ABA_PROJETOS);
  var valores = aba.getDataRange().getValues();
  var total = 0;

  for (var i = 1; i < valores.length; i++) {
    var l = valores[i];
    var id = l[0];
    var emails = String(l[9] || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
    if (emails.length > 0) {
      var assunto = '[' + CONFIG.DISCIPLINA_CURTA + ' LEMBRETE GERAL] Checkpoint 2: Dados no Colab & Overleaf — Projeto #' + id;
      var html = montarHtmlEmailICE_({
        tipo: 'lembrete',
        corCabecalho: '#d97706',
        tituloCabecalho: 'Lembrete de Andamento: Checkpoint 2',
        subtituloCabecalho: 'Alinhamento prático para a elaboração do artigo científico (COTB 2027)',
        id: id,
        titulo: l[1],
        trilha: l[3],
        integrantes: l[2],
        checkpoint: l[7],
        overleaf: l[5],
        destinatarioNome: l[2],
        mensagemExtra: 'Olá! A equipe docente está acompanhando a evolução dos projetos. Lembrem-se de concluir a <strong>Oficina Integrada (Roteiro 03)</strong>: gerar os gráficos no Colab e inseri-los no <code>main.tex</code> do Overleaf com a tabela de resultados.'
      });

      emails.forEach(function (to) {
        try {
          GmailApp.sendEmail(to, assunto, 'Lembrete de Checkpoint 2 para o projeto #' + id + ': ' + CONFIG.DASHBOARD_URL, {
            htmlBody: html,
            name: CONFIG.NOME_REMETENTE
          });
          total++;
        } catch (e) {}
      });
    }
  }

  return { ok: true, total: total, mensagem: 'Lembrete do Checkpoint 2 disparado para ' + total + ' estudante(s)!' };
}

/**
 * Cria ou retorna uma aba na planilha com cabeçalhos padronizados.
 */
function garantirAba_(ss, nome, cabecalhos) {
  var aba = ss.getSheetByName(nome);
  if (!aba) {
    aba = ss.insertSheet(nome);
    if (cabecalhos && cabecalhos.length > 0) {
      aba.appendRow(cabecalhos);
    }
  }
  return aba;
}

/**
 * Formata visualmente os cabeçalhos de uma aba com estilo verde IFSC.
 */
function formatarAbaCabecalho_(aba) {
  if (!aba) return;
  try {
    var range = aba.getRange(1, 1, 1, aba.getLastColumn() || 10);
    range.setBackground('#16a34a')
         .setFontColor('#ffffff')
         .setFontWeight('bold')
         .setHorizontalAlignment('center');
    aba.setFrozenRows(1);
  } catch (e) {}
}

/**
 * Estima o percentual de progresso com base no Checkpoint atual.
 */
function calcularProgresso_(cp) {
  if (!cp) return 25;
  if (cp.indexOf('4') !== -1) return 100;
  if (cp.indexOf('3') !== -1) return 75;
  if (cp.indexOf('2') !== -1) return 50;
  return 25;
}

/**
 * Função utilitária de instalação:
 * Cria do ZERO a planilha oficial no Google Drive com abas, formatação e dados iniciais!
 */
function instalar() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID') || CONFIG.SHEET_ID;
  var ss = null;

  if (id) {
    try {
      ss = SpreadsheetApp.openById(id);
    } catch (e) {
      ss = null;
    }
  }

  var foiCriadaAgora = false;
  if (!ss) {
    ss = SpreadsheetApp.create('ICE-2026-2 — Iniciação Científica e Extensionista (IFSC Garopaba)');
    props.setProperty('SHEET_ID', ss.getId());
    foiCriadaAgora = true;

    try {
      var driveFile = DriveApp.getFileById(ss.getId());
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      Logger.log('Nota: Compartilhamento automático no Drive: ' + e);
    }
  }

  var abaProjetos = garantirAba_(ss, CONFIG.ABA_PROJETOS, CAB_PROJETOS);
  var abaMembros = garantirAba_(ss, 'membros', CAB_MEMBROS);
  garantirAba_(ss, 'alteracoes', CAB_ALTERACOES);

  formatarAbaCabecalho_(abaProjetos);
  formatarAbaCabecalho_(abaMembros);

  // Se a aba de projetos estiver vazia, insere os 4 projetos padrão de demonstração
  if (abaProjetos.getLastRow() < 2) {
    DADOS_INICIAIS_PADRAO.forEach(function (p) {
      abaProjetos.appendRow([
        p.id,
        p.titulo,
        p.integrantes,
        p.trilha,
        p.objetivo,
        p.overleaf,
        p.github,
        p.checkpoint,
        p.avancos,
        (p.emails || []).join(', ')
      ]);
    });
  }

  // Se a aba de membros estiver vazia, cadastra os docentes com acesso total
  if (abaMembros.getLastRow() < 2) {
    var agora = new Date().toISOString();
    CONFIG.DOCENTES.forEach(function (emailDoc) {
      abaMembros.appendRow([emailDoc, 'Docente Responsável', '*', 'docente', 'ativo', agora]);
    });
  }

  // Remove aba padrão inicial se houver
  var defaultSheet = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1') || ss.getSheetByName('Planilha1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {}
  }

  var msgLog = '\n' +
    '========================================================================\n' +
    (foiCriadaAgora ? '✨ PLANILHA CRIADA COM SUCESSO NO SEU GOOGLE DRIVE!\n' : '✅ PLANILHA CONFIGURADA COM SUCESSO!\n') +
    '------------------------------------------------------------------------\n' +
    'Título: ' + ss.getName() + '\n' +
    'ID da Planilha: ' + ss.getId() + '\n' +
    'URL da Planilha: ' + ss.getUrl() + '\n' +
    '========================================================================\n' +
    '👉 PRÓXIMO PASSO:\n' +
    '1. No arquivo 2026-2/ice-config.js do repositório, preencha sheetId:\n' +
    '   sheetId: \'' + ss.getId() + '\'\n' +
    '2. No menu "Implantar" > "Nova implantação" > escolha "Aplicativo da Web".\n' +
    '3. Cole a URL /exec gerada no campo apiUrl de 2026-2/ice-config.js.\n' +
    '========================================================================\n';

  Logger.log(msgLog);
  return ss.getUrl();
}

/**
 * Retorna resposta formatada em JSON com cabeçalhos adequados.
 */
function respostaJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// SISTEMA DE NOTIFICAÇÕES POR E-MAIL EM HTML RICO (PADRÃO PROGWEB 2 / IFSC)
// ============================================================================

/**
 * Notifica docentes e a própria dupla quando uma nova proposta é cadastrada.
 */
function enviarEmailCandidaturaDupla_(ss, p, usuario) {
  var emailsDupla = p.emails || [];
  var titulo = p.titulo || 'Proposta sem Título';
  var id = p.id;
  var autorNome = (usuario && usuario.nome) ? usuario.nome : 'Estudante';
  var autorEmail = (usuario && usuario.email) ? usuario.email : '';

  // 1. E-mail de confirmação para a Dupla
  var assuntoAluno = '[' + CONFIG.DISCIPLINA_CURTA + '] Confirmação de Proposta #' + id + ': ' + titulo;
  var htmlAluno = montarHtmlEmailICE_({
    tipo: 'candidatura_aluno',
    corCabecalho: '#16a34a',
    tituloCabecalho: 'Confirmação de Registro de Proposta',
    subtituloCabecalho: 'Sua pesquisa foi registrada no Dashboard de Iniciação Científica e Extensionista',
    id: id,
    titulo: titulo,
    trilha: p.trilha,
    integrantes: p.integrantes,
    objetivo: p.objetivo,
    overleaf: p.overleaf,
    github: p.github,
    checkpoint: p.checkpoint,
    destinatarioNome: p.integrantes,
    mensagemExtra: 'Parabéns pela submissão da proposta! O próximo passo consiste na execução da <strong>Oficina Integrada (Roteiro 03)</strong> para gerar os dados pilotos no Colab e iniciar a escrita do artigo no Overleaf.'
  });

  emailsDupla.forEach(function (to) {
    try {
      GmailApp.sendEmail(to, assuntoAluno, 'Sua proposta #' + id + ' foi cadastrada com sucesso no Dashboard: ' + CONFIG.DASHBOARD_URL, {
        htmlBody: htmlAluno,
        name: CONFIG.NOME_REMETENTE
      });
    } catch (e) {
      Logger.log('Erro ao enviar e-mail de confirmação para ' + to + ': ' + e);
    }
  });

  // 2. E-mail de notificação para a Equipe Docente
  var assuntoDocente = '[' + CONFIG.DISCIPLINA_CURTA + ' NOVA DUPLA] #' + id + ' — ' + p.integrantes + ' (' + p.trilha.split(':')[0] + ')';
  var htmlDocente = montarHtmlEmailICE_({
    tipo: 'candidatura_docente',
    corCabecalho: '#0284c7',
    tituloCabecalho: 'Nova Dupla / Proposta Registrada',
    subtituloCabecalho: 'Um novo grupo se candidatou ou registrou proposta de pesquisa no Dashboard',
    id: id,
    titulo: titulo,
    trilha: p.trilha,
    integrantes: p.integrantes,
    objetivo: p.objetivo,
    overleaf: p.overleaf,
    github: p.github,
    checkpoint: p.checkpoint,
    destinatarioNome: 'Equipe Docente',
    mensagemExtra: 'Registrado por: <strong>' + autorNome + '</strong> (' + autorEmail + ').'
  });

  CONFIG.DOCENTES.forEach(function (docEmail) {
    try {
      GmailApp.sendEmail(docEmail, assuntoDocente, 'Nova proposta #' + id + ' registrada por ' + p.integrantes + '. Acesse o Dashboard: ' + CONFIG.DASHBOARD_URL, {
        htmlBody: htmlDocente,
        name: CONFIG.NOME_REMETENTE
      });
    } catch (e) {
      Logger.log('Erro ao enviar notificação docente para ' + docEmail + ': ' + e);
    }
  });
}

/**
 * Notifica quando uma dupla atualiza o link do Overleaf ou avança no Checkpoint.
 */
function enviarEmailAtualizacaoFicha_(ss, p, usuario, diff) {
  var emails = p.emails || [];
  var id = p.id;
  var titulo = p.titulo;
  var autor = (usuario && usuario.nome) ? usuario.nome : 'Estudante';

  var assunto = '[' + CONFIG.DISCIPLINA_CURTA + ' ATUALIZAÇÃO] Projeto #' + id + ' — ' + p.integrantes;
  var detalhes = [];
  if (diff.mudouOverleaf) {
    detalhes.push('🔗 <strong>Link do Overleaf Atualizado:</strong> <a href="' + p.overleaf + '">' + p.overleaf + '</a>');
  }
  if (diff.mudouCheckpoint) {
    detalhes.push('📍 <strong>Novo Checkpoint:</strong> ' + p.checkpoint + ' (Anterior: ' + (diff.checkpointAnterior || '—') + ')');
  }

  var html = montarHtmlEmailICE_({
    tipo: 'atualizacao',
    corCabecalho: '#7c3aed',
    tituloCabecalho: 'Ficha de Pesquisa Atualizada',
    subtituloCabecalho: 'Houve atualização nos links ou no avanço do artigo científico',
    id: id,
    titulo: titulo,
    trilha: p.trilha,
    integrantes: p.integrantes,
    objetivo: p.objetivo,
    overleaf: p.overleaf,
    github: p.github,
    checkpoint: p.checkpoint,
    destinatarioNome: p.integrantes,
    mensagemExtra: 'Atualização feita por <strong>' + autor + '</strong>.<br>' + detalhes.join('<br>')
  });

  // Envia para os alunos da dupla
  emails.forEach(function (to) {
    try {
      GmailApp.sendEmail(to, assunto, 'Sua ficha de pesquisa #' + id + ' foi atualizada no Dashboard: ' + CONFIG.DASHBOARD_URL, {
        htmlBody: html,
        name: CONFIG.NOME_REMETENTE
      });
    } catch (e) {}
  });

  // Notifica também os professores
  CONFIG.DOCENTES.forEach(function (doc) {
    try {
      GmailApp.sendEmail(doc, assunto, 'Ficha #' + id + ' atualizada por ' + autor + ': ' + CONFIG.DASHBOARD_URL, {
        htmlBody: html,
        name: CONFIG.NOME_REMETENTE
      });
    } catch (e) {}
  });
}

/**
 * Constrói o HTML estruturado e elegante para todos os e-mails da disciplina.
 */
function montarHtmlEmailICE_(params) {
  var corCabecalho = params.corCabecalho || '#16a34a';
  var overleafBtn = params.overleaf
    ? '<a href="' + params.overleaf + '" style="display:inline-block;padding:8px 14px;background:#15803d;color:#ffffff;text-decoration:none;border-radius:5px;font-size:12px;font-weight:bold;margin-right:8px;">Abrir no Overleaf</a>'
    : '<span style="color:#d97706;font-size:12px;">⚠️ Link do Overleaf ainda não cadastrado</span>';

  return '<!DOCTYPE html>' +
    '<html><head><meta charset="UTF-8"></head><body style="margin:0;padding:20px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">' +
    '<div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.06);">' +

    // Header
    '<div style="background:' + corCabecalho + ';padding:24px 28px;color:#ffffff;">' +
      '<div style="font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;opacity:0.9;margin-bottom:6px;">IFSC Câmpus Garopaba • CST Sistemas para a Internet</div>' +
      '<h1 style="margin:0;font-size:20px;font-weight:700;line-height:1.3;">' + params.tituloCabecalho + '</h1>' +
      '<p style="margin:6px 0 0;font-size:13px;opacity:0.92;">' + params.subtituloCabecalho + '</p>' +
    '</div>' +

    // Corpo
    '<div style="padding:26px 28px;">' +
      '<p style="margin:0 0 16px;font-size:14px;line-height:1.5;">Olá, <strong>' + (params.destinatarioNome || 'Estudante') + '</strong>,</p>' +

      (params.mensagemExtra ? ('<div style="background:#f8fafc;border-left:4px solid ' + corCabecalho + ';padding:12px 16px;border-radius:4px;margin-bottom:20px;font-size:13px;line-height:1.5;color:#334155;">' + params.mensagemExtra + '</div>') : '') +

      // Box do Projeto
      '<div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:8px;padding:18px;margin-bottom:22px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<span style="background:#e0f2fe;color:#0369a1;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:bold;">Projeto #' + params.id + '</span>' +
          '<span style="background:#dcfce7;color:#15803d;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:bold;">' + params.checkpoint + '</span>' +
        '</div>' +
        '<h3 style="margin:4px 0 8px;font-size:16px;color:#0f172a;line-height:1.4;">' + params.titulo + '</h3>' +
        '<p style="margin:0 0 10px;font-size:12px;color:#64748b;"><strong>Trilha:</strong> ' + params.trilha + '</p>' +
        '<p style="margin:0 0 10px;font-size:12px;color:#64748b;"><strong>Integrantes:</strong> ' + params.integrantes + '</p>' +
        (params.objetivo ? ('<p style="margin:0 0 14px;font-size:12px;color:#475569;line-height:1.4;"><strong>Objetivo:</strong> ' + params.objetivo + '</p>') : '') +
        '<div style="padding-top:10px;border-top:1px dashed #e2e8f0;">' + overleafBtn + '</div>' +
      '</div>' +

      // Botão de Ação Direta
      '<div style="text-align:center;margin:24px 0 16px;">' +
        '<a href="' + CONFIG.DASHBOARD_URL + '" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.15);">' +
          'Acessar Dashboard da Disciplina' +
        '</a>' +
      '</div>' +
    '</div>' +

    // Rodapé
    '<div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;line-height:1.5;">' +
      'Iniciação Científica e Extensionista • 2º Semestre (60h / 30h CHCE)<br>' +
      'Prof. André Moraes e Prof. Adalberto Teodosio Tabalipa • IFSC Câmpus Garopaba' +
    '</div>' +

    '</div></body></html>';
}

// ============================================================================
// MANIPULADORES DE MENU NA PLANILHA (AÇÕES DOCENTES DIRETAS)
// ============================================================================

function menuDispararLembreteLinha_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getActiveSheet();
  if (aba.getName() !== CONFIG.ABA_PROJETOS) {
    SpreadsheetApp.getUi().alert('Por favor, selecione a linha da dupla na aba "' + CONFIG.ABA_PROJETOS + '".');
    return;
  }

  var linha = aba.getActiveRange().getRow();
  if (linha < 2) {
    SpreadsheetApp.getUi().alert('Selecione uma linha de dados (linha 2 em diante).');
    return;
  }

  var dados = aba.getRange(linha, 1, 1, 10).getValues()[0];
  var id = dados[0];
  var titulo = dados[1];
  var integrantes = dados[2];
  var trilha = dados[3];
  var overleaf = dados[5];
  var cp = dados[7];
  var emailsStr = dados[9];

  var emails = String(emailsStr || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
  if (!emails.length) {
    SpreadsheetApp.getUi().alert('A dupla da linha ' + linha + ' não possui e-mails cadastrados na coluna J.');
    return;
  }

  var assunto = '[' + CONFIG.DISCIPLINA_CURTA + ' LEMBRETE] Checkpoint 2: Dados no Colab & Overleaf — ' + integrantes;
  var html = montarHtmlEmailICE_({
    tipo: 'lembrete',
    corCabecalho: '#d97706',
    tituloCabecalho: 'Lembrete de Andamento: Checkpoint 2',
    subtituloCabecalho: 'Alinhamento prático para a elaboração do artigo científico (COTB 2027)',
    id: id,
    titulo: titulo,
    trilha: trilha,
    integrantes: integrantes,
    checkpoint: cp,
    overleaf: overleaf,
    destinatarioNome: integrantes,
    mensagemExtra: 'Olá! A equipe docente está acompanhando a evolução dos projetos. Lembrem-se de concluir a <strong>Oficina Integrada (Roteiro 03)</strong>: gerar os gráficos no Colab e inseri-los no <code>main.tex</code> do Overleaf com a tabela de resultados.'
  });

  var count = 0;
  emails.forEach(function (to) {
    try {
      GmailApp.sendEmail(to, assunto, 'Lembrete de Checkpoint 2 para o projeto #' + id + ': ' + CONFIG.DASHBOARD_URL, {
        htmlBody: html,
        name: CONFIG.NOME_REMETENTE
      });
      count++;
    } catch (e) {}
  });

  SpreadsheetApp.getUi().alert('Lembrete enviado com sucesso para ' + count + ' destinatário(s) da dupla!');
}

function menuCobrarOverleafPendentes_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(CONFIG.ABA_PROJETOS);
  var valores = aba.getDataRange().getValues();
  var enviadas = 0;

  for (var i = 1; i < valores.length; i++) {
    var l = valores[i];
    var overleaf = String(l[5] || '').trim();
    if (!overleaf || overleaf.indexOf('http') === -1) {
      var id = l[0];
      var titulo = l[1];
      var integrantes = l[2];
      var emails = String(l[9] || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);

      if (emails.length > 0) {
        var assunto = '[' + CONFIG.DISCIPLINA_CURTA + ' PENDÊNCIA] Link do Overleaf Ausente — Projeto #' + id;
        var html = montarHtmlEmailICE_({
          tipo: 'cobranca_overleaf',
          corCabecalho: '#dc2626',
          tituloCabecalho: 'Cadastro Pendente: Link do Overleaf',
          subtituloCabecalho: 'Precisamos do link de leitura do Overleaf para mentoria do seu artigo',
          id: id,
          titulo: titulo,
          trilha: l[3],
          integrantes: integrantes,
          checkpoint: l[7],
          destinatarioNome: integrantes,
          mensagemExtra: 'Identificamos que a sua dupla ainda não cadastrou o <strong>link de leitura do Overleaf</strong> no Painel de Equipes. Acesse o Dashboard e clique em <em>Editar Ficha</em> para colar o link do projeto gerado a partir do Roteiro 01.'
        });

        emails.forEach(function (to) {
          try {
            GmailApp.sendEmail(to, assunto, 'Por favor, cadastre o link do Overleaf do projeto #' + id + ': ' + CONFIG.DASHBOARD_URL, {
              htmlBody: html,
              name: CONFIG.NOME_REMETENTE
            });
            enviadas++;
          } catch (e) {}
        });
      }
    }
  }

  SpreadsheetApp.getUi().alert('Cobrança de Overleaf disparada para ' + enviadas + ' estudante(s) com link pendente!');
}

function menuEnviarComunicadoTurma_() {
  var ui = SpreadsheetApp.getUi();
  var respTitulo = ui.prompt('Comunicado Geral', 'Digite o Título do Comunicado:', ui.ButtonSet.OK_CANCEL);
  if (respTitulo.getSelectedButton() !== ui.Button.OK) return;

  var respMsg = ui.prompt('Comunicado Geral', 'Digite o Texto da Mensagem:', ui.ButtonSet.OK_CANCEL);
  if (respMsg.getSelectedButton() !== ui.Button.OK) return;

  var titulo = respTitulo.getResponseText().trim();
  var msg = respMsg.getResponseText().trim();

  var res = enviarComunicadoTurma_(titulo, msg, { nome: 'Prof. André Moraes' });
  ui.alert('Comunicado disparado com sucesso para ' + res.enviados + ' estudante(s)!');
}

function enviarComunicadoTurma_(titulo, mensagem, usuario) {
  var ss = obterPlanilha_();
  var aba = ss.getSheetByName(CONFIG.ABA_PROJETOS);
  var valores = aba.getDataRange().getValues();
  var todosEmails = [];

  for (var i = 1; i < valores.length; i++) {
    var emails = String(valores[i][9] || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
    emails.forEach(function (em) {
      if (todosEmails.indexOf(em) === -1) todosEmails.push(em);
    });
  }

  var assunto = '[' + CONFIG.DISCIPLINA_CURTA + ' COMUNICADO] ' + titulo;
  var html = '<!DOCTYPE html><html><body style="padding:20px;background:#f1f5f9;font-family:sans-serif;color:#1e293b;">' +
    '<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e2e8f0;">' +
    '<h2 style="color:#7c3aed;margin-top:0;">' + titulo + '</h2>' +
    '<p style="font-size:14px;line-height:1.6;color:#334155;">' + mensagem.replace(/\n/g, '<br>') + '</p>' +
    '<div style="margin-top:20px;padding-top:15px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">' +
    'Enviado pela Equipe Docente (' + (usuario.nome || 'Coordenação') + ') • <a href="' + CONFIG.DASHBOARD_URL + '">Dashboard ICE</a>' +
    '</div></div></body></html>';

  var count = 0;
  todosEmails.forEach(function (to) {
    try {
      GmailApp.sendEmail(to, assunto, mensagem + '\n\nDashboard: ' + CONFIG.DASHBOARD_URL, {
        htmlBody: html,
        name: CONFIG.NOME_REMETENTE
      });
      count++;
    } catch (e) {}
  });

  return { ok: true, enviados: count };
}

