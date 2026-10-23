/**
 * Iniciação Científica & Extensionista (CST Sistemas para a Internet - IFSC Garopaba)
 * Backend Google Apps Script para Gestão de Duplas e Artigos COTB.
 *
 * Implantação e instruções: apps-script/README-IMPLANTACAO.md
 */

var CONFIG = {
  // Planilha oficial de propostas (aba Visao-geral).
  // Se deixado vazio '', o script cria automaticamente a planilha no seu Google Drive ao rodar instalar()!
  SHEET_ID: '',
  ABA_PROJETOS: 'Visao-geral',

  // ID do cliente OAuth do Google Cloud
  GOOGLE_CLIENT_ID: '827223670130-f312ur39hg8bamvbce5noc0iaajq8b1a.apps.googleusercontent.com',

  // Docentes com acesso total irrestrito
  DOCENTES: [
    'andre.moraes@ifsc.edu.br',
    'adalberto.tabalipa@ifsc.edu.br',
    'chameoandre@gmail.com'
  ],

  // Domínios institucionais aceitos
  DOMINIOS_PERMITIDOS: ['ifsc.edu.br', 'aluno.ifsc.edu.br']
};

var CAB_PROJETOS = ['id', 'titulo', 'integrantes', 'trilha', 'objetivo', 'overleaf', 'github', 'checkpoint', 'avancos', 'emails'];
var CAB_MEMBROS = ['email', 'nome', 'projetos', 'papel', 'status', 'cadastrado_em'];
var CAB_ALTERACOES = ['data', 'projeto', 'email', 'autor', 'campo', 'valor_anterior', 'valor_novo'];

var DADOS_INICIAIS_PADRAO = [
  {
    id: 1,
    titulo: 'Análise de Dados de Turismo e Sazonalidade em Garopaba',
    trilha: 'Trilha 1: Ciência de Dados & Dados Abertos',
    integrantes: 'Estudante 1 & Estudante 2',
    emails: ['estudante1@aluno.ifsc.edu.br', 'estudante2@aluno.ifsc.edu.br'],
    objetivo: 'Coletar e estruturar dados públicos de fluxo turístico municipal para identificar correlações com a infraestrutura digital local.',
    overleaf: 'https://www.overleaf.com/read/exemplo-sbc-turismo',
    github: 'https://github.com/exemplo/turismo-dados-garopaba',
    checkpoint: 'Checkpoint 2: Estado da Arte & Python',
    avancos: 'Coleta de dados via API concluída; elaboração do script Python de gráficos.'
  },
  {
    id: 2,
    titulo: 'Auditoria de Acessibilidade Digital (WCAG) em Portais Públicos da AMUREL',
    trilha: 'Trilha 2: Acessibilidade & Usabilidade Web',
    integrantes: 'Estudante 3 & Estudante 4',
    emails: ['estudante3@aluno.ifsc.edu.br', 'estudante4@aluno.ifsc.edu.br'],
    objetivo: 'Avaliar a conformidade de acessibilidade e propor intervenções técnicas nos portais da região lagunar.',
    overleaf: 'https://www.overleaf.com/read/exemplo-sbc-acessibilidade',
    github: 'https://github.com/exemplo/auditoria-acessibilidade-amurel',
    checkpoint: 'Checkpoint 1: Tema & Lattes',
    avancos: 'Seleção das 10 páginas governamentais para auditoria automatizada.'
  },
  {
    id: 3,
    titulo: 'Detecção de Datilologia da Libras no Navegador com MediaPipe e Python',
    trilha: 'Trilha 3: Desempenho & Otimização Web',
    integrantes: 'Estudante 5 & Estudante 6',
    emails: ['estudante5@aluno.ifsc.edu.br', 'estudante6@aluno.ifsc.edu.br'],
    objetivo: 'Medir a latência (FPS) e acurácia de modelos web de visão computacional para o alfabeto da Libras em hardware de escolas públicas.',
    overleaf: 'https://www.overleaf.com/read/exemplo-sbc-libras',
    github: 'https://github.com/exemplo/libras-web-mediapipe',
    checkpoint: 'Checkpoint 1: Tema & Lattes',
    avancos: 'Coleta de coordenadas 3D de poses manuais e estruturação de dataset para análise no Colab.'
  },
  {
    id: 4,
    titulo: 'Avaliação de Latência WebRTC vs HLS para Transmissão de Vídeo em Telemedicina',
    trilha: 'Trilha 1: Ciência de Dados & Dados Abertos',
    integrantes: 'Estudante 7 & Estudante 8',
    emails: ['estudante7@aluno.ifsc.edu.br', 'estudante8@aluno.ifsc.edu.br'],
    objetivo: 'Mensurar o atraso temporal, jitter e perda de quadros em simulações de teleinterconsulta médica sob redes móveis instáveis.',
    overleaf: 'https://www.overleaf.com/read/exemplo-sbc-telemedicina',
    github: 'https://github.com/exemplo/telemedicina-video-streaming',
    checkpoint: 'Checkpoint 2: Estado da Arte & Python',
    avancos: 'Testes de transmissão sob perda de pacotes concluídos; geração dos gráficos de latência no Colab.'
  }
];

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
 * Endpoint GET: Devolve a lista pública de projetos/duplas em formato JSON.
 */
function doGet(e) {
  try {
    var projetos = lerProjetos_();
    return respostaJson_({ ok: true, projetos: projetos });
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

  // Suporte a modo simulado/demonstração
  if (typeof idToken === 'string' && idToken.indexOf('simulado:') === 0) {
    var emailSimulado = idToken.replace('simulado:', '').toLowerCase().trim();
    var isDoc = CONFIG.DOCENTES.indexOf(emailSimulado) !== -1;
    return {
      email: emailSimulado,
      nome: emailSimulado.split('@')[0].replace('.', ' '),
      papel: isDoc ? 'docente' : 'aluno'
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
    var permitido = CONFIG.DOMINIOS_PERMITIDOS.indexOf(dominio) !== -1 || CONFIG.DOCENTES.indexOf(email) !== -1;
    if (!permitido) {
      throw new Error('Utilize um e-mail institucional (@ifsc.edu.br ou @aluno.ifsc.edu.br).');
    }
  }

  var papel = (CONFIG.DOCENTES.indexOf(email) !== -1) ? 'docente' : 'aluno';
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

  return {
    ok: true,
    mensagem: 'Proposta #' + novoId + ' cadastrada com sucesso na planilha oficial!',
    projeto: {
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
    }
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
      JSON.stringify({ titulo: linhaDados[1], cp: linhaDados[7] }),
      JSON.stringify({ titulo: novoTitulo, cp: novoCheckpoint })
    ]);
  } catch (e) {
    // Falha silenciosa de auditoria não impede salvamento principal
  }

  return {
    ok: true,
    mensagem: 'Ficha #' + idAlvo + ' atualizada com sucesso!',
    projeto: {
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
    }
  };
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
