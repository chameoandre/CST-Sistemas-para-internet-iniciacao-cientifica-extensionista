/**
 * ice-live.js — Motor dinâmico, Autenticação Google e Gestão de Equipes
 * Unidade Curricular: Iniciação Científica & Extensionista (IFSC Garopaba)
 */

(function () {
  'use strict';

  // Estado global do aplicativo
  window.ICE = {
    usuario: null,      // { email, nome, picture, papel: 'docente'|'aluno'|'pendente'|'visitante', projetos: [] }
    idToken: null,
    projetos: [],
    trilhas: [
      'Trilha 1: Ciência de Dados & Dados Abertos',
      'Trilha 2: Acessibilidade & Usabilidade Web',
      'Trilha 3: Desempenho & Otimização Web',
      'Trilha 4: Letramento Digital & Extensão Comunitária'
    ],
    config: window.ICE_CONFIG || {}
  };

  const STORAGE_KEY_PROJETOS = 'ice_projetos_2026_2';
  const STORAGE_KEY_TOKEN = 'ice_google_id_token';

  // Dados iniciais padrão de demonstração / base
  const DADOS_INICIAIS = [
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
      progresso: 45,
      avancos: 'Coleta de dados via API concluída; elaboração do script Python de gráficos.',
      status: 'ativo'
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
      progresso: 35,
      avancos: 'Seleção das 10 páginas governamentais para auditoria automatizada.',
      status: 'ativo'
    }
  ];

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    carregarProjetos();
    inicializarAuth();
    renderizarCards();
    injetarModais();
  });

  // ==========================================
  // GESTÃO DE DADOS (STORAGE + API)
  // ==========================================
  function carregarProjetos() {
    try {
      const salvos = localStorage.getItem(STORAGE_KEY_PROJETOS);
      if (salvos) {
        window.ICE.projetos = JSON.parse(salvos);
      } else {
        window.ICE.projetos = [...DADOS_INICIAIS];
        salvarProjetosLocalmente();
      }
    } catch (e) {
      console.warn('Erro ao carregar do localStorage:', e);
      window.ICE.projetos = [...DADOS_INICIAIS];
    }
  }

  function salvarProjetosLocalmente() {
    try {
      localStorage.setItem(STORAGE_KEY_PROJETOS, JSON.stringify(window.ICE.projetos));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  }

  // ==========================================
  // AUTENTICAÇÃO GOOGLE
  // ==========================================
  function inicializarAuth() {
    const authContainer = document.getElementById('ice-auth');
    if (!authContainer) return;

    // Verificar se já temos token salvo
    const savedToken = sessionStorage.getItem(STORAGE_KEY_TOKEN);
    if (savedToken) {
      processarTokenGoogle(savedToken);
      return;
    }

    renderizarBotaoLoginGoogle();
  }

  function renderizarBotaoLoginGoogle() {
    const authContainer = document.getElementById('ice-auth');
    if (!authContainer) return;

    authContainer.innerHTML = `<div id="g_id_signin_container"></div>`;

    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: window.ICE.config.googleClientId,
          callback: tratarRespostaGoogle,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        window.google.accounts.id.renderButton(
          document.getElementById('g_id_signin_container'),
          {
            theme: 'outline',
            size: 'medium',
            type: 'standard',
            shape: 'pill',
            text: 'signin_with',
            logo_alignment: 'left'
          }
        );
      } catch (err) {
        console.warn('Google Sign-In não inicializado (verifique origens no Google Cloud):', err);
        authContainer.innerHTML = `
          <button class="btn btn-sm btn-outline-secondary" onclick="ICE.loginSimulado()">
            <i class="bi bi-google me-1"></i> Entrar
          </button>
        `;
      }
    } else {
      // Caso o script do Google ainda esteja carregando
      setTimeout(renderizarBotaoLoginGoogle, 500);
    }
  }

  function tratarRespostaGoogle(response) {
    if (!response || !response.credential) return;
    sessionStorage.setItem(STORAGE_KEY_TOKEN, response.credential);
    processarTokenGoogle(response.credential);
  }

  function processarTokenGoogle(token) {
    window.ICE.idToken = token;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = (payload.email || '').toLowerCase();
      const nome = payload.name || payload.given_name || 'Usuário';
      const picture = payload.picture || '';

      // Identificar papel
      const docentes = ['andre.moraes@ifsc.edu.br', 'adalberto.tabalipa@ifsc.edu.br', 'chameoandre@gmail.com'];
      let papel = 'aluno';
      if (docentes.includes(email)) {
        papel = 'docente';
      }

      window.ICE.usuario = {
        email,
        nome,
        picture,
        papel
      };

      atualizarUiUsuario();
      renderizarCards();
      mostrarToast(`Bem-vindo(a), ${nome}!`);
    } catch (e) {
      console.error('Erro ao decodificar JWT:', e);
      renderizarBotaoLoginGoogle();
    }
  }

  function atualizarUiUsuario() {
    const authContainer = document.getElementById('ice-auth');
    if (!authContainer || !window.ICE.usuario) return;

    const u = window.ICE.usuario;
    const papelBadge = u.papel === 'docente'
      ? `<span class="ice-user-role-badge ice-user-role-docente">Docente</span>`
      : `<span class="ice-user-role-badge ice-user-role-aluno">Estudante</span>`;

    authContainer.innerHTML = `
      <div class="ice-user-chip">
        ${u.picture ? `<img src="${u.picture}" alt="${u.nome}" class="ice-user-avatar">` : `<i class="bi bi-person-circle fs-5 text-success"></i>`}
        <span class="d-none d-md-inline">${u.nome.split(' ')[0]}</span>
        ${papelBadge}
        <button class="btn btn-sm btn-link text-danger p-0 ms-1" onclick="ICE.logout()" title="Sair da conta">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>
    `;
  }

  window.ICE.logout = function () {
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    window.ICE.usuario = null;
    window.ICE.idToken = null;
    renderizarBotaoLoginGoogle();
    renderizarCards();
    mostrarToast('Você saiu da sua conta.');
  };

  window.ICE.loginSimulado = function () {
    const email = prompt('Digite seu e-mail institucional para identificação (ex: seu.nome@aluno.ifsc.edu.br):');
    if (!email) return;
    const nome = email.split('@')[0].replace('.', ' ');
    const papel = (email.includes('andre.moraes') || email.includes('adalberto')) ? 'docente' : 'aluno';
    window.ICE.usuario = { email: email.toLowerCase(), nome, picture: '', papel };
    atualizarUiUsuario();
    renderizarCards();
    mostrarToast(`Conectado como ${nome} (${papel})`);
  };

  // ==========================================
  // RENDERIZAÇÃO DOS CARDS DE DUPLAS
  // ==========================================
  function renderizarCards() {
    const container = document.getElementById('teams-container');
    if (!container) return;

    const user = window.ICE.usuario;
    const isDocente = user && user.papel === 'docente';

    let html = '';

    window.ICE.projetos.forEach(p => {
      const isMembro = user && p.emails && p.emails.some(e => e.toLowerCase() === user.email);
      const podeEditar = isDocente || isMembro;

      // Badge Trilha
      let trilhaBadge = 'bg-secondary-subtle text-secondary';
      if (p.trilha.includes('Trilha 1')) trilhaBadge = 'bg-success-subtle text-success';
      if (p.trilha.includes('Trilha 2')) trilhaBadge = 'bg-info-subtle text-info';
      if (p.trilha.includes('Trilha 3')) trilhaBadge = 'bg-warning-subtle text-warning';
      if (p.trilha.includes('Trilha 4')) trilhaBadge = 'bg-primary-subtle text-primary';

      // Badge Checkpoint
      let cpClass = 'badge-cp-1';
      if (p.checkpoint && p.checkpoint.includes('2')) cpClass = 'badge-cp-2';
      if (p.checkpoint && p.checkpoint.includes('3')) cpClass = 'badge-cp-3';
      if (p.checkpoint && p.checkpoint.includes('4')) cpClass = 'badge-cp-4';

      html += `
        <div class="col-md-6 col-lg-4" id="card-projeto-${p.id}">
          <div class="section-card h-100 team-card d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge ${trilhaBadge} text-truncate" style="max-width: 180px;" title="${p.trilha}">${p.trilha.split(':')[0]}</span>
                <span class="badge ${cpClass} small">${p.checkpoint ? p.checkpoint.split(':')[0] : 'CP 1'}</span>
              </div>
              
              <h4 class="h6 font-title fw-bold text-main mb-1 text-truncate-2" title="${p.titulo}">#${p.id} ${p.titulo}</h4>
              <small class="text-muted d-block mb-2">
                <i class="bi bi-people-fill text-success me-1"></i> ${p.integrantes}
              </small>

              <p class="text-muted small mb-3 text-truncate-3" style="font-size: 0.8rem; line-height: 1.4;">
                ${p.objetivo || 'Objetivo da pesquisa em definição.'}
              </p>
            </div>

            <div>
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="text-muted small" style="font-size: 0.75rem;">Progresso Estimado</span>
                <span class="fw-bold small text-main" style="font-size: 0.75rem;">${p.progresso || 25}%</span>
              </div>
              <div class="progress mb-3" style="height: 5px;">
                <div class="progress-bar bg-success" style="width: ${p.progresso || 25}%"></div>
              </div>

              <div class="team-card-actions justify-content-between pt-2 border-top border-secondary border-opacity-15">
                <div class="d-flex gap-1">
                  ${p.overleaf ? `<a href="${p.overleaf}" target="_blank" class="btn btn-sm btn-outline-success px-2 py-1" style="font-size: 0.75rem;" title="Abrir Artigo no Overleaf"><i class="bi bi-file-earmark-text me-1"></i>Overleaf</a>` : ''}
                  ${p.github ? `<a href="${p.github}" target="_blank" class="btn btn-sm btn-outline-secondary px-2 py-1" style="font-size: 0.75rem;" title="Abrir Repositório GitHub"><i class="bi bi-github"></i></a>` : ''}
                </div>

                ${podeEditar ? `
                  <button class="btn btn-sm btn-light border px-2 py-1 text-primary" style="font-size: 0.75rem;" onclick="ICE.abrirModalEditar(${p.id})">
                    <i class="bi bi-pencil-square me-1"></i> Editar
                  </button>
                ` : `
                  <button class="btn btn-sm btn-light border px-2 py-1 text-muted" style="font-size: 0.75rem;" onclick="ICE.abrirModalDetalhes(${p.id})">
                    <i class="bi bi-eye me-1"></i> Detalhes
                  </button>
                `}
              </div>
            </div>
          </div>
        </div>
      `;
    });

    // Card de Adicionar Proposta / Cadastrar Nova Dupla
    html += `
      <div class="col-md-6 col-lg-4">
        <div class="section-card h-100 d-flex flex-column justify-content-center align-items-center text-center p-4 team-card" style="border: 2px dashed var(--border-color, #cbd5e1); background: transparent;">
          <div class="p-3 bg-success-subtle rounded-circle text-success mb-2">
            <i class="bi bi-person-plus-fill fs-3"></i>
          </div>
          <strong class="font-title small text-main mb-1">Cadastrar Nova Dupla / Proposta</strong>
          <small class="text-muted mb-3">Submeta o tema de pesquisa, integrantes e links do artigo</small>
          <button class="btn btn-sm btn-success px-3" onclick="ICE.abrirModalCadastro()">
            <i class="bi bi-plus-circle me-1"></i> Adicionar Proposta
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // ==========================================
  // MODAIS (CADASTRO, EDIÇÃO, DETALHES)
  // ==========================================
  function injetarModais() {
    if (document.getElementById('modal-ice-cadastro')) return;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = `
      <!-- MODAL DE CADASTRO -->
      <div class="modal fade modal-ice" id="modal-ice-cadastro" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title font-title fw-bold d-flex align-items-center gap-2">
                <i class="bi bi-journal-plus text-success"></i> Cadastrar Nova Dupla / Proposta de Pesquisa
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <form id="form-ice-cadastro" onsubmit="ICE.salvarNovaDupla(event)">
              <div class="modal-body">
                <div class="alert alert-info py-2 small d-flex align-items-center gap-2 mb-3">
                  <i class="bi bi-info-circle-fill fs-5"></i>
                  <span>O trabalho pode ser realizado em <strong>duplas</strong> ou <strong>individualmente</strong>, visando o artigo final para o COTB.</span>
                </div>

                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label-ice"><i class="bi bi-bookmark-star text-success"></i> Título ou Tema Provisório da Pesquisa *</label>
                    <input type="text" class="form-control form-control-ice" id="cad-titulo" required placeholder="Ex: Análise de Desempenho e Acessibilidade em Portais Municipais">
                  </div>

                  <div class="col-md-6">
                    <label class="form-label-ice"><i class="bi bi-compass text-info"></i> Trilha Extensionista *</label>
                    <select class="form-select form-select-ice" id="cad-trilha" required>
                      <option value="Trilha 1: Ciência de Dados &amp; Dados Abertos">Trilha 1: Ciência de Dados &amp; Dados Abertos</option>
                      <option value="Trilha 2: Acessibilidade &amp; Usabilidade Web">Trilha 2: Acessibilidade &amp; Usabilidade Web</option>
                      <option value="Trilha 3: Desempenho &amp; Otimização Web">Trilha 3: Desempenho &amp; Otimização Web</option>
                      <option value="Trilha 4: Letramento Digital &amp; Extensão Comunitária">Trilha 4: Letramento Digital &amp; Extensão Comunitária</option>
                    </select>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label-ice"><i class="bi bi-people text-primary"></i> Nome dos Integrantes (Dupla ou Individual) *</label>
                    <input type="text" class="form-control form-control-ice" id="cad-integrantes" required placeholder="Ex: Maria Silva &amp; João Santos">
                  </div>

                  <div class="col-12">
                    <label class="form-label-ice"><i class="bi bi-envelope text-secondary"></i> E-mails dos Autores (separados por vírgula)</label>
                    <input type="text" class="form-control form-control-ice" id="cad-emails" placeholder="Ex: maria.s@aluno.ifsc.edu.br, joao.s@aluno.ifsc.edu.br">
                    <small class="text-muted" style="font-size: 0.75rem;">Usado para vincular permissão de edição pelo login Google.</small>
                  </div>

                  <div class="col-12">
                    <label class="form-label-ice"><i class="bi bi-question-circle text-warning"></i> Questão de Pesquisa &amp; Objetivo Principal *</label>
                    <textarea class="form-control form-control-ice" id="cad-objetivo" rows="3" required placeholder="Qual problema a pesquisa busca responder e qual o impacto extensionista esperado?"></textarea>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label-ice"><i class="bi bi-file-earmark-code text-success"></i> Link de Leitura do Overleaf (SBC)</label>
                    <input type="url" class="form-control form-control-ice" id="cad-overleaf" placeholder="https://www.overleaf.com/read/...">
                    <small class="text-muted" style="font-size: 0.72rem;">Dica: Use sempre o link de <strong>compartilhamento de leitura (/read/)</strong>.</small>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label-ice"><i class="bi bi-github text-dark"></i> Repositório GitHub (Código/Dados)</label>
                    <input type="url" class="form-control form-control-ice" id="cad-github" placeholder="https://github.com/usuario/repositorio">
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-success"><i class="bi bi-check-lg me-1"></i> Salvar Proposta</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- MODAL DE EDIÇÃO -->
      <div class="modal fade modal-ice" id="modal-ice-edicao" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title font-title fw-bold d-flex align-items-center gap-2">
                <i class="bi bi-pencil-square text-primary"></i> Atualizar Ficha do Trabalho
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <form id="form-ice-edicao" onsubmit="ICE.salvarEdicao(event)">
              <input type="hidden" id="edit-id">
              <div class="modal-body">
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label-ice">Título da Pesquisa</label>
                    <input type="text" class="form-control form-control-ice" id="edit-titulo" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label-ice">Trilha Extensionista</label>
                    <select class="form-select form-select-ice" id="edit-trilha">
                      <option value="Trilha 1: Ciência de Dados &amp; Dados Abertos">Trilha 1: Ciência de Dados &amp; Dados Abertos</option>
                      <option value="Trilha 2: Acessibilidade &amp; Usabilidade Web">Trilha 2: Acessibilidade &amp; Usabilidade Web</option>
                      <option value="Trilha 3: Desempenho &amp; Otimização Web">Trilha 3: Desempenho &amp; Otimização Web</option>
                      <option value="Trilha 4: Letramento Digital &amp; Extensão Comunitária">Trilha 4: Letramento Digital &amp; Extensão Comunitária</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label-ice">Checkpoint Atual</label>
                    <select class="form-select form-select-ice" id="edit-checkpoint">
                      <option value="Checkpoint 1: Tema &amp; Lattes">Checkpoint 1: Tema &amp; Lattes</option>
                      <option value="Checkpoint 2: Estado da Arte &amp; Python">Checkpoint 2: Estado da Arte &amp; Python</option>
                      <option value="Checkpoint 3: Artigo SBC Completo">Checkpoint 3: Artigo SBC Completo</option>
                      <option value="Checkpoint 4: Submissão COTB">Checkpoint 4: Submissão COTB</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label-ice">Objetivo da Pesquisa</label>
                    <textarea class="form-control form-control-ice" id="edit-objetivo" rows="2"></textarea>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label-ice">Link Overleaf (/read/)</label>
                    <input type="url" class="form-control form-control-ice" id="edit-overleaf">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label-ice">Repositório GitHub</label>
                    <input type="url" class="form-control form-control-ice" id="edit-github">
                  </div>
                  <div class="col-12">
                    <label class="form-label-ice">Últimos Avanços / Registro</label>
                    <input type="text" class="form-control form-control-ice" id="edit-avancos" placeholder="Descreva brevemente os últimos resultados alcançados...">
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i class="bi bi-save me-1"></i> Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalContainer);
  }

  // ==========================================
  // AÇÕES DOS MODAIS
  // ==========================================
  window.ICE.abrirModalCadastro = function () {
    const modalEl = document.getElementById('modal-ice-cadastro');
    if (!modalEl) return;

    // Se usuário estiver logado, pré-preencher e-mail e nome
    if (window.ICE.usuario) {
      const emailField = document.getElementById('cad-emails');
      if (emailField && !emailField.value) {
        emailField.value = window.ICE.usuario.email;
      }
      const autoresField = document.getElementById('cad-integrantes');
      if (autoresField && !autoresField.value) {
        autoresField.value = window.ICE.usuario.nome;
      }
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  };

  window.ICE.salvarNovaDupla = function (e) {
    e.preventDefault();

    const titulo = document.getElementById('cad-titulo').value.trim();
    const trilha = document.getElementById('cad-trilha').value;
    const integrantes = document.getElementById('cad-integrantes').value.trim();
    const emailsStr = document.getElementById('cad-emails').value.trim();
    const objetivo = document.getElementById('cad-objetivo').value.trim();
    const overleaf = document.getElementById('cad-overleaf').value.trim();
    const github = document.getElementById('cad-github').value.trim();

    const emails = emailsStr ? emailsStr.split(',').map(s => s.trim().toLowerCase()) : [];
    if (window.ICE.usuario && !emails.includes(window.ICE.usuario.email)) {
      emails.push(window.ICE.usuario.email);
    }

    const novoId = window.ICE.projetos.length > 0
      ? Math.max(...window.ICE.projetos.map(p => p.id)) + 1
      : 1;

    const novoProjeto = {
      id: novoId,
      titulo,
      trilha,
      integrantes,
      emails,
      objetivo,
      overleaf,
      github,
      checkpoint: 'Checkpoint 1: Tema & Lattes',
      progresso: 25,
      avancos: 'Proposta submetida no dashboard.',
      status: 'ativo'
    };

    window.ICE.projetos.push(novoProjeto);
    salvarProjetosLocalmente();

    // Fechar modal
    const modalEl = document.getElementById('modal-ice-cadastro');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    // Resetar form
    document.getElementById('form-ice-cadastro').reset();

    // Re-renderizar
    renderizarCards();
    mostrarToast(`Proposta #${novoId} cadastrada com sucesso!`);
  };

  window.ICE.abrirModalEditar = function (id) {
    const projeto = window.ICE.projetos.find(p => p.id === id);
    if (!projeto) return;

    document.getElementById('edit-id').value = projeto.id;
    document.getElementById('edit-titulo').value = projeto.titulo || '';
    document.getElementById('edit-trilha').value = projeto.trilha || '';
    document.getElementById('edit-checkpoint').value = projeto.checkpoint || 'Checkpoint 1: Tema & Lattes';
    document.getElementById('edit-objetivo').value = projeto.objetivo || '';
    document.getElementById('edit-overleaf').value = projeto.overleaf || '';
    document.getElementById('edit-github').value = projeto.github || '';
    document.getElementById('edit-avancos').value = projeto.avancos || '';

    const modalEl = document.getElementById('modal-ice-edicao');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  };

  window.ICE.salvarEdicao = function (e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-id').value, 10);
    const index = window.ICE.projetos.findIndex(p => p.id === id);
    if (index === -1) return;

    window.ICE.projetos[index].titulo = document.getElementById('edit-titulo').value.trim();
    window.ICE.projetos[index].trilha = document.getElementById('edit-trilha').value;
    window.ICE.projetos[index].checkpoint = document.getElementById('edit-checkpoint').value;
    window.ICE.projetos[index].objetivo = document.getElementById('edit-objetivo').value.trim();
    window.ICE.projetos[index].overleaf = document.getElementById('edit-overleaf').value.trim();
    window.ICE.projetos[index].github = document.getElementById('edit-github').value.trim();
    window.ICE.projetos[index].avancos = document.getElementById('edit-avancos').value.trim();

    // Atualiza estimativa de progresso
    const cp = window.ICE.projetos[index].checkpoint;
    if (cp.includes('1')) window.ICE.projetos[index].progresso = 25;
    else if (cp.includes('2')) window.ICE.projetos[index].progresso = 50;
    else if (cp.includes('3')) window.ICE.projetos[index].progresso = 75;
    else if (cp.includes('4')) window.ICE.projetos[index].progresso = 100;

    salvarProjetosLocalmente();

    const modalEl = document.getElementById('modal-ice-edicao');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    renderizarCards();
    mostrarToast(`Ficha #${id} atualizada com sucesso!`);
  };

  window.ICE.abrirModalDetalhes = function (id) {
    const projeto = window.ICE.projetos.find(p => p.id === id);
    if (!projeto) return;
    alert(`Projeto #${projeto.id}: ${projeto.titulo}\n\nIntegrantes: ${projeto.integrantes}\nTrilha: ${projeto.trilha}\n\nObjetivo: ${projeto.objetivo}\n\nAvanços: ${projeto.avancos}`);
  };

  function mostrarToast(msg) {
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-msg');
    if (toast && toastMsg) {
      toastMsg.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3500);
    }
  }

})();
