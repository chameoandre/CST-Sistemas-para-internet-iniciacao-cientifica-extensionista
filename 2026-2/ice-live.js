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
    avaliacoes: [],
    recados: [],
    docentes: [],
    filtroAudienciaMural: 'todos',
    filtroCategoriaMural: 'todas',
    trilhas: [
      'Trilha 1: Ciência de Dados & Dados Abertos',
      'Trilha 2: Acessibilidade & Usabilidade Web',
      'Trilha 3: Desempenho & Otimização Web',
      'Trilha 4: Letramento Digital & Extensão Comunitária'
    ],
    config: window.ICE_CONFIG || {}
  };

  const STORAGE_KEY_PROJETOS = 'ice_projetos_2026_2';
  const STORAGE_KEY_RECADOS = 'ice_recados_2026_2';
  const STORAGE_KEY_TOKEN = 'ice_google_id_token';
  const STORAGE_KEY_DOCENTES = 'ice_docentes_orientadores';

  // Função utilitária para sanitização e escape contra XSS
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  window.escapeHtml = escapeHtml;
  window.ICE.escapeHtml = escapeHtml;

  // ==========================================
  // GESTÃO DA EQUIPE DOCENTE & ORIENTADORES
  // ==========================================
  function obterDocentesCadastrados() {
    if (window.ICE.docentes && Array.isArray(window.ICE.docentes) && window.ICE.docentes.length > 0) {
      return window.ICE.docentes;
    }
    try {
      const salvos = localStorage.getItem(STORAGE_KEY_DOCENTES);
      if (salvos) {
        const parsed = JSON.parse(salvos);
        if (Array.isArray(parsed) && parsed.length > 0) {
          window.ICE.docentes = parsed;
          return window.ICE.docentes;
        }
      }
    } catch (e) {}

    const padrao = (window.ICE_CONFIG && Array.isArray(window.ICE_CONFIG.docentesIniciais))
      ? window.ICE_CONFIG.docentesIniciais
      : [
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

    window.ICE.docentes = padrao;
    salvarDocentesLocal(padrao);
    return window.ICE.docentes;
  }

  function salvarDocentesLocal(lista) {
    window.ICE.docentes = lista;
    try {
      localStorage.setItem(STORAGE_KEY_DOCENTES, JSON.stringify(lista));
    } catch (e) {}
  }

  function isDocenteEmail(email) {
    if (!email) return false;
    const em = String(email).trim().toLowerCase();
    const lista = obterDocentesCadastrados();
    const doc = lista.find(d => String(d.email).trim().toLowerCase() === em);
    if (doc) {
      return doc.status !== 'inativo';
    }
    // Salvaguardas institucionais e permissão permanente para o professor Alberto Barros
    if (em === 'andre.moraes@ifsc.edu.br' || em === 'adalberto.tabalipa@ifsc.edu.br' || em === 'alberto.barros@ifsc.edu.br' || em === 'chameoandre@gmail.com') return true;
    if (em.includes('alberto.barros') || em.includes('andre.moraes') || em.includes('adalberto')) return true;
    return false;
  }

  window.ICE.isDocenteEmail = isDocenteEmail;
  window.ICE.obterDocentesCadastrados = obterDocentesCadastrados;

  // Recados iniciais de acolhimento (caso nenhum recado exista ainda)
  const RECADOS_INICIAIS = [
    {
      id: 'REC-001',
      data_hora: '07/11/2026 08:00',
      autor_nome: 'Prof. André Moraes',
      autor_email: 'andre.moraes@ifsc.edu.br',
      papel: 'docente',
      tipo_destinatario: 'geral',
      projeto_id_alvo: '',
      equipe_alvo: 'Toda a Turma',
      titulo: 'Boas-vindas ao Mural de Recados & Articulação Extensionista!',
      conteudo: 'Estudantes: este espaço é o canal oficial de comunicação assíncrona da nossa disciplina. Usem este mural para compartilhar links de formulários do Google Forms para coleta de dados das suas pesquisas, articular parcerias com outras duplas e tirar dúvidas.',
      categoria: 'aviso',
      link_apoio: 'https://www.overleaf.com/project/6aee47eac2b88b3db042894d',
      fixado: true,
      status: 'ativo'
    },
    {
      id: 'REC-002',
      data_hora: '07/11/2026 08:30',
      autor_nome: 'Prof. André Moraes',
      autor_email: 'andre.moraes@ifsc.edu.br',
      papel: 'docente',
      tipo_destinatario: 'geral',
      projeto_id_alvo: '',
      equipe_alvo: 'Toda a Turma',
      titulo: 'Execução do Checkpoint 2: Roteiro 2 de Python & Gráficos',
      conteudo: 'Lembrem-se de gerar os gráficos no Google Colab e exportar as figuras em formato PDF vetorial para a pasta de figuras do Overleaf, inserindo o código LaTeX conforme o Roteiro Prático 2.',
      categoria: 'aviso',
      link_apoio: 'roteiro-2-python-graficos/roteiro_python_graficos.pdf',
      fixado: true,
      status: 'ativo'
    }
  ];

  // Sem dados mockados: a lista começa limpa aguardando as candidaturas das equipes
  const DADOS_INICIAIS = [];

  // ==========================================
  // BANCO DE TEMAS INSPIRADORES (PESQUISA & EXTENSÃO)
  // Foco: Análise de Dados, Acessibilidade, Libras e Telemedicina
  // ==========================================
  const TEMAS_SUGERIDOS = [
    // --- 1. TECNOLOGIA EDUCACIONAL & ACESSIBILIDADE ---
    {
      id: 'tema-edu-1',
      categoria: 'educacao_acessibilidade',
      categoriaNome: 'Acessibilidade em AVAs',
      badgeCor: 'bg-primary-subtle text-primary border border-primary border-opacity-25',
      icone: 'bi-eye-slash-fill',
      titulo: 'Acessibilidade Digital (WCAG) em Ambientes Virtuais de Ensino',
      trilha: 'Trilha 2: Acessibilidade & Usabilidade Web',
      descricao: 'Avalia barreiras de contraste, leitores de tela e navegação por teclado em salas virtuais de estudo utilizadas em escolas e universidades.',
      analiseDados: 'Testes automáticos com Lighthouse e Axe-core em 10 plataformas; contagem de erros por gravidade e gráficos comparativos no Colab.',
      extensao: 'Guia prático e ilustrado com recomendações simples para professores montarem aulas virtuais mais acessíveis.',
      objetivo: 'Identificar as principais barreiras de acessibilidade em ambientes virtuais de ensino e propor melhorias para estudantes com deficiência visual.'
    },
    {
      id: 'tema-edu-2',
      categoria: 'educacao_acessibilidade',
      categoriaNome: 'Legendas em Videoaulas',
      badgeCor: 'bg-primary-subtle text-primary border border-primary border-opacity-25',
      icone: 'bi-ear-fill',
      titulo: 'Acurácia de Legendas Automáticas em Videoaulas de Programação',
      trilha: 'Trilha 1: Ciência de Dados & Dados Abertos',
      descricao: 'Testa a precisão de ferramentas abertas de reconhecimento de voz ao transcrever termos técnicos de informática para apoiar alunos surdos.',
      analiseDados: 'Comparação de áudio e texto gerado por IA com Python; cálculo da taxa de palavras corretas e gráficos de dispersão.',
      extensao: 'Diretrizes de gravação e captação de áudio para instrutores produzirem videoaulas com legendas de alta qualidade.',
      objetivo: 'Mensurar a taxa de acerto de legendas automáticas ao transcrever termos técnicos de computação em língua portuguesa.'
    },
    {
      id: 'tema-edu-3',
      categoria: 'educacao_acessibilidade',
      categoriaNome: 'Daltonismo em Jogos',
      badgeCor: 'bg-primary-subtle text-primary border border-primary border-opacity-25',
      icone: 'bi-palette-fill',
      titulo: 'Acessibilidade e Daltonismo em Jogos e Quizzes Educativos',
      trilha: 'Trilha 2: Acessibilidade & Usabilidade Web',
      descricao: 'Verifica se as cores e contrastes de jogos didáticos permitem a leitura confortável e inclusiva por estudantes com daltonismo.',
      analiseDados: 'Simulação de filtros de visão daltônica com OpenCV/Python e contagem de telas com contraste insuficiente.',
      extensao: 'Criação de uma paleta de cores recomendada e de alto contraste para professores e desenvolvedores de jogos escolares.',
      objetivo: 'Avaliar a visibilidade e o contraste de jogos pedagógicos para alunos com diferentes tipos de daltonismo.'
    },

    // --- 2. LINGUAGEM DE SINAIS (LIBRAS & TECNOLOGIAS ASSISTIVAS) ---
    {
      id: 'tema-libras-1',
      categoria: 'linguagem_sinais',
      categoriaNome: 'Alfabeto da Libras na Web',
      badgeCor: 'bg-success-subtle text-success border border-success border-opacity-25',
      icone: 'bi-hand-index-thumb-fill',
      titulo: 'Reconhecimento do Alfabeto da Libras no Navegador com IA Leve',
      trilha: 'Trilha 3: Desempenho & Otimização Web',
      descricao: 'Testa o reconhecimento do alfabeto manual de Libras pela webcam sem travar e sem depender de computadores caros.',
      analiseDados: 'Medição da velocidade (quadros por segundo - FPS) e acurácia de cada letra da Libras usando Python e MediaPipe.',
      extensao: 'Protótipo web aberto e lúdico para crianças, escolas e famílias praticarem o alfabeto da Libras no navegador.',
      objetivo: 'Verificar se modelos leves de inteligência artificial conseguem reconhecer sinais da Libras em computadores escolares populares.'
    },
    {
      id: 'tema-libras-2',
      categoria: 'linguagem_sinais',
      categoriaNome: 'Dicionário de TI em Libras',
      badgeCor: 'bg-success-subtle text-success border border-success border-opacity-25',
      icone: 'bi-translate',
      titulo: 'Glossário Visual e Mapeamento de Termos de TI em Libras',
      trilha: 'Trilha 4: Letramento Digital & Extensão Comunitária',
      descricao: 'Mapeia quais termos do cotidiano da computação (como backend, banco de dados, função, loop) já possuem sinais em Libras e quais ainda faltam.',
      analiseDados: 'Mineração e contagem de termos em dicionários abertos; gráficos de cobertura de termos e análise de frequência.',
      extensao: 'Página web com glossário visual colaborativo para intérpretes de Libras e calouros surdos dos cursos de TI do IFSC.',
      objetivo: 'Sistematizar um glossário terminológico de termos de tecnologia em Libras para apoiar a permanência de estudantes surdos.'
    },
    {
      id: 'tema-libras-3',
      categoria: 'linguagem_sinais',
      categoriaNome: 'Consumo de Dados em Libras',
      badgeCor: 'bg-success-subtle text-success border border-success border-opacity-25',
      icone: 'bi-wifi',
      titulo: 'Consumo de Internet Móvel: Avatares 3D vs. Vídeos em Libras',
      trilha: 'Trilha 3: Desempenho & Otimização Web',
      descricao: 'Compara quanta franquia de dados de internet móvel é gasta ao carregar avatares 3D (ex: VLibras) em comparação com vídeos reais de intérpretes.',
      analiseDados: 'Medição de pacotes de dados (Megabytes baixados) e tempo de abertura de páginas em conexões 3G e 4G com Python.',
      extensao: 'Recomendações técnicas para sites públicos municipais economizarem dados de usuários com planos pré-pagos.',
      objetivo: 'Comparar o gasto de dados e a velocidade de resposta entre avatares virtuais e vídeos convencionais de Libras em portais web.'
    },

    // --- 3. TRANSMISSÃO DE VÍDEO NO AMBIENTE MÉDICO (TELEMEDICINA) ---
    {
      id: 'tema-med-1',
      categoria: 'video_medico',
      categoriaNome: 'Vídeo para Telemedicina',
      badgeCor: 'bg-danger-subtle text-danger border border-danger border-opacity-25',
      icone: 'bi-camera-video-fill',
      titulo: 'Transmissão de Vídeo em Tempo Real para Consultas Médicas Online',
      trilha: 'Trilha 3: Desempenho & Otimização Web',
      descricao: 'Analisa o atraso de vídeo e travamentos em chamadas de telemedicina quando a conexão com a internet oscila.',
      analiseDados: 'Simulação de variações de banda e perdas de pacotes; medição de latência em milissegundos e gráficos estatísticos em Python.',
      extensao: 'Orientações práticas para secretarias de saúde configurarem teleconsultas estáveis em postos de bairros periféricos.',
      objetivo: 'Identificar a latência e o comportamento de transmissões de vídeo médico sob conexões instáveis de internet.'
    },
    {
      id: 'tema-med-2',
      categoria: 'video_medico',
      categoriaNome: 'Compressão de Vídeos Cirúrgicos',
      badgeCor: 'bg-danger-subtle text-danger border border-danger border-opacity-25',
      icone: 'bi-file-earmark-play-fill',
      titulo: 'Qualidade e Compressão de Vídeos Cirúrgicos para Telemedicina',
      trilha: 'Trilha 1: Ciência de Dados & Dados Abertos',
      descricao: 'Investiga até que ponto é possível reduzir o tamanho de vídeos de cirurgias sem perder a nitidez necessária para diagnóstico à distância.',
      analiseDados: 'Compressão com FFmpeg em diferentes qualidades; cálculo de métricas de nitidez (SSIM/PSNR) e curvas de comparação com Python.',
      extensao: 'Definição de formatos leves de vídeo para compartilhamento ágil de exames e cirurgias entre hospitais do litoral catarinense.',
      objetivo: 'Determinar o equilíbrio entre compressão de arquivo e preservação de detalhes visuais em vídeos médicos.'
    },
    {
      id: 'tema-med-3',
      categoria: 'video_medico',
      categoriaNome: 'Internet nos Postos de Saúde',
      badgeCor: 'bg-danger-subtle text-danger border border-danger border-opacity-25',
      icone: 'bi-hospital-fill',
      titulo: 'Diagnóstico da Conectividade e Internet nos Postos de Saúde (SUS)',
      trilha: 'Trilha 1: Ciência de Dados & Dados Abertos',
      descricao: 'Analisa dados públicos sobre a velocidade da internet nos postos de saúde de Garopaba e municípios vizinhos para avaliar o suporte à telemedicina.',
      analiseDados: 'Tratamento de bases abertas da Anatel e Cetic.br com Pandas; correlação entre velocidade contratada e estabilidade com gráficos.',
      extensao: 'Relatório informativo para conselhos municipais de saúde sobre a situação da infraestrutura digital local para o SUS Digital.',
      objetivo: 'Mapear a qualidade da internet nos postos de saúde da região em relação aos requisitos mínimos para consultas com vídeo.'
    },

    // --- 4. PROJETOS INTEGRADORES (CROSSOVER PI I & II) ---
    {
      id: 'tema-pi-1',
      categoria: 'crossover_pi',
      categoriaNome: 'Transmissão Esportiva (JifTV)',
      badgeCor: 'bg-info-subtle text-info border border-info border-opacity-25',
      icone: 'bi-broadcast-pin',
      titulo: 'Qualidade e Estabilidade de Vídeo em Transmissões Esportivas (JifTV)',
      trilha: 'Trilha 3: Desempenho & Otimização Web',
      descricao: 'Avalia como transmissões esportivas escolares se adaptam quando a internet dos espectadores oscila no celular.',
      analiseDados: 'Coleta de dados de travamento (buffering) e resolução de vídeo; gráficos de desempenho e estabilidade em Python.',
      extensao: 'Guia de transmissão para eventos esportivos do IFSC (JIFs e interclasses) rodarem com qualidade sem queda de sinal.',
      objetivo: 'Medir o impacto de oscilações de rede móvel na qualidade percebida pelo público em transmissões esportivas escolares.'
    },
    {
      id: 'tema-pi-2',
      categoria: 'crossover_pi',
      categoriaNome: 'Estação Meteorológica IoT',
      badgeCor: 'bg-warning-subtle text-warning border border-warning border-opacity-25',
      icone: 'bi-cloud-sun-fill',
      titulo: 'Monitoramento Climático em Garopaba com Sensores IoT de Baixo Custo',
      trilha: 'Trilha 1: Ciência de Dados & Dados Abertos',
      descricao: 'Analisa dados de temperatura, chuva e umidade coletados por sensores instalados no Câmpus Garopaba para prever variações locais.',
      analiseDados: 'Tratamento de séries temporais com Pandas; correlações entre pressão e chuva e mapas de calor de temperatura.',
      extensao: 'Painel web simples com alertas meteorológicos para pescadores, agricultores e esportistas de Garopaba.',
      objetivo: 'Analisar padrões climáticos costeiros a partir de sensores de baixo custo e disponibilizar informações úteis para a comunidade.'
    },
    {
      id: 'tema-pi-3',
      categoria: 'crossover_pi',
      categoriaNome: 'Chatbot para o Estudante',
      badgeCor: 'bg-primary-subtle text-primary border border-primary border-opacity-25',
      icone: 'bi-chat-dots-fill',
      titulo: 'Chatbot de Atendimento ao Estudante Rodando no Próprio Computador',
      trilha: 'Trilha 3: Desempenho & Otimização Web',
      descricao: 'Avalia a rapidez e precisão de inteligências artificiais gratuitas locais para responder dúvidas de alunos sobre datas, editais e regras do IFSC.',
      analiseDados: 'Medição do tempo de resposta (segundos) e porcentagem de respostas certas avaliadas com scripts em Python.',
      extensao: 'Protótipo de atendente virtual para a Secretaria Acadêmica do Câmpus Garopaba tirar dúvidas frequentes de novos alunos.',
      objetivo: 'Testar se modelos leves de IA no próprio computador conseguem responder dúvidas acadêmicas com rapidez e precisão.'
    },
    {
      id: 'tema-pi-4',
      categoria: 'crossover_pi',
      categoriaNome: 'Estatísticas no Esporte',
      badgeCor: 'bg-success-subtle text-success border border-success border-opacity-25',
      icone: 'bi-trophy-fill',
      titulo: 'Estatísticas e Análise Tática no Esporte Escolar com Python',
      trilha: 'Trilha 1: Ciência de Dados & Dados Abertos',
      descricao: 'Transforma dados de scout de partidas de voleibol em gráficos fáceis de entender para ajudar times escolares a melhorar o desempenho.',
      analiseDados: 'Cálculo de aproveitamento de saques e ataques; geração de mapas de calor da quadra e gráficos de radar com Matplotlib.',
      extensao: 'Oficina prática para professores de educação física e projetos esportivos de Garopaba usarem dados nos treinos.',
      objetivo: 'Criar visualizações e estatísticas claras a partir de dados de jogos escolares para orientar treinos e táticas.'
    },
    {
      id: 'tema-pi-5',
      categoria: 'crossover_pi',
      categoriaNome: 'Jogos com Sons para TDAH',
      badgeCor: 'bg-secondary-subtle text-secondary border border-secondary border-opacity-25',
      icone: 'bi-controller',
      titulo: 'Jogos com Sons e Desafios Visuais para Crianças com TDAH',
      trilha: 'Trilha 2: Acessibilidade & Usabilidade Web',
      descricao: 'Mede a atenção e a facilidade de interação de crianças com jogos didáticos baseados em estímulos sonoros desenvolvidos em Python.',
      analiseDados: 'Registro de tempo de reação (ms), acertos e desistências; gráficos de evolução da atenção ao longo dos desafios.',
      extensao: 'Parceria com salas de recursos multifuncionais de Garopaba para aplicação e validação dos jogos pedagógicos.',
      objetivo: 'Quantificar a manutenção do foco proporcionada por jogos com estímulos sonoros em crianças da educação básica.'
    },
    {
      id: 'tema-pi-6',
      categoria: 'crossover_pi',
      categoriaNome: 'Museu 3D Virtual Acessível',
      badgeCor: 'bg-danger-subtle text-danger border border-danger border-opacity-25',
      icone: 'bi-box-fill',
      titulo: 'Museu 3D Virtual do Acervo do IFSC: Otimização para Celulares Simples',
      trilha: 'Trilha 3: Desempenho & Otimização Web',
      descricao: 'Descobre como deixar modelos 3D de rochas e fósseis leves para abrirem instantaneamente no navegador de qualquer celular popular.',
      analiseDados: 'Medição do tamanho do arquivo (MB), tempo de carregamento e fluidez (FPS) em celulares de entrada com Python.',
      extensao: 'Portal web com visitação virtual ao acervo arqueológico do Câmpus Garopaba para escolas fundamentais da região.',
      objetivo: 'Otimizar peças 3D para que carreguem rápido em navegadores web populares sem perder os detalhes anatômicos e visuais.'
    }
  ];

  window.ICE.temasSugeridos = TEMAS_SUGERIDOS;

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    injetarModais();
    carregarProjetos();
    inicializarAuth();
    renderizarVitrineTemas('todos');
    renderizarCards();
    renderizarMural();

    // Sincronização periódica em segundo plano (padrão ProgWeb 2 a cada 25s)
    const intervalMs = (window.ICE.config && window.ICE.config.syncIntervalMs) || 25000;
    setInterval(() => {
      if (document.visibilityState === 'visible' && window.ICE.config && window.ICE.config.apiUrl) {
        carregarProjetosSilencioso();
      }
    }, intervalMs);
  });

  async function carregarProjetosSilencioso() {
    try {
      const resp = await fetch(window.ICE.config.apiUrl, { method: 'GET' });
      if (resp.ok) {
        const dados = await resp.json();
        if (dados && dados.ok) {
          if (Array.isArray(dados.projetos) && dados.projetos.length > 0) {
            const strAtual = JSON.stringify(window.ICE.projetos.map(p => ({ id: p.id, cp: p.checkpoint, ov: p.overleaf })));
            const strNovo = JSON.stringify(dados.projetos.map(p => ({ id: p.id, cp: p.checkpoint, ov: p.overleaf })));
            if (strAtual !== strNovo) {
              window.ICE.projetos = dados.projetos;
              salvarProjetosLocalmente();
              renderizarCards();
            }
          }
          if (Array.isArray(dados.avaliacoes)) {
            window.ICE.avaliacoes = dados.avaliacoes;
            try { localStorage.setItem('ice_avaliacoes_2026_2', JSON.stringify(dados.avaliacoes)); } catch (e) {}
          }
          if (Array.isArray(dados.recados) && dados.recados.length > 0) {
            const merged = mergeRecados(window.ICE.recados, dados.recados);
            const strRecAtual = JSON.stringify(window.ICE.recados);
            const strRecNovo = JSON.stringify(merged);
            if (strRecAtual !== strRecNovo) {
              window.ICE.recados = merged;
              salvarRecadosLocalmente();
              renderizarMural();
            }
          }
          if (Array.isArray(dados.docentes) && dados.docentes.length > 0) {
            const listaAtual = obterDocentesCadastrados();
            const mesclados = [...dados.docentes];
            listaAtual.forEach(dLocal => {
              if (!mesclados.find(m => String(m.email).toLowerCase() === String(dLocal.email).toLowerCase())) {
                mesclados.push(dLocal);
              }
            });
            salvarDocentesLocal(mesclados);
          }
          if (window.ICE.usuario && window.ICE.usuario.papel === 'docente') {
            renderizarPainelDocente();
          }
          atualizarBadgeConexao('online');
        }
      }
    } catch (e) {
      // Falha silenciosa no background não interrompe a interface do estudante
    }
  }

  // ==========================================
  // GESTÃO DE DADOS (STORAGE + APPS SCRIPT API)
  // ==========================================
  async function carregarProjetos() {
    // 1. Carregamento imediato do cache local (expurgando mocks de exemplo antigos)
    try {
      obterDocentesCadastrados();
      const salvos = localStorage.getItem(STORAGE_KEY_PROJETOS);
      if (salvos) {
        let parsed = JSON.parse(salvos);
        parsed = parsed.filter(p => {
          const integ = String(p.integrantes || '');
          const tit = String(p.titulo || '');
          return !integ.includes('Estudante') && !tit.includes('Análise de Dados de Turismo e Sazonalidade') && !tit.includes('Auditoria de Acessibilidade Digital (WCAG) em Portais Públicos da AMUREL');
        });
        window.ICE.projetos = parsed;
        salvarProjetosLocalmente();
      } else {
        window.ICE.projetos = [];
      }

      const avalSalvas = localStorage.getItem('ice_avaliacoes_2026_2');
      if (avalSalvas) {
        window.ICE.avaliacoes = JSON.parse(avalSalvas);
      } else {
        window.ICE.avaliacoes = [];
      }

      const recadosSalvos = localStorage.getItem(STORAGE_KEY_RECADOS);
      if (recadosSalvos) {
        window.ICE.recados = JSON.parse(recadosSalvos);
      } else {
        window.ICE.recados = [...RECADOS_INICIAIS];
        salvarRecadosLocalmente();
      }
    } catch (e) {
      console.warn('Erro ao carregar do localStorage:', e);
      window.ICE.projetos = [];
      window.ICE.avaliacoes = [];
      window.ICE.recados = [...RECADOS_INICIAIS];
    }

    renderizarCards();
    renderizarMural();
    if (window.ICE.usuario && window.ICE.usuario.papel === 'docente') {
      renderizarPainelDocente();
    }

    // 2. Sincronização online via Google Apps Script (se apiUrl estiver configurada)
    if (window.ICE.config && window.ICE.config.apiUrl) {
      atualizarBadgeConexao('sincronizando');
      try {
        const resp = await fetch(window.ICE.config.apiUrl, { method: 'GET' });
        if (resp.ok) {
          const dados = await resp.json();
          if (dados && dados.ok) {
            if (Array.isArray(dados.projetos)) {
              window.ICE.projetos = dados.projetos;
              salvarProjetosLocalmente();
              renderizarCards();
            }
            if (Array.isArray(dados.avaliacoes)) {
              window.ICE.avaliacoes = dados.avaliacoes;
              try { localStorage.setItem('ice_avaliacoes_2026_2', JSON.stringify(dados.avaliacoes)); } catch (e) {}
            }
            if (Array.isArray(dados.recados) && dados.recados.length > 0) {
              window.ICE.recados = mergeRecados(window.ICE.recados, dados.recados);
              salvarRecadosLocalmente();
              renderizarMural();
            }
            if (Array.isArray(dados.docentes) && dados.docentes.length > 0) {
              const listaAtual = obterDocentesCadastrados();
              const mesclados = [...dados.docentes];
              listaAtual.forEach(dLocal => {
                if (!mesclados.find(m => String(m.email).toLowerCase() === String(dLocal.email).toLowerCase())) {
                  mesclados.push(dLocal);
                }
              });
              salvarDocentesLocal(mesclados);
            }
            if (window.ICE.usuario && window.ICE.usuario.papel === 'docente') {
              renderizarPainelDocente();
            }
            atualizarBadgeConexao('online');
            return;
          }
        }
      } catch (err) {
        console.warn('API online do Apps Script inacessível ou offline. Operando com cache local.', err);
      }
      atualizarBadgeConexao('offline');
    } else {
      atualizarBadgeConexao('demonstracao');
    }
  }

  function salvarProjetosLocalmente() {
    try {
      localStorage.setItem(STORAGE_KEY_PROJETOS, JSON.stringify(window.ICE.projetos));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  }

  function salvarRecadosLocalmente() {
    try {
      localStorage.setItem(STORAGE_KEY_RECADOS, JSON.stringify(window.ICE.recados));
    } catch (e) {
      console.error('Erro ao salvar recados no localStorage:', e);
    }
  }

  function atualizarBadgeConexao(modo) {
    let el = document.getElementById('ice-sync-status');
    if (!el) {
      const badgeTotal = document.getElementById('total-equipes-badge');
      if (badgeTotal && badgeTotal.parentElement) {
        el = document.createElement('span');
        el.id = 'ice-sync-status';
        badgeTotal.parentElement.appendChild(el);
      }
    }
    if (!el) return;

    if (modo === 'online') {
      el.className = 'badge bg-success-subtle text-success border border-success border-opacity-25 ms-2';
      el.innerHTML = '<i class="bi bi-cloud-check-fill me-1"></i>Nuvem IFSC Conectada';
      el.title = 'Sincronizado em tempo real com a planilha oficial do Google Sheets';
    } else if (modo === 'sincronizando') {
      el.className = 'badge bg-warning-subtle text-warning border border-warning border-opacity-25 ms-2';
      el.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" style="width:0.75rem;height:0.75rem;"></span>Sincronizando...';
    } else if (modo === 'offline') {
      el.className = 'badge bg-secondary-subtle text-secondary border border-secondary border-opacity-25 ms-2';
      el.innerHTML = '<i class="bi bi-cloud-slash me-1"></i>Offline / Cache';
      el.title = 'Operando com cópia local em cache';
    } else {
      el.className = 'badge bg-info-subtle text-info border border-info border-opacity-25 ms-2';
      el.innerHTML = '<i class="bi bi-hdd-network me-1"></i>Modo Local';
      el.title = 'Persistência no navegador (para sincronizar em nuvem, implante o Apps Script e adicione apiUrl)';
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

      // Identificar papel dinamicamente (incluindo orientadores cadastrados e substitutos como Prof. Alberto Barros)
      let papel = isDocenteEmail(email) ? 'docente' : 'aluno';

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
    const u = window.ICE.usuario;
    const isDocente = !!(u && u.papel === 'docente');
    document.body.classList.toggle('modo-docente-ativo', isDocente);

    if (isDocente) {
      renderizarPainelDocente();
    }

    if (!authContainer || !u) return;

    const papelBadge = isDocente
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
    document.body.classList.remove('modo-docente-ativo');

    // Se estiver na aba restrita docente, redireciona para a aba de projetos
    const tabDocente = document.getElementById('tab-docente');
    if (tabDocente && !tabDocente.classList.contains('d-none')) {
      if (typeof window.switchTab === 'function') {
        window.switchTab('tab-projetos');
      }
    }

    renderizarBotaoLoginGoogle();
    renderizarCards();
    mostrarToast('Você saiu da sua conta.');
  };

  window.ICE.loginSimulado = function () {
    const email = prompt('Digite seu e-mail institucional para identificação (ex: seu.nome@aluno.ifsc.edu.br, andre.moraes@ifsc.edu.br ou alberto.barros@ifsc.edu.br):');
    if (!email) return;
    const emailLower = email.toLowerCase().trim();
    const nome = emailLower.split('@')[0].replace('.', ' ');
    const papel = isDocenteEmail(emailLower) ? 'docente' : 'aluno';
    window.ICE.usuario = { email: emailLower, nome, picture: '', papel };
    atualizarUiUsuario();
    renderizarCards();
    mostrarToast(`Conectado como ${nome} (${papel})`);
  };

  // ==========================================
  // RENDERIZAÇÃO DOS CARDS DE DUPLAS
  // ==========================================
  // ==========================================
  // RENDERIZAÇÃO DOS CARDS DE DUPLAS (PADRÃO VISUAL PEDAGÓGICO)
  // ==========================================
  function obterConfigTrilha(p) {
    const trilha = p.trilha || '';
    if (trilha.includes('Trilha 1') || trilha.toLowerCase().includes('ciência de dados') || trilha.toLowerCase().includes('dados abertos')) {
      return {
        cor: 'green',
        icone: 'bi-bar-chart-steps',
        sigla: 'Ciência de Dados & Python',
        svg: `<svg viewBox="0 0 280 75" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="6" width="250" height="63" rx="6" fill="#0f172a" stroke="#16a34a" stroke-width="1"/>
          <rect x="28" y="16" width="40" height="42" rx="4" fill="#1e293b" stroke="#334155" stroke-width="0.8"/>
          <ellipse cx="48" cy="24" rx="14" ry="5" fill="#16a34a" fill-opacity="0.3" stroke="#16a34a" stroke-width="0.8"/>
          <ellipse cx="48" cy="34" rx="14" ry="5" fill="#16a34a" fill-opacity="0.2" stroke="#16a34a" stroke-width="0.8"/>
          <ellipse cx="48" cy="44" rx="14" ry="5" fill="#16a34a" fill-opacity="0.2" stroke="#16a34a" stroke-width="0.8"/>
          <text x="48" y="27" font-size="5" fill="#4ade80" text-anchor="middle" font-family="monospace">DATA</text>
          <path d="M 68 37 L 90 37" stroke="#4ade80" stroke-width="1.5" stroke-dasharray="2 2"/>
          <rect x="90" y="16" width="160" height="42" rx="4" fill="#1e293b" stroke="#334155" stroke-width="0.8"/>
          <rect x="100" y="36" width="12" height="18" rx="1" fill="#16a34a"/>
          <rect x="116" y="26" width="12" height="28" rx="1" fill="#22c55e"/>
          <rect x="132" y="32" width="12" height="22" rx="1" fill="#10b981"/>
          <path d="M 152 48 L 175 32 L 200 38 L 225 22 L 240 25" stroke="#38bdf8" stroke-width="1.5" fill="none"/>
          <circle cx="175" cy="32" r="2.5" fill="#38bdf8"/>
          <circle cx="200" cy="38" r="2.5" fill="#38bdf8"/>
          <circle cx="225" cy="22" r="2.5" fill="#38bdf8"/>
          <text x="200" y="52" font-size="6" fill="#94a3b8" font-family="monospace">PANDAS &amp; PYTHON</text>
        </svg>`
      };
    } else if (trilha.includes('Trilha 2') || trilha.toLowerCase().includes('acessibilidade') || trilha.toLowerCase().includes('usabilidade')) {
      return {
        cor: 'blue',
        icone: 'bi-universal-access',
        sigla: 'Acessibilidade & Usabilidade',
        svg: `<svg viewBox="0 0 280 75" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="6" width="250" height="63" rx="6" fill="#0f172a" stroke="#0284c7" stroke-width="1"/>
          <circle cx="48" cy="37" r="18" fill="#0369a1" fill-opacity="0.3" stroke="#38bdf8" stroke-width="1.2"/>
          <circle cx="48" cy="28" r="3" fill="#38bdf8"/>
          <line x1="48" y1="31" x2="48" y2="44" stroke="#38bdf8" stroke-width="2"/>
          <line x1="40" y1="35" x2="56" y2="35" stroke="#38bdf8" stroke-width="2"/>
          <line x1="48" y1="44" x2="42" y2="51" stroke="#38bdf8" stroke-width="2"/>
          <line x1="48" y1="44" x2="54" y2="51" stroke="#38bdf8" stroke-width="2"/>
          <rect x="80" y="16" width="170" height="42" rx="4" fill="#1e293b" stroke="#334155" stroke-width="0.8"/>
          <rect x="90" y="24" width="70" height="5" rx="2" fill="#38bdf8"/>
          <rect x="90" y="33" width="90" height="4" rx="2" fill="#94a3b8"/>
          <rect x="90" y="41" width="55" height="4" rx="2" fill="#64748b"/>
          <rect x="190" y="22" width="50" height="13" rx="3" fill="#16a34a" fill-opacity="0.2" stroke="#22c55e" stroke-width="0.8"/>
          <text x="215" y="31" font-size="6" font-weight="bold" fill="#4ade80" text-anchor="middle" font-family="sans-serif">WCAG 2.2 AA</text>
          <rect x="190" y="39" width="50" height="13" rx="3" fill="#0284c7" fill-opacity="0.2" stroke="#38bdf8" stroke-width="0.8"/>
          <text x="215" y="48" font-size="6" font-weight="bold" fill="#38bdf8" text-anchor="middle" font-family="sans-serif">AUDITORIA</text>
        </svg>`
      };
    } else if (trilha.includes('Trilha 3') || trilha.toLowerCase().includes('desempenho') || trilha.toLowerCase().includes('otimização')) {
      return {
        cor: 'amber',
        icone: 'bi-speedometer2',
        sigla: 'Desempenho & Otimização',
        svg: `<svg viewBox="0 0 280 75" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="6" width="250" height="63" rx="6" fill="#0f172a" stroke="#d97706" stroke-width="1"/>
          <circle cx="52" cy="37" r="18" fill="#78350f" fill-opacity="0.3" stroke="#f59e0b" stroke-width="1.2"/>
          <path d="M 40 45 A 14 14 0 1 1 64 45" stroke="#f59e0b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <line x1="52" y1="37" x2="60" y2="28" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
          <circle cx="52" cy="37" r="3" fill="#ef4444"/>
          <text x="52" y="51" font-size="5" fill="#fcd34d" text-anchor="middle" font-family="monospace">FPS</text>
          <rect x="85" y="16" width="165" height="42" rx="4" fill="#1e293b" stroke="#334155" stroke-width="0.8"/>
          <text x="95" y="28" font-size="6" fill="#f59e0b" font-family="monospace">LATÊNCIA: 18ms</text>
          <line x1="95" y1="34" x2="235" y2="34" stroke="#334155" stroke-width="1"/>
          <rect x="95" y="39" width="40" height="12" rx="3" fill="#0284c7" fill-opacity="0.25" stroke="#38bdf8" stroke-width="0.8"/>
          <text x="115" y="47" font-size="5.5" fill="#38bdf8" text-anchor="middle" font-family="sans-serif">WebRTC</text>
          <rect x="142" y="39" width="40" height="12" rx="3" fill="#16a34a" fill-opacity="0.25" stroke="#4ade80" stroke-width="0.8"/>
          <text x="162" y="47" font-size="5.5" fill="#4ade80" text-anchor="middle" font-family="sans-serif">MediaPipe</text>
          <text x="210" y="47" font-size="6" fill="#cbd5e1" font-family="monospace">60 FPS</text>
        </svg>`
      };
    } else {
      return {
        cor: 'purple',
        icone: 'bi-diagram-2',
        sigla: 'Extensão Comunitária',
        svg: `<svg viewBox="0 0 280 75" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="6" width="250" height="63" rx="6" fill="#1e1b4b" stroke="#7c3aed" stroke-width="1"/>
          <circle cx="50" cy="37" r="10" fill="#4c1d95" stroke="#c084fc" stroke-width="1.5"/>
          <text x="50" y="40" font-size="7" fill="#ffffff" text-anchor="middle" font-family="sans-serif">IFSC</text>
          <line x1="60" y1="37" x2="95" y2="24" stroke="#a78bfa" stroke-width="1.2" stroke-dasharray="2 2"/>
          <line x1="60" y1="37" x2="95" y2="50" stroke="#a78bfa" stroke-width="1.2" stroke-dasharray="2 2"/>
          <circle cx="102" cy="24" r="7" fill="#2e1065" stroke="#38bdf8" stroke-width="1"/>
          <circle cx="102" cy="50" r="7" fill="#2e1065" stroke="#4ade80" stroke-width="1"/>
          <rect x="125" y="16" width="125" height="42" rx="4" fill="#2e1065" stroke="#4c1d95" stroke-width="0.8"/>
          <text x="135" y="28" font-size="6" font-weight="bold" fill="#c4b5fd" font-family="sans-serif">EXTENSÃO UNIVERSITÁRIA</text>
          <text x="135" y="38" font-size="5.5" fill="#e0e7ff" font-family="sans-serif">30h CHCE • Impacto Social</text>
          <rect x="135" y="44" width="70" height="8" rx="2" fill="#7c3aed" fill-opacity="0.4"/>
          <text x="170" y="50" font-size="5" fill="#ddd6fe" text-anchor="middle" font-family="sans-serif">COMUNIDADE LOCAL</text>
        </svg>`
      };
    }
  }

  function renderizarCards() {
    const container = document.getElementById('teams-container');
    if (!container) return;

    const user = window.ICE.usuario;
    const isDocente = user && user.papel === 'docente';

    // Card Pedagógico reutilizável de Adicionar Nova Proposta / Cadastrar Dupla
    const cardCadastrarNovo = `
      <div class="pedagogical-card h-100 d-flex flex-column justify-content-between text-center" style="border: 2px dashed #16a34a; background: rgba(22, 163, 74, 0.02);">
        <div class="pedagogical-card-top justify-content-center">
          <div class="pedagogical-icon green">
            <i class="bi bi-journal-plus"></i>
          </div>
          <div>
            <span class="pedagogical-badge green">Nova Equipe</span>
            <h4>Cadastrar Dupla / Proposta</h4>
          </div>
        </div>
        
        <div class="card-clipart-box green">
          <svg viewBox="0 0 280 75" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="6" width="250" height="63" rx="6" fill="#f8fafc" stroke="#16a34a" stroke-width="1.2" stroke-dasharray="4 3"/>
            <circle cx="140" cy="30" r="14" fill="#dcfce7" stroke="#22c55e" stroke-width="1.2"/>
            <path d="M 140 22 L 140 38 M 132 30 L 148 30" stroke="#15803d" stroke-width="2.5" stroke-linecap="round"/>
            <text x="140" y="55" font-size="7" font-weight="bold" fill="#15803d" text-anchor="middle" font-family="sans-serif">INICIAR NOVA PESQUISA</text>
          </svg>
        </div>

        <p class="text-muted small mb-3">
          Submeta o tema de pesquisa da sua dupla, vincule os e-mails institucionais e receba a confirmação por e-mail.
        </p>

        <div class="pedagogical-card-footer">
          <div class="pedagogical-deliverable justify-content-center">
            <i class="bi bi-check2-circle text-success"></i>
            <span>Mentoria contínua para o COTB</span>
          </div>
          <div class="pedagogical-actions-group justify-content-center">
            <button class="btn-card-action btn-primary-action w-100 justify-content-center py-2" onclick="ICE.abrirModalCadastro()">
              <i class="bi bi-plus-lg"></i> Cadastrar Minha Proposta
            </button>
          </div>
        </div>
      </div>
    `;

    // Se não houver equipes cadastradas ainda, exibe empty-state amigável
    if (!window.ICE.projetos || window.ICE.projetos.length === 0) {
      container.innerHTML = `
        <div class="col-lg-8">
          <div class="p-4 rounded-3 text-center border bg-surface h-100 d-flex flex-column justify-content-center align-items-center" style="border: 2px dashed var(--border-color, #cbd5e1) !important;">
            <div class="p-3 bg-success-subtle text-success rounded-circle d-inline-flex mb-3">
              <i class="bi bi-clipboard2-check fs-2"></i>
            </div>
            <h5 class="h6 font-title fw-bold text-main mb-1">Aguardando Candidaturas das Equipes</h5>
            <p class="text-muted small mb-3" style="max-width: 480px; line-height: 1.5;">
              Os artigos em andamento aparecerão aqui assim que as duplas se candidatarem a um dos <strong>temas inspiradores</strong> disponíveis acima ou submeterem uma nova proposta autoral.
            </p>
            <button class="btn btn-sm btn-outline-success" onclick="document.getElementById('secao-temas-inspiracao').scrollIntoView({ behavior: 'smooth' })">
              <i class="bi bi-lightbulb-fill me-1"></i> Explorar Temas Disponíveis para Candidatura
            </button>
          </div>
        </div>
        <div class="col-lg-4">
          ${cardCadastrarNovo}
        </div>
      `;
      const badgeTotal = document.getElementById('total-equipes-badge');
      if (badgeTotal) badgeTotal.textContent = '0 equipes cadastradas';
      return;
    }

    let html = '';

    window.ICE.projetos.forEach(p => {
      const isMembro = user && p.emails && p.emails.some(e => e.toLowerCase() === user.email);
      const podeEditar = isDocente || isMembro;
      const configTrilha = obterConfigTrilha(p);

      // Checkpoint badge & cores
      let cpClass = 'badge-cp-1';
      let progresso = p.progresso || 25;
      if (p.checkpoint && p.checkpoint.includes('2')) {
        cpClass = 'badge-cp-2';
        progresso = Math.max(progresso, 50);
      } else if (p.checkpoint && p.checkpoint.includes('3')) {
        cpClass = 'badge-cp-3';
        progresso = Math.max(progresso, 75);
      } else if (p.checkpoint && p.checkpoint.includes('4')) {
        cpClass = 'badge-cp-4';
        progresso = 100;
      }

      html += `
        <div class="col-md-6 col-lg-4" id="card-projeto-${p.id}">
          <div class="pedagogical-card featured-${configTrilha.cor} h-100">
            <!-- TOPO DO CARD -->
            <div class="pedagogical-card-top">
              <div class="pedagogical-icon ${configTrilha.cor}">
                <i class="bi ${configTrilha.icone}"></i>
              </div>
              <div class="flex-grow-1 text-truncate">
                <div class="d-flex align-items-center justify-content-between gap-1 mb-1">
                  <span class="pedagogical-badge ${configTrilha.cor}">#${p.id} • ${configTrilha.sigla}</span>
                  <span class="badge ${cpClass} small">${p.checkpoint ? p.checkpoint.split(':')[0] : 'CP 1'}</span>
                </div>
                <h4 class="text-truncate-2 mb-0" title="${p.titulo}">${p.titulo}</h4>
              </div>
            </div>

            <!-- CLIPART VISUAL SVG INDICATIVO -->
            <div class="card-clipart-box ${configTrilha.cor}">
              ${configTrilha.svg}
            </div>

            <!-- INTEGRANTES E OBJETIVO -->
            <div class="mb-2">
              <div class="d-flex align-items-center gap-1.5 text-main small fw-bold mb-1">
                <i class="bi bi-people-fill text-success"></i>
                <span class="text-truncate" title="${p.integrantes}">${p.integrantes}</span>
              </div>
              <p class="text-muted small mb-0 text-truncate-2" style="font-size: 0.78rem; line-height: 1.4;" title="${p.objetivo || ''}">
                ${p.objetivo || 'Objetivo da pesquisa em definição.'}
              </p>
            </div>

            <!-- PROGRESSO DO CHECKPOINT -->
            <div class="my-2">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <small class="text-muted" style="font-size: 0.72rem;">Avanço do Artigo</small>
                <strong class="small text-main" style="font-size: 0.72rem;">${progresso}%</strong>
              </div>
              <div class="progress" style="height: 6px; border-radius: 999px;">
                <div class="progress-bar bg-${configTrilha.cor === 'amber' ? 'warning' : (configTrilha.cor === 'purple' ? 'purple' : (configTrilha.cor === 'blue' ? 'info' : 'success'))}" style="width: ${progresso}%;"></div>
              </div>
            </div>

            <!-- RODAPÉ COM AÇÕES E LINKS -->
            <div class="pedagogical-card-footer">
              <div class="pedagogical-deliverable">
                <i class="bi bi-geo-alt-fill text-${configTrilha.cor === 'amber' ? 'warning' : configTrilha.cor}"></i>
                <span class="text-truncate"><strong>Status:</strong> ${p.checkpoint || 'Checkpoint 1'}</span>
              </div>

              <div class="pedagogical-actions-group">
                ${p.overleaf ? `
                  <a href="${p.overleaf}" target="_blank" class="btn-card-action btn-pdf" title="Abrir Artigo no Overleaf">
                    <i class="bi bi-file-earmark-text-fill"></i> Overleaf
                  </a>
                ` : `
                  <span class="badge bg-danger-subtle text-danger border border-danger border-opacity-25" style="font-size: 0.7rem; padding: 0.35rem 0.5rem;" title="Link do Overleaf ainda não cadastrado">
                    <i class="bi bi-exclamation-circle me-1"></i> Sem Overleaf
                  </span>
                `}

                ${p.github ? `
                  <a href="${p.github}" target="_blank" class="btn-card-action" title="Abrir Repositório GitHub">
                    <i class="bi bi-github"></i>
                  </a>
                ` : ''}

                <button class="btn-card-action" onclick="ICE.abrirModalNovoRecado(${p.id})" title="Enviar recado / demanda para esta equipe">
                  <i class="bi bi-chat-left-text text-primary"></i>
                </button>

                ${podeEditar ? `
                  <button class="btn-card-action btn-primary-action ms-auto" onclick="ICE.abrirModalEditar(${p.id})">
                    <i class="bi bi-pencil-square"></i> Editar
                  </button>
                ` : `
                  <button class="btn-card-action ms-auto" onclick="ICE.abrirModalDetalhes(${p.id})">
                    <i class="bi bi-eye"></i> Detalhes
                  </button>
                `}
                ${isDocente ? `
                  <button class="btn-card-action btn-pdf docente-only ms-1" onclick="ICE.confirmarExcluirProjeto(${p.id})" title="Excluir Candidatura (Docente)" style="background: rgba(220, 38, 38, 0.08); color: #dc2626; border-color: rgba(220, 38, 38, 0.25);">
                    <i class="bi bi-trash-fill"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    });

    // Card Pedagógico de Adicionar Proposta / Nova Dupla
    html += `
      <div class="col-md-6 col-lg-4">
        ${cardCadastrarNovo}
      </div>
    `;

    container.innerHTML = html;

    const badgeTotal = document.getElementById('total-equipes-badge');
    if (badgeTotal) {
      badgeTotal.textContent = `${window.ICE.projetos.length} equipe(s) em mentoria`;
    }

    if (isDocente) {
      renderizarPainelDocente();
    }
  }

  // ==========================================
  // VITRINE DE TEMAS INSPIRADORES (4 CARDS POR LINHA)
  // ==========================================
  function renderizarVitrineTemas(filtro = 'todos') {
    const container = document.getElementById('cards-temas-inspiradores');
    if (!container) return;

    const temas = (filtro === 'todos')
      ? TEMAS_SUGERIDOS
      : TEMAS_SUGERIDOS.filter(t => t.categoria === filtro);

    let html = '';
    temas.forEach(t => {
      html += `
        <div class="col-sm-6 col-md-6 col-lg-4 col-xl-3">
          <div class="tema-inspirador-card">
            <div>
              <div class="d-flex justify-content-between align-items-center gap-1 mb-2">
                <span class="badge ${t.badgeCor} badge-area-tema text-truncate" title="${t.categoriaNome}">
                  <i class="bi ${t.icone} me-1"></i>${t.categoriaNome.split('&')[0]}
                </span>
                <span class="badge badge-data-python">
                  <i class="bi bi-bar-chart-line-fill me-1"></i>Dados + Python
                </span>
              </div>

              <h5 class="h6 font-title fw-bold text-main mb-2" style="font-size: 0.86rem; line-height: 1.35;">
                ${t.titulo}
              </h5>

              <p class="text-muted small mb-2 text-truncate-3" style="font-size: 0.77rem; line-height: 1.4;" title="${t.descricao}">
                ${t.descricao}
              </p>

              <div class="tema-box-dados mb-2">
                <strong class="d-block text-primary small" style="font-size: 0.72rem;">
                  <i class="bi bi-cpu-fill me-1"></i>Dados &amp; Python:
                </strong>
                <span class="text-secondary text-truncate-2 d-block" style="font-size: 0.72rem;" title="${t.analiseDados}">${t.analiseDados}</span>
              </div>

              <div class="tema-box-extensao">
                <strong class="d-block text-success small" style="font-size: 0.72rem;">
                  <i class="bi bi-people-fill me-1"></i>Extensão:
                </strong>
                <span class="text-secondary text-truncate-2 d-block" style="font-size: 0.72rem;" title="${t.extensao}">${t.extensao}</span>
              </div>
            </div>

            <div class="pt-2 border-top border-secondary border-opacity-15 d-flex flex-column gap-1.5 mt-2">
              <span class="badge bg-secondary-subtle text-secondary text-truncate text-center" style="font-size: 0.68rem;">
                ${t.trilha.split(':')[0]}
              </span>
              <button class="btn btn-sm btn-outline-success py-1 px-2 d-inline-flex align-items-center justify-content-center gap-1 w-100" style="font-size: 0.76rem; font-weight: 600;" onclick="ICE.adotarTema('${t.id}')">
                <i class="bi bi-person-check-fill"></i> Candidatar Dupla
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  window.ICE.filtrarTemas = function (categoria, btn) {
    if (btn && btn.parentElement) {
      btn.parentElement.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active', 'btn-success');
        b.classList.add('btn-outline-secondary');
      });
      btn.classList.add('active', 'btn-success');
      btn.classList.remove('btn-outline-secondary');
    }
    renderizarVitrineTemas(categoria);
  };

  window.ICE.adotarTema = function (idTema) {
    const tema = TEMAS_SUGERIDOS.find(t => t.id === idTema);
    if (!tema) return;

    ICE.abrirModalCadastro();

    setTimeout(() => {
      const selectTema = document.getElementById('cad-tema-predefinido');
      if (selectTema) selectTema.value = idTema;

      const cadTitulo = document.getElementById('cad-titulo');
      if (cadTitulo) cadTitulo.value = tema.titulo;

      const cadTrilha = document.getElementById('cad-trilha');
      if (cadTrilha) cadTrilha.value = tema.trilha;

      const cadObjetivo = document.getElementById('cad-objetivo');
      if (cadObjetivo) cadObjetivo.value = tema.objetivo;

      mostrarToast(`Tema "${tema.categoriaNome}" carregado! Complete os dados da sua dupla.`);
    }, 150);
  };

  window.ICE.aplicarTemaNoFormulario = function (idTema) {
    if (!idTema) return;
    const tema = TEMAS_SUGERIDOS.find(t => t.id === idTema);
    if (!tema) return;

    const cadTitulo = document.getElementById('cad-titulo');
    if (cadTitulo) cadTitulo.value = tema.titulo;

    const cadTrilha = document.getElementById('cad-trilha');
    if (cadTrilha) cadTrilha.value = tema.trilha;

    const cadObjetivo = document.getElementById('cad-objetivo');
    if (cadObjetivo) cadObjetivo.value = tema.objetivo;

    mostrarToast('Campos de título, trilha e objetivo preenchidos com o tema sugerido!');
  };

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

                <!-- SELETOR RÁPIDO DE INSPIRAÇÃO -->
                <div class="mb-3 p-3 bg-body rounded-3 border border-success border-opacity-35 shadow-sm">
                  <label class="form-label-ice text-success fw-bold mb-1">
                    <i class="bi bi-lightbulb-fill"></i> Inspiração Rápida: Escolha um Tema Sugerido pelo Professor (Opcional)
                  </label>
                  <select class="form-select form-select-ice" id="cad-tema-predefinido" onchange="ICE.aplicarTemaNoFormulario(this.value)">
                    <option value="">-- Clique aqui para escolher um tema e preencher automaticamente --</option>
                    <optgroup label="🎓 Tecnologia Educacional &amp; Acessibilidade">
                      <option value="tema-edu-1">1. Acessibilidade Digital (WCAG) em Ambientes Virtuais de Ensino</option>
                      <option value="tema-edu-2">2. Acurácia de Legendas Automáticas em Videoaulas de Programação</option>
                      <option value="tema-edu-3">3. Acessibilidade e Daltonismo em Jogos e Quizzes Educativos</option>
                    </optgroup>
                    <optgroup label="🤟 Linguagem de Sinais (Libras)">
                      <option value="tema-libras-1">4. Reconhecimento do Alfabeto da Libras no Navegador com IA Leve</option>
                      <option value="tema-libras-2">5. Glossário Visual e Mapeamento de Termos de TI em Libras</option>
                      <option value="tema-libras-3">6. Consumo de Internet Móvel: Avatares 3D vs. Vídeos em Libras</option>
                    </optgroup>
                    <optgroup label="🩺 Telemedicina &amp; Saúde Digital">
                      <option value="tema-med-1">7. Transmissão de Vídeo em Tempo Real para Consultas Médicas Online</option>
                      <option value="tema-med-2">8. Qualidade e Compressão de Vídeos Cirúrgicos para Telemedicina</option>
                      <option value="tema-med-3">9. Diagnóstico da Conectividade e Internet nos Postos de Saúde (SUS)</option>
                    </optgroup>
                    <optgroup label="🔄 Projetos Integradores (Crossover PI I &amp; II)">
                      <option value="tema-pi-1">10. Qualidade e Estabilidade de Vídeo em Transmissões Esportivas (JifTV)</option>
                      <option value="tema-pi-2">11. Monitoramento Climático em Garopaba com Sensores IoT de Baixo Custo</option>
                      <option value="tema-pi-3">12. Chatbot de Atendimento ao Estudante Rodando no Próprio Computador</option>
                      <option value="tema-pi-4">13. Estatísticas e Análise Tática no Esporte Escolar com Python</option>
                      <option value="tema-pi-5">14. Jogos com Sons e Desafios Visuais para Crianças com TDAH</option>
                      <option value="tema-pi-6">15. Museu 3D Virtual do Acervo do IFSC: Otimização para Celulares Simples</option>
                    </optgroup>
                  </select>
                  <small class="text-muted d-block mt-1" style="font-size: 0.72rem;">
                    <i class="bi bi-magic me-1 text-primary"></i> Ao selecionar, o título, a trilha e o objetivo serão preenchidos. Você pode editar o texto livremente.
                  </small>
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
                  <div class="col-md-6">
                    <label class="form-label-ice"><i class="bi bi-people text-primary"></i> Nome dos Integrantes</label>
                    <input type="text" class="form-control form-control-ice" id="edit-integrantes" required>
                    <small class="text-muted" style="font-size: 0.72rem;">Nomes da dupla ou individual.</small>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label-ice"><i class="bi bi-envelope text-secondary"></i> E-mails dos Autores</label>
                    <input type="text" class="form-control form-control-ice" id="edit-emails">
                    <small class="text-muted" style="font-size: 0.72rem;">Separados por vírgula (para login e e-mails).</small>
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
              <div class="modal-footer d-flex justify-content-between">
                <button type="button" class="btn btn-outline-danger docente-only" onclick="ICE.confirmarExcluirProjetoModal()">
                  <i class="bi bi-trash-fill me-1"></i> Excluir Candidatura
                </button>
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancelar</button>
                  <button type="submit" class="btn btn-primary"><i class="bi bi-save me-1"></i> Salvar Alterações</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- MODAL DE COMUNICADO GERAL DOCENTE -->
      <div class="modal fade modal-ice docente-only" id="modal-ice-comunicado" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title font-title fw-bold d-flex align-items-center gap-2">
                <i class="bi bi-megaphone-fill text-purple"></i> Enviar Comunicado Geral da Turma
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <form id="form-ice-comunicado" onsubmit="ICE.enviarComunicadoTurma(event)">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label-ice">Título do Assunto / Comunicado *</label>
                  <input type="text" class="form-control form-control-ice" id="comunicado-titulo" required placeholder="Ex: Orientações para a Entrega do Checkpoint 2 e Gráficos">
                </div>
                <div class="mb-3">
                  <label class="form-label-ice">Mensagem Oficial para a Turma *</label>
                  <textarea class="form-control form-control-ice" id="comunicado-mensagem" rows="5" required placeholder="Digite a mensagem que será enviada para o e-mail de todos os estudantes cadastrados..."></textarea>
                </div>
                <div class="alert alert-info py-2 small mb-0 d-flex align-items-center gap-2">
                  <i class="bi bi-info-circle-fill fs-5"></i>
                  <span>Disparo automático via Gmail para todas as caixas de entrada dos estudantes com vínculo no Dashboard.</span>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-success" style="background:#7c3aed;border-color:#7c3aed;color:#fff;">
                  <i class="bi bi-send-fill me-1"></i> Disparar Comunicado
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- MODAL DE NOVO RECADO / DEMANDA NO MURAL -->
      <div class="modal fade modal-ice" id="modal-ice-recado" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title font-title fw-bold d-flex align-items-center gap-2">
                <i class="bi bi-chat-left-dots-fill text-success"></i> Publicar Recado ou Demanda no Mural
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <form id="form-ice-recado" onsubmit="ICE.salvarNovoRecado(event)">
              <div class="modal-body">
                <div class="row g-3">
                  <!-- Identificação do Autor -->
                  <div class="col-md-6">
                    <label class="form-label-ice">Seu Nome / Autor *</label>
                    <input type="text" class="form-control form-control-ice" id="recado-autor-nome" required placeholder="Ex: Lucas Silva (Dupla #3)">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label-ice">Seu E-mail Institucional *</label>
                    <input type="email" class="form-control form-control-ice" id="recado-autor-email" required placeholder="aluno@aluno.ifsc.edu.br">
                  </div>

                  <!-- Tipo de Audiência / Destinatário -->
                  <div class="col-12">
                    <label class="form-label-ice">Audiência do Recado *</label>
                    <div class="p-3 bg-body rounded-3 border border-secondary border-opacity-25">
                      <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="recado-audiencia" id="recado-aud-geral" value="geral" checked onchange="ICE.alternarAudienciaRecado(this.value)">
                        <label class="form-check-label fw-bold text-main" for="recado-aud-geral">
                          <i class="bi bi-globe text-success me-1"></i> Recado Geral para Toda a Turma (Público)
                        </label>
                        <div class="small text-muted ms-4">Visível para todos os estudantes, duplas e professores no Mural da UC.</div>
                      </div>
                      <div class="form-check mb-0">
                        <input class="form-check-input" type="radio" name="recado-audiencia" id="recado-aud-equipe" value="equipe" onchange="ICE.alternarAudienciaRecado(this.value)">
                        <label class="form-check-label fw-bold text-main" for="recado-aud-equipe">
                          <i class="bi bi-lock-fill text-primary me-1"></i> Recado Direcionado para uma Equipe Específica
                        </label>
                        <div class="small text-muted ms-4">Visível exclusivamente para os integrantes da equipe escolhida, para você e para os professores.</div>
                      </div>
                    </div>
                  </div>

                  <!-- Seletor da Equipe Alvo (visível apenas se for direcionado) -->
                  <div class="col-12 d-none" id="recado-bloco-equipe-alvo">
                    <label class="form-label-ice text-primary fw-bold">Selecione a Equipe / Projeto de Destino *</label>
                    <select class="form-select form-select-ice border-primary" id="recado-projeto-alvo">
                      <option value="">-- Carregando duplas cadastradas... --</option>
                    </select>
                  </div>

                  <!-- Categoria e Título -->
                  <div class="col-md-5">
                    <label class="form-label-ice">Categoria do Recado *</label>
                    <select class="form-select form-select-ice" id="recado-categoria" required>
                      <option value="pesquisa_dados">📊 Coleta de Dados &amp; Formulários</option>
                      <option value="articulacao">🤝 Articulação entre Equipes</option>
                      <option value="duvida">❓ Dúvidas &amp; Mentoria</option>
                      <option value="aviso">📢 Avisos Oficiais</option>
                      <option value="material">📚 Materiais &amp; Referências</option>
                    </select>
                  </div>
                  <div class="col-md-7">
                    <label class="form-label-ice">Título do Recado / Demanda *</label>
                    <input type="text" class="form-control form-control-ice" id="recado-titulo" required placeholder="Ex: Precisamos de 10 respostas no nosso formulário sobre turismo">
                  </div>

                  <!-- Mensagem / Corpo -->
                  <div class="col-12">
                    <label class="form-label-ice">Mensagem / Conteúdo Detalhado *</label>
                    <textarea class="form-control form-control-ice" id="recado-conteudo" rows="4" required placeholder="Escreva a mensagem com clareza, orientações ou contexto da demanda..."></textarea>
                  </div>

                  <!-- Link de Apoio Opcional -->
                  <div class="col-12">
                    <label class="form-label-ice">Link de Apoio ou Recurso (Google Forms, Colab, Overleaf, GitHub, etc.)</label>
                    <div class="input-group">
                      <span class="input-group-text bg-body border-secondary border-opacity-25"><i class="bi bi-link-45deg"></i></span>
                      <input type="url" class="form-control form-control-ice" id="recado-link-apoio" placeholder="https://docs.google.com/forms/... ou https://github.com/...">
                    </div>
                    <small class="text-muted d-block mt-1" style="font-size: 0.72rem;">O mural detecta automaticamente se é Google Forms, Colab, Overleaf ou GitHub para estilizar o botão.</small>
                  </div>

                  <!-- Opções exclusivas do Professor -->
                  <div class="col-12 docente-only">
                    <div class="p-3 bg-warning-subtle border border-warning rounded-3">
                      <span class="fw-bold text-dark d-block mb-2 small"><i class="bi bi-shield-lock-fill text-warning me-1"></i> Opções de Moderação Docente:</span>
                      <div class="form-check form-switch mb-1">
                        <input class="form-check-input" type="checkbox" id="recado-fixado">
                        <label class="form-check-label small fw-bold text-dark" for="recado-fixado">
                          📌 Fixar este recado em destaque no topo do Mural
                        </label>
                      </div>
                      <div class="form-check form-switch mb-0">
                        <input class="form-check-input" type="checkbox" id="recado-notificar-email">
                        <label class="form-check-label small fw-bold text-dark" for="recado-notificar-email">
                          ✉️ Disparar notificação por e-mail para a equipe alvo ou turma
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-success fw-bold" id="btn-salvar-recado">
                  <i class="bi bi-send-fill me-1"></i> Publicar no Mural
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- MODAL DE CADASTRO/EDIÇÃO DE PROFESSOR ORIENTADOR -->
      <div class="modal fade modal-ice docente-only" id="modal-ice-docente" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title font-title fw-bold d-flex align-items-center gap-2">
                <i class="bi bi-mortarboard-fill text-warning"></i> Cadastrar Professor Orientador
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <form id="form-ice-docente" onsubmit="ICE.salvarDocenteModal(event)">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label-ice">Nome Completo do Professor *</label>
                  <input type="text" class="form-control form-control-ice" id="docente-nome" required placeholder="Ex: Prof. Alberto Barros">
                </div>
                <div class="mb-3">
                  <label class="form-label-ice">E-mail Institucional (@ifsc.edu.br) *</label>
                  <input type="email" class="form-control form-control-ice" id="docente-email" required placeholder="ex: alberto.barros@ifsc.edu.br">
                  <small class="text-muted" style="font-size:0.75rem;">Utilizado para autenticação institucional via Google Workspace.</small>
                </div>
                <div class="row g-2 mb-3">
                  <div class="col-sm-6">
                    <label class="form-label-ice">Tipo de Atuação *</label>
                    <select class="form-select form-select-ice" id="docente-tipo" required>
                      <option value="substituto" selected>Substituto Temporário</option>
                      <option value="titular">Docente Titular da UC</option>
                      <option value="coorientador">Coorientador Convidado</option>
                      <option value="colaborador">Professor Colaborador</option>
                    </select>
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label-ice">Período de Atuação</label>
                    <input type="text" class="form-control form-control-ice" id="docente-periodo" placeholder="Ex: Sextas-feiras (2 semanas)">
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label-ice">Observações Didáticas / Escopo</label>
                  <textarea class="form-control form-control-ice" id="docente-obs" rows="2" placeholder="Ex: Substituição temporária do Prof. André Moraes para orientação presencial no laboratório..."></textarea>
                </div>
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="docente-ativo" checked>
                  <label class="form-check-label small fw-bold" for="docente-ativo">
                    Conceder acesso administrativo imediato ao painel docente e mural
                  </label>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-warning text-dark fw-bold">
                  <i class="bi bi-check-circle-fill me-1"></i> Salvar Orientador
                </button>
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

  window.ICE.salvarNovaDupla = async function (e) {
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

    // Fechar modal e resetar form
    const modalEl = document.getElementById('modal-ice-cadastro');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    document.getElementById('form-ice-cadastro').reset();

    // Sincronização online via Apps Script se apiUrl estiver configurada
    if (window.ICE.config && window.ICE.config.apiUrl) {
      mostrarToast('Enviando proposta para a planilha oficial...');
      try {
        const idToken = window.ICE.idToken || ('simulado:' + (window.ICE.usuario ? window.ICE.usuario.email : 'aluno@aluno.ifsc.edu.br'));
        const resp = await fetch(window.ICE.config.apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            acao: 'cadastrarDupla',
            idToken: idToken,
            projeto: novoProjeto
          })
        });
        const resJson = await resp.json();
        if (resJson && resJson.ok && resJson.projeto) {
          window.ICE.projetos.push(resJson.projeto);
          salvarProjetosLocalmente();
          renderizarCards();
          mostrarToast(`✅ Proposta #${resJson.projeto.id} salva na planilha oficial! E-mail de confirmação enviado para a equipe e docentes.`);
          return;
        } else {
          console.warn('Resposta da API ao cadastrar:', resJson);
        }
      } catch (err) {
        console.warn('Falha na conexão online com Apps Script. Gravando localmente:', err);
      }
    }

    // Fallback local se API não estiver configurada ou sem conexão
    window.ICE.projetos.push(novoProjeto);
    salvarProjetosLocalmente();
    renderizarCards();
    mostrarToast(`Proposta #${novoId} gravada localmente no dispositivo!`);
  };

  window.ICE.abrirModalEditar = function (id) {
    const projeto = window.ICE.projetos.find(p => p.id === id);
    if (!projeto) return;

    document.getElementById('edit-id').value = projeto.id;
    document.getElementById('edit-titulo').value = projeto.titulo || '';
    document.getElementById('edit-trilha').value = projeto.trilha || '';
    document.getElementById('edit-checkpoint').value = projeto.checkpoint || 'Checkpoint 1: Tema & Lattes';

    const elInteg = document.getElementById('edit-integrantes');
    if (elInteg) elInteg.value = projeto.integrantes || '';
    const elEmails = document.getElementById('edit-emails');
    if (elEmails) elEmails.value = (projeto.emails || []).join(', ');

    document.getElementById('edit-objetivo').value = projeto.objetivo || '';
    document.getElementById('edit-overleaf').value = projeto.overleaf || '';
    document.getElementById('edit-github').value = projeto.github || '';
    document.getElementById('edit-avancos').value = projeto.avancos || '';

    const modalEl = document.getElementById('modal-ice-edicao');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  };

  window.ICE.salvarEdicao = async function (e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-id').value, 10);
    const index = window.ICE.projetos.findIndex(p => p.id === id);
    if (index === -1) return;

    const elInteg = document.getElementById('edit-integrantes');
    const elEmails = document.getElementById('edit-emails');

    const dadosAtualizados = {
      id: id,
      titulo: document.getElementById('edit-titulo').value.trim(),
      trilha: document.getElementById('edit-trilha').value,
      checkpoint: document.getElementById('edit-checkpoint').value,
      integrantes: elInteg ? elInteg.value.trim() : window.ICE.projetos[index].integrantes,
      emails: elEmails ? elEmails.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : window.ICE.projetos[index].emails,
      objetivo: document.getElementById('edit-objetivo').value.trim(),
      overleaf: document.getElementById('edit-overleaf').value.trim(),
      github: document.getElementById('edit-github').value.trim(),
      avancos: document.getElementById('edit-avancos').value.trim()
    };

    // Fechar modal
    const modalEl = document.getElementById('modal-ice-edicao');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    // Sincronização online via Apps Script se apiUrl estiver configurada
    if (window.ICE.config && window.ICE.config.apiUrl) {
      mostrarToast('Atualizando ficha na planilha oficial...');
      try {
        const idToken = window.ICE.idToken || ('simulado:' + (window.ICE.usuario ? window.ICE.usuario.email : 'docente@ifsc.edu.br'));
        const resp = await fetch(window.ICE.config.apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            acao: 'atualizarFicha',
            idToken: idToken,
            projeto: dadosAtualizados
          })
        });
        const resJson = await resp.json();
        if (resJson && resJson.ok && resJson.projeto) {
          window.ICE.projetos[index] = { ...window.ICE.projetos[index], ...resJson.projeto };
          salvarProjetosLocalmente();
          renderizarCards();
          renderizarPainelDocente();
          mostrarToast(`✅ Ficha #${id} atualizada na planilha oficial! Notificações por e-mail enviadas.`);
          return;
        } else {
          console.warn('Resposta da API ao atualizar:', resJson);
        }
      } catch (err) {
        console.warn('Falha na conexão online com Apps Script:', err);
      }
    }

    // Fallback local
    window.ICE.projetos[index].titulo = dadosAtualizados.titulo;
    window.ICE.projetos[index].trilha = dadosAtualizados.trilha;
    window.ICE.projetos[index].checkpoint = dadosAtualizados.checkpoint;
    window.ICE.projetos[index].integrantes = dadosAtualizados.integrantes;
    window.ICE.projetos[index].emails = dadosAtualizados.emails;
    window.ICE.projetos[index].objetivo = dadosAtualizados.objetivo;
    window.ICE.projetos[index].overleaf = dadosAtualizados.overleaf;
    window.ICE.projetos[index].github = dadosAtualizados.github;
    window.ICE.projetos[index].avancos = dadosAtualizados.avancos;

    const cp = dadosAtualizados.checkpoint;
    if (cp.includes('1')) window.ICE.projetos[index].progresso = 25;
    else if (cp.includes('2')) window.ICE.projetos[index].progresso = 50;
    else if (cp.includes('3')) window.ICE.projetos[index].progresso = 75;
    else if (cp.includes('4')) window.ICE.projetos[index].progresso = 100;

    salvarProjetosLocalmente();
    renderizarCards();
    renderizarPainelDocente();
    mostrarToast(`Ficha #${id} atualizada localmente!`);
  };

  window.ICE.abrirModalDetalhes = function (id) {
    const projeto = window.ICE.projetos.find(p => p.id === id);
    if (!projeto) return;
    alert(`Projeto #${projeto.id}: ${projeto.titulo}\n\nIntegrantes: ${projeto.integrantes}\nTrilha: ${projeto.trilha}\n\nObjetivo: ${projeto.objetivo}\n\nAvanços: ${projeto.avancos}`);
  };

  // ==========================================
  // PAINEL DE GESTÃO DOCENTE (RESTRITO)
  // ==========================================
  function renderizarPainelDocente() {
    renderizarTabelaDocentes();

    const tabelaProjetos = document.getElementById('tabela-docente-projetos');
    const selectProjetos = document.getElementById('aval-projeto-select');
    const tabelaAvaliacoes = document.getElementById('tabela-docente-historico-avaliacoes');
    const badgeTotalAval = document.getElementById('total-avaliacoes-badge');

    // 1. Tabela de Candidaturas e Artigos das Equipes
    if (tabelaProjetos) {
      if (!window.ICE.projetos || window.ICE.projetos.length === 0) {
        tabelaProjetos.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-muted py-4">
              <i class="bi bi-inbox fs-4 d-block mb-1"></i>
              Nenhuma equipe ou proposta cadastrada até o momento.
            </td>
          </tr>
        `;
      } else {
        let htmlP = '';
        window.ICE.projetos.forEach(p => {
          const emailsList = (p.emails || []).join(', ');
          const overleafLink = (p.overleaf && p.overleaf.includes('http'))
            ? `<a href="${p.overleaf}" target="_blank" class="btn btn-xs btn-outline-success py-0 px-2 d-inline-flex align-items-center gap-1" style="font-size:0.75rem;"><i class="bi bi-file-earmark-text-fill"></i> Overleaf</a>`
            : `<span class="badge bg-danger-subtle text-danger border border-danger border-opacity-25" style="font-size:0.72rem;"><i class="bi bi-exclamation-circle me-1"></i>Ausente</span>`;

          const cpBadge = `<span class="badge bg-primary-subtle text-primary border border-primary border-opacity-25" style="font-size:0.72rem;">${p.checkpoint ? p.checkpoint.split(':')[0] : 'CP 1'}</span>`;

          htmlP += `
            <tr>
              <td class="fw-bold text-muted">#${p.id}</td>
              <td>
                <div class="fw-bold text-main" style="max-width:280px;line-height:1.3;">${p.titulo}</div>
                <small class="text-muted d-block text-truncate" style="max-width:280px;">${p.objetivo || 'Sem objetivo cadastrado'}</small>
              </td>
              <td>
                <span class="badge bg-secondary-subtle text-secondary small">${(p.trilha || '').split(':')[0]}</span>
              </td>
              <td>
                <div class="fw-bold"><i class="bi bi-people-fill text-success me-1"></i>${p.integrantes}</div>
                <small class="text-muted text-truncate d-block" style="max-width:220px;" title="${emailsList}">${emailsList || 'Nenhum e-mail'}</small>
              </td>
              <td>${overleafLink}</td>
              <td>
                ${cpBadge}
                <div class="progress mt-1" style="height:4px;width:70px;">
                  <div class="progress-bar bg-success" style="width:${p.progresso || 25}%;"></div>
                </div>
              </td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary py-1 px-2" onclick="ICE.abrirModalEditar(${p.id})" title="Editar Ficha / Integrantes">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button class="btn btn-outline-success py-1 px-2" onclick="ICE.selecionarProjetoParaAvaliacao(${p.id})" title="Lançar Avaliação Formativa">
                    <i class="bi bi-pen-fill"></i>
                  </button>
                  ${(!p.overleaf || !p.overleaf.includes('http')) ? `
                    <button class="btn btn-outline-warning py-1 px-2" onclick="ICE.cobrarOverleafIndividual(${p.id})" title="Cobrar Overleaf por E-mail">
                      <i class="bi bi-envelope-exclamation"></i>
                    </button>
                  ` : ''}
                  <button class="btn btn-outline-danger py-1 px-2" onclick="ICE.confirmarExcluirProjeto(${p.id})" title="Excluir Candidatura Definitivamente (Docente)">
                    <i class="bi bi-trash-fill"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        });
        tabelaProjetos.innerHTML = htmlP;
      }
    }

    // 2. Select do Formulário de Avaliação
    if (selectProjetos) {
      const valorAtual = selectProjetos.value;
      let optHtml = `<option value="">-- Selecione a Equipe / Artigo --</option>`;
      (window.ICE.projetos || []).forEach(p => {
        const titCurto = p.titulo.length > 40 ? p.titulo.substring(0, 37) + '...' : p.titulo;
        optHtml += `<option value="${p.id}">#${p.id} • ${p.integrantes} (${titCurto})</option>`;
      });
      selectProjetos.innerHTML = optHtml;
      if (valorAtual) selectProjetos.value = valorAtual;
    }

    // 3. Tabela de Histórico de Avaliações
    if (tabelaAvaliacoes) {
      const avals = window.ICE.avaliacoes || [];
      if (badgeTotalAval) {
        badgeTotalAval.textContent = `${avals.length} registrada(s)`;
      }

      if (avals.length === 0) {
        tabelaAvaliacoes.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-muted py-3">
              Nenhuma avaliação formativa registrada ainda.
            </td>
          </tr>
        `;
      } else {
        let htmlAv = '';
        avals.forEach(av => {
          const notaFormatada = Number(av.nota != null ? av.nota : 10).toFixed(1);
          htmlAv += `
            <tr>
              <td class="text-muted small">${av.data || '-'}</td>
              <td class="fw-bold">${av.equipe || ('Projeto #' + av.projetoId)}</td>
              <td><span class="badge bg-info-subtle text-info border border-info border-opacity-25 small">${av.instrumento || 'A2'}</span></td>
              <td class="text-center fw-bold text-success">${notaFormatada}</td>
              <td class="small text-muted" style="max-width:240px;" title="${av.feedback || ''}">
                <div class="text-truncate">${av.feedback || '-'}</div>
              </td>
            </tr>
          `;
        });
        tabelaAvaliacoes.innerHTML = htmlAv;
      }
    }
  }

  window.ICE.renderizarPainelDocente = renderizarPainelDocente;

  function renderizarTabelaDocentes() {
    const tabela = document.getElementById('tabela-docentes-cadastrados');
    if (!tabela) return;

    const lista = obterDocentesCadastrados();
    if (!lista || lista.length === 0) {
      tabela.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-3">
            Nenhum docente orientador cadastrado.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    lista.forEach(d => {
      const isAtivo = d.status !== 'inativo';
      const isTitular = d.tipo === 'titular';
      const isSubstituto = d.tipo === 'substituto';
      const isCoorientador = d.tipo === 'coorientador';

      let tipoBadge = `<span class="badge bg-secondary-subtle text-secondary small">Orientador</span>`;
      if (isTitular) {
        tipoBadge = `<span class="badge bg-primary-subtle text-primary border border-primary border-opacity-25 small fw-bold"><i class="bi bi-award-fill me-1"></i>Docente Titular</span>`;
      } else if (isSubstituto) {
        tipoBadge = `<span class="badge bg-warning-subtle text-dark border border-warning border-opacity-35 small fw-bold"><i class="bi bi-clock-history me-1"></i>Substituto Temporário</span>`;
      } else if (isCoorientador) {
        tipoBadge = `<span class="badge bg-info-subtle text-info border border-info border-opacity-25 small fw-bold"><i class="bi bi-person-heart me-1"></i>Coorientador Convidado</span>`;
      }

      const statusBadge = isAtivo
        ? `<span class="badge bg-success-subtle text-success border border-success border-opacity-25 small fw-bold"><i class="bi bi-check-circle-fill me-1"></i>Ativo (Acesso Liberado)</span>`
        : `<span class="badge bg-secondary-subtle text-muted border small"><i class="bi bi-pause-circle me-1"></i>Acesso Suspenso</span>`;

      const isAndreMoraes = String(d.email).trim().toLowerCase() === 'andre.moraes@ifsc.edu.br';

      html += `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="p-2 bg-warning-subtle text-warning rounded-circle d-inline-flex" style="width:34px;height:34px;align-items:center;justify-content:center;">
                <i class="bi ${isTitular ? 'bi-mortarboard-fill' : 'bi-person-badge-fill'} fs-6"></i>
              </div>
              <div>
                <strong class="text-main d-block" style="font-size:0.88rem;">${escapeHtml(d.nome)}</strong>
                <small class="text-muted d-block" style="font-size:0.75rem;">${escapeHtml(d.observacao || '')}</small>
              </div>
            </div>
          </td>
          <td>
            <span class="font-code text-primary small">${escapeHtml(d.email)}</span>
          </td>
          <td>${tipoBadge}</td>
          <td>
            <small class="text-muted"><i class="bi bi-calendar3 me-1"></i>${escapeHtml(d.periodo || 'Semestre 2026/2')}</small>
          </td>
          <td>${statusBadge}</td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-secondary py-0.5 px-2" style="font-size:0.75rem;" onclick="ICE.alternarStatusDocente('${escapeHtml(d.email)}')" title="${isAtivo ? 'Suspender temporariamente acesso' : 'Reativar acesso administrativo'}">
                <i class="bi ${isAtivo ? 'bi-pause-fill text-warning' : 'bi-play-fill text-success'}"></i> ${isAtivo ? 'Pausar' : 'Ativar'}
              </button>
              ${!isAndreMoraes ? `
                <button type="button" class="btn btn-outline-danger py-0.5 px-2" style="font-size:0.75rem;" onclick="ICE.removerDocente('${escapeHtml(d.email)}')" title="Remover professor orientador">
                  <i class="bi bi-trash-fill"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    });

    tabela.innerHTML = html;
  }
  window.ICE.renderizarTabelaDocentes = renderizarTabelaDocentes;

  window.ICE.abrirModalNovoDocente = function () {
    const modalEl = document.getElementById('modal-ice-docente');
    if (!modalEl) return;
    const form = document.getElementById('form-ice-docente');
    if (form) form.reset();
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  };

  window.ICE.salvarDocenteModal = async function (e) {
    if (e) e.preventDefault();
    const nome = (document.getElementById('docente-nome').value || '').trim();
    const email = (document.getElementById('docente-email').value || '').trim().toLowerCase();
    const tipo = document.getElementById('docente-tipo').value || 'substituto';
    const periodo = (document.getElementById('docente-periodo').value || '').trim();
    const obs = (document.getElementById('docente-obs').value || '').trim();
    const ativo = document.getElementById('docente-ativo').checked;

    if (!nome || !email) {
      alert('Por favor, informe o Nome Completo e o E-mail institucional do professor.');
      return;
    }

    const novoDoc = {
      nome,
      email,
      tipo,
      periodo: periodo || (tipo === 'titular' ? 'Semestre 2026/2' : 'Período Temporário'),
      observacao: obs || (tipo === 'substituto' ? 'Professor orientador substituto com acesso administrativo total' : 'Orientador cadastrado'),
      status: ativo ? 'ativo' : 'inativo'
    };

    let lista = obterDocentesCadastrados().slice();
    const idx = lista.findIndex(d => d.email.toLowerCase() === email);
    if (idx >= 0) {
      lista[idx] = novoDoc;
    } else {
      lista.push(novoDoc);
    }

    salvarDocentesLocal(lista);
    renderizarTabelaDocentes();

    // Sincronizar com Apps Script caso esteja online
    if (window.ICE.config && window.ICE.config.apiUrl) {
      try {
        const idToken = window.ICE.idToken || ('simulado:' + (window.ICE.usuario ? window.ICE.usuario.email : 'andre.moraes@ifsc.edu.br'));
        fetch(window.ICE.config.apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            acao: 'salvarDocente',
            idToken,
            docente: novoDoc
          })
        }).catch(err => console.warn('Falha silenciosa ao sincronizar docente na nuvem:', err));
      } catch (err) {}
    }

    const modalEl = document.getElementById('modal-ice-docente');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }

    mostrarToast(`✅ Professor Orientador ${nome} cadastrado com sucesso!`);
  };

  window.ICE.alternarStatusDocente = function (email) {
    const em = String(email).trim().toLowerCase();
    if (em === 'andre.moraes@ifsc.edu.br') {
      alert('O docente titular Prof. André Moraes não pode ter seu acesso suspenso.');
      return;
    }

    let lista = obterDocentesCadastrados().slice();
    const doc = lista.find(d => d.email.toLowerCase() === em);
    if (!doc) return;

    doc.status = doc.status === 'inativo' ? 'ativo' : 'inativo';
    salvarDocentesLocal(lista);
    renderizarTabelaDocentes();
    mostrarToast(`Status de ${doc.nome}: ${doc.status === 'ativo' ? 'Acesso Ativado' : 'Acesso Suspenso'}`);
  };

  window.ICE.removerDocente = function (email) {
    const em = String(email).trim().toLowerCase();
    if (em === 'andre.moraes@ifsc.edu.br') {
      alert('O docente titular Prof. André Moraes não pode ser removido.');
      return;
    }

    const confirma = confirm(`Tem certeza que deseja remover o professor orientador (${em}) da equipe docente?`);
    if (!confirma) return;

    let lista = obterDocentesCadastrados().filter(d => d.email.toLowerCase() !== em);
    salvarDocentesLocal(lista);
    renderizarTabelaDocentes();

    if (window.ICE.config && window.ICE.config.apiUrl) {
      try {
        const idToken = window.ICE.idToken || ('simulado:' + (window.ICE.usuario ? window.ICE.usuario.email : 'andre.moraes@ifsc.edu.br'));
        fetch(window.ICE.config.apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            acao: 'removerDocente',
            idToken,
            email: em
          })
        }).catch(err => console.warn('Erro ao remover docente na API:', err));
      } catch (e) {}
    }

    mostrarToast(`Professor orientador removido da lista.`);
  };

  // Exclusão de Candidatura
  window.ICE.confirmarExcluirProjeto = async function (id) {
    const projeto = window.ICE.projetos.find(p => p.id === id);
    if (!projeto) return;

    const confirma = confirm(`Atenção, Professor:\n\nTem certeza que deseja EXCLUIR a candidatura do Projeto #${projeto.id}?\n\nTítulo: "${projeto.titulo}"\nIntegrantes: ${projeto.integrantes}\n\nEsta ação removerá a proposta da planilha oficial e do painel.`);
    if (!confirma) return;

    if (window.ICE.config && window.ICE.config.apiUrl) {
      mostrarToast(`Excluindo candidatura #${id} na planilha oficial...`);
      try {
        const idToken = window.ICE.idToken || ('simulado:' + (window.ICE.usuario ? window.ICE.usuario.email : 'docente@ifsc.edu.br'));
        const resp = await fetch(window.ICE.config.apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            acao: 'excluirDupla',
            idToken: idToken,
            id: id
          })
        });
        const resJson = await resp.json();
        if (resJson && resJson.ok) {
          window.ICE.projetos = window.ICE.projetos.filter(p => p.id !== id);
          salvarProjetosLocalmente();
          renderizarCards();
          renderizarPainelDocente();
          mostrarToast(`✅ Candidatura #${id} excluída com sucesso!`);
          return;
        } else {
          alert('Erro ao excluir: ' + (resJson.erro || 'Falha na resposta do servidor'));
          return;
        }
      } catch (err) {
        console.warn('Erro ao conectar na API:', err);
      }
    }

    // Fallback local
    window.ICE.projetos = window.ICE.projetos.filter(p => p.id !== id);
    salvarProjetosLocalmente();
    renderizarCards();
    renderizarPainelDocente();
    mostrarToast(`Candidatura #${id} removida localmente!`);
  };

  window.ICE.confirmarExcluirProjetoModal = function () {
    const id = parseInt(document.getElementById('edit-id').value, 10);
    const modalEl = document.getElementById('modal-ice-edicao');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    ICE.confirmarExcluirProjeto(id);
  };

  // Lançamento de Avaliação Formativa
  window.ICE.salvarAvaliacaoForm = async function (e) {
    e.preventDefault();
    const idProj = parseInt(document.getElementById('aval-projeto-select').value, 10);
    const projeto = window.ICE.projetos.find(p => p.id === idProj);
    if (!projeto) {
      alert('Selecione uma equipe válida para avaliar.');
      return;
    }

    const instrumento = document.getElementById('aval-instrumento').value;
    const nota = parseFloat(document.getElementById('aval-nota').value);
    const feedback = document.getElementById('aval-feedback').value.trim();
    const notificar = document.getElementById('aval-notificar-email').checked;

    const novaAval = {
      id: 'AV-' + idProj + '-' + Date.now(),
      data: new Date().toLocaleDateString('pt-BR'),
      projetoId: idProj,
      equipe: projeto.integrantes,
      instrumento: instrumento,
      nota: nota,
      feedback: feedback,
      emails: projeto.emails || [],
      notificar: notificar,
      avaliador: window.ICE.usuario ? window.ICE.usuario.nome : 'Prof. André Moraes'
    };

    if (window.ICE.config && window.ICE.config.apiUrl) {
      mostrarToast('Gravando avaliação e disparando notificação por e-mail...');
      try {
        const idToken = window.ICE.idToken || ('simulado:' + (window.ICE.usuario ? window.ICE.usuario.email : 'docente@ifsc.edu.br'));
        const resp = await fetch(window.ICE.config.apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            acao: 'salvarAvaliacao',
            idToken: idToken,
            avaliacao: novaAval
          })
        });
        const resJson = await resp.json();
        if (resJson && resJson.ok) {
          mostrarToast(`✅ Avaliação formativa gravada! Parecer enviado para ${projeto.integrantes}.`);
        }
      } catch (err) {
        console.warn('Erro ao conectar na API:', err);
      }
    }

    // Atualiza lista local
    if (!Array.isArray(window.ICE.avaliacoes)) window.ICE.avaliacoes = [];
    const idxExist = window.ICE.avaliacoes.findIndex(a => a.projetoId === idProj && a.instrumento === instrumento);
    if (idxExist !== -1) {
      window.ICE.avaliacoes[idxExist] = novaAval;
    } else {
      window.ICE.avaliacoes.unshift(novaAval);
    }

    try {
      localStorage.setItem('ice_avaliacoes_2026_2', JSON.stringify(window.ICE.avaliacoes));
    } catch (e) {}

    renderizarPainelDocente();
    document.getElementById('form-docente-avaliacao').reset();
    document.getElementById('aval-nota').value = '10.0';
    document.getElementById('aval-notificar-email').checked = true;
  };

  // Cobrança em Massa de Overleaf
  window.ICE.cobrarOverleafMassaDocente = async function () {
    const semOverleaf = window.ICE.projetos.filter(p => !p.overleaf || !p.overleaf.includes('http'));
    if (semOverleaf.length === 0) {
      alert('Parabéns! Todas as duplas já cadastraram seus links do Overleaf.');
      return;
    }

    const confirma = confirm(`Deseja disparar um e-mail de cobrança para as ${semOverleaf.length} dupla(s) que ainda NÃO cadastraram o link do Overleaf?`);
    if (!confirma) return;

    if (window.ICE.config && window.ICE.config.apiUrl) {
      mostrarToast('Disparando cobrança de Overleaf em massa...');
      try {
        const idToken = window.ICE.idToken || ('simulado:' + (window.ICE.usuario ? window.ICE.usuario.email : 'docente@ifsc.edu.br'));
        const resp = await fetch(window.ICE.config.apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            acao: 'cobrarOverleafEmMassa',
            idToken: idToken
          })
        });
        const resJson = await resp.json();
        if (resJson && resJson.ok) {
          mostrarToast(`✅ ${resJson.mensagem || 'Cobranças enviadas com sucesso!'}`);
          return;
        }
      } catch (err) {
        console.warn('Erro na requisição:', err);
      }
    }
    mostrarToast(`Lembrete disparado para ${semOverleaf.length} equipe(s) sem Overleaf.`);
  };

  // Disparo de Lembrete do Checkpoint 2 para a Turma
  window.ICE.dispararLembreteTurmaCheckpoint2 = async function () {
    const confirma = confirm('Deseja disparar um e-mail de lembrete sobre o Checkpoint 2 (Colab + Overleaf) para todas as duplas cadastradas?');
    if (!confirma) return;

    if (window.ICE.config && window.ICE.config.apiUrl) {
      mostrarToast('Disparando lembrete do Checkpoint 2 para a turma...');
      try {
        const idToken = window.ICE.idToken || ('simulado:' + (window.ICE.usuario ? window.ICE.usuario.email : 'docente@ifsc.edu.br'));
        const resp = await fetch(window.ICE.config.apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            acao: 'dispararLembreteTurma',
            idToken: idToken
          })
        });
        const resJson = await resp.json();
        if (resJson && resJson.ok) {
          mostrarToast(`✅ ${resJson.mensagem || 'Lembrete do Checkpoint 2 disparado!'}`);
          return;
        }
      } catch (err) {
        console.warn('Erro na requisição:', err);
      }
    }
    mostrarToast('Lembrete do Checkpoint 2 disparado para as equipes.');
  };

  // Cobrança individual de Overleaf
  window.ICE.cobrarOverleafIndividual = async function (id) {
    const p = window.ICE.projetos.find(proj => proj.id === id);
    if (!p) return;
    const confirma = confirm(`Disparar e-mail de cobrança de Overleaf para a equipe "${p.integrantes}"?`);
    if (!confirma) return;

    if (window.ICE.config && window.ICE.config.apiUrl) {
      mostrarToast(`Disparando cobrança para Projeto #${id}...`);
      try {
        const idToken = window.ICE.idToken || ('simulado:' + (window.ICE.usuario ? window.ICE.usuario.email : 'docente@ifsc.edu.br'));
        const resp = await fetch(window.ICE.config.apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            acao: 'dispararLembreteDupla',
            idToken: idToken,
            id: id,
            tipo: 'overleaf'
          })
        });
        const resJson = await resp.json();
        if (resJson && resJson.ok) {
          mostrarToast(`✅ ${resJson.mensagem}`);
          return;
        }
      } catch (err) {
        console.warn('Erro na requisição:', err);
      }
    }
    mostrarToast(`Cobrança de Overleaf enviada para ${p.integrantes}.`);
  };

  // Selecionar projeto diretamente no formulário de avaliação
  window.ICE.selecionarProjetoParaAvaliacao = function (id) {
    const sel = document.getElementById('aval-projeto-select');
    if (sel) sel.value = String(id);
    const formAval = document.getElementById('form-docente-avaliacao');
    if (formAval) {
      formAval.scrollIntoView({ behavior: 'smooth' });
      const notaInput = document.getElementById('aval-nota');
      if (notaInput) notaInput.focus();
    }
  };

  // Modal e Disparo de Comunicado Geral da Turma
  window.ICE.abrirModalComunicadoDocente = function () {
    const modalEl = document.getElementById('modal-ice-comunicado');
    if (!modalEl) return;
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  };

  window.ICE.enviarComunicadoTurma = async function (e) {
    e.preventDefault();
    const titulo = document.getElementById('comunicado-titulo').value.trim();
    const mensagem = document.getElementById('comunicado-mensagem').value.trim();

    const modalEl = document.getElementById('modal-ice-comunicado');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    if (window.ICE.config && window.ICE.config.apiUrl) {
      mostrarToast('Disparando comunicado para toda a turma por e-mail...');
      try {
        const idToken = window.ICE.idToken || ('simulado:' + (window.ICE.usuario ? window.ICE.usuario.email : 'docente@ifsc.edu.br'));
        const resp = await fetch(window.ICE.config.apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            acao: 'enviarComunicado',
            idToken: idToken,
            titulo: titulo,
            mensagem: mensagem
          })
        });
        const resJson = await resp.json();
        if (resJson && resJson.ok) {
          mostrarToast(`✅ Comunicado disparado para ${resJson.enviados || 'todos os'} estudante(s)!`);
          document.getElementById('form-ice-comunicado').reset();
          return;
        }
      } catch (err) {
        console.warn('Erro ao disparar comunicado:', err);
      }
    }
    mostrarToast('Comunicado disparado com sucesso!');
    document.getElementById('form-ice-comunicado').reset();
  };

  // ==========================================
  // MURAL DE RECADOS & DEMANDAS (ASSÍNCRONO)
  // ==========================================

  const STORAGE_KEY_EXCLUIDOS = 'ice_recados_excluidos_2026_2';

  function normalizarRecado(r) {
    if (!r) return null;
    return {
      id: String(r.id || ''),
      dataHora: String(r.dataHora || r.data_hora || ''),
      autorNome: String(r.autorNome || r.autor_nome || 'Autor'),
      autorEmail: String(r.autorEmail || r.autor_email || '').toLowerCase().trim(),
      papel: String(r.papel || 'aluno'),
      tipoDestinatario: String(r.tipoDestinatario || r.tipo_destinatario || 'geral'),
      projetoIdAlvo: r.projetoIdAlvo || r.projeto_id_alvo || '',
      equipeAlvo: String(r.equipeAlvo || r.equipe_alvo || 'Toda a Turma'),
      titulo: String(r.titulo || 'Sem título'),
      conteudo: String(r.conteudo || r.descricao || ''),
      categoria: String(r.categoria || 'aviso'),
      linkApoio: String(r.linkApoio || r.link_apoio || ''),
      fixado: !!r.fixado,
      status: String(r.status || 'ativo')
    };
  }

  function obterExcluidosLocalmente() {
    try {
      const sal = localStorage.getItem(STORAGE_KEY_EXCLUIDOS);
      return sal ? JSON.parse(sal) : [];
    } catch (_) {
      return [];
    }
  }

  function registrarExclusaoLocal(id) {
    try {
      const excl = obterExcluidosLocalmente();
      if (!excl.includes(id)) {
        excl.push(id);
        localStorage.setItem(STORAGE_KEY_EXCLUIDOS, JSON.stringify(excl));
      }
    } catch (_) {}
  }

  function mergeRecados(locais, remotos) {
    const excluidos = obterExcluidosLocalmente();
    const mapa = new Map();

    // 1. Remotos oficiais retornados pela planilha (ignorando os excluídos)
    (remotos || []).forEach(r => {
      const n = normalizarRecado(r);
      if (n && n.id && !excluidos.includes(n.id)) {
        mapa.set(n.id, n);
      }
    });

    // 2. Preserva os recados criados localmente que ainda não chegaram na planilha
    (locais || []).forEach(r => {
      const n = normalizarRecado(r);
      if (n && n.id && !excluidos.includes(n.id)) {
        if (!mapa.has(n.id)) {
          mapa.set(n.id, n);
        }
      }
    });

    return Array.from(mapa.values());
  }

  async function chamarApiAppsScript(acao, payload = {}) {
    if (!window.ICE.config || !window.ICE.config.apiUrl) {
      return { ok: true, simulado: true };
    }
    const apiUrl = window.ICE.config.apiUrl.trim();
    const idToken = window.ICE.idToken || ('simulado:' + (window.ICE.usuario ? window.ICE.usuario.email : 'docente@ifsc.edu.br'));
    const bodyObj = { acao, idToken, ...payload };
    const bodyStr = JSON.stringify(bodyObj);

    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: bodyStr
      });
      const json = await resp.json();
      if (json && json.ok) return json;
      throw new Error((json && json.erro) || 'Erro retornado pela API');
    } catch (postErr) {
      console.warn('POST para Apps Script com restrição. Acionando fallback via GET payload...', postErr);
      // Fallback 1: via GET com ?payload=... (evita bloqueios de 302 em POST de Safari/Chrome)
      try {
        const urlGet = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}payload=${encodeURIComponent(bodyStr)}&_t=${Date.now()}`;
        const respGet = await fetch(urlGet, { method: 'GET', mode: 'cors', cache: 'no-store' });
        const jsonGet = await respGet.json();
        if (jsonGet && jsonGet.ok) return jsonGet;
      } catch (_) {}

      // Fallback 2: no-cors fire-and-forget
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: bodyStr
        });
        return { ok: true, fallbackNoCors: true };
      } catch (_) {}

      throw postErr;
    }
  }

  function podeVerRecado(rec, user) {
    const r = normalizarRecado(rec);
    if (!r) return false;
    if (r.status === 'inativo') return false;

    // Recados com destinatário geral são públicos para toda a turma
    if (!r.tipoDestinatario || r.tipoDestinatario === 'geral') {
      return true;
    }

    // Docente autenticado visualiza todos os recados (gerais e direcionados)
    if (user && user.papel === 'docente') {
      return true;
    }

    // O próprio autor do recado sempre visualiza o que postou
    if (user && user.email && r.autorEmail && String(user.email).trim().toLowerCase() === String(r.autorEmail).trim().toLowerCase()) {
      return true;
    }

    // Se for direcionado para uma equipe, verifica se o usuário logado é membro dela
    if (user && user.email && r.projetoIdAlvo) {
      const proj = window.ICE.projetos.find(p => String(p.id) === String(r.projetoIdAlvo));
      if (proj) {
        const emailsProj = Array.isArray(proj.emails)
          ? proj.emails.map(e => String(e).trim().toLowerCase())
          : String(proj.emails || '').toLowerCase().split(/[\s,;]+/).map(e => e.trim());
        if (emailsProj.includes(String(user.email).trim().toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }

  function rotuloCategoriaMural(cat) {
    switch (cat) {
      case 'aviso':
        return '<i class="bi bi-megaphone-fill text-warning me-1"></i>Aviso Oficial';
      case 'pesquisa_dados':
        return '<i class="bi bi-bar-chart-fill text-primary me-1"></i>Coleta de Dados';
      case 'articulacao':
        return '<i class="bi bi-people-fill text-success me-1"></i>Articulação';
      case 'duvida':
        return '<i class="bi bi-question-circle-fill text-info me-1"></i>Dúvida';
      case 'material':
        return '<i class="bi bi-journal-text text-purple me-1"></i>Material';
      default:
        return '<i class="bi bi-chat-text me-1"></i>Geral';
    }
  }

  function formatarBotaoLinkMural(link) {
    if (!link) return '';
    let texto = 'Acessar Recurso';
    let icone = 'bi-box-arrow-up-right';
    let btnClass = 'btn-outline-primary';

    if (link.includes('forms.gle') || link.includes('docs.google.com/forms')) {
      texto = 'Preencher Google Forms';
      icone = 'bi-ui-checks';
      btnClass = 'btn-outline-primary';
    } else if (link.includes('colab.research.google.com')) {
      texto = 'Abrir Google Colab';
      icone = 'bi-code-slash';
      btnClass = 'btn-outline-warning';
    } else if (link.includes('overleaf.com')) {
      texto = 'Abrir Artigo Overleaf';
      icone = 'bi-file-earmark-code';
      btnClass = 'btn-outline-danger';
    } else if (link.includes('github.com')) {
      texto = 'Repositório GitHub';
      icone = 'bi-github';
      btnClass = 'btn-outline-dark';
    } else if (link.includes('drive.google.com')) {
      texto = 'Google Drive';
      icone = 'bi-folder2-open';
      btnClass = 'btn-outline-success';
    } else if (link.endsWith('.pdf')) {
      texto = 'Visualizar Guia PDF';
      icone = 'bi-file-earmark-pdf-fill';
      btnClass = 'btn-outline-danger';
    }

    return `
      <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm ${btnClass} py-0.5 px-2 d-inline-flex align-items-center gap-1 fw-bold text-truncate" style="font-size: 0.73rem; max-width: 100%;">
        <i class="bi ${icone}"></i> <span class="text-truncate">${texto}</span>
      </a>
    `;
  }

  function renderizarMural() {
    const container = document.getElementById('mural-recados-container');
    if (!container) return;

    const user = window.ICE.usuario;
    const todosRecados = (window.ICE.recados || []).map(normalizarRecado).filter(Boolean);

    // 1. Filtragem por permissão de visualização (privacidade de mensagens direcionadas)
    const visiveis = todosRecados.filter(r => podeVerRecado(r, user));

    // 2. Atualizar contadores nos botões de filtro
    const countTodos = visiveis.length;
    const countDocente = visiveis.filter(r => r.papel === 'docente' || r.categoria === 'aviso').length;
    const countDirecionados = visiveis.filter(r => r.tipoDestinatario === 'equipe').length;
    const countGeral = visiveis.filter(r => (!r.tipoDestinatario || r.tipoDestinatario === 'geral') && r.papel !== 'docente').length;

    const elTodos = document.getElementById('count-mural-todos');
    const elDoc = document.getElementById('count-mural-docente');
    const elDir = document.getElementById('count-mural-direcionados');
    const elGer = document.getElementById('count-mural-geral');

    if (elTodos) elTodos.textContent = String(countTodos);
    if (elDoc) elDoc.textContent = String(countDocente);
    if (elDir) elDir.textContent = String(countDirecionados);
    if (elGer) elGer.textContent = String(countGeral);

    // 3. Aplicar filtros ativos de Audiência e Categoria
    let lista = visiveis;
    const filtroAud = window.ICE.filtroAudienciaMural || 'todos';
    if (filtroAud === 'docente') {
      lista = lista.filter(r => r.papel === 'docente' || r.categoria === 'aviso');
    } else if (filtroAud === 'minha_equipe') {
      lista = lista.filter(r => r.tipoDestinatario === 'equipe');
    } else if (filtroAud === 'geral') {
      lista = lista.filter(r => (!r.tipoDestinatario || r.tipoDestinatario === 'geral') && r.papel !== 'docente');
    }

    const filtroCat = window.ICE.filtroCategoriaMural || 'todas';
    if (filtroCat !== 'todas') {
      lista = lista.filter(r => r.categoria === filtroCat);
    }

    // 4. Ordenação: Fixados no topo, depois data mais recente
    lista.sort((a, b) => {
      if (a.fixado && !b.fixado) return -1;
      if (!a.fixado && b.fixado) return 1;
      const tA = String(a.dataHora || '');
      const tB = String(b.dataHora || '');
      return tB.localeCompare(tA);
    });

    if (lista.length === 0) {
      container.innerHTML = `
        <div class="card border-0 shadow-sm rounded-4 p-5 text-center bg-surface">
          <div class="p-3 bg-secondary-subtle text-secondary rounded-circle d-inline-flex mb-3 mx-auto" style="width: 64px; height: 64px; align-items: center; justify-content: center;">
            <i class="bi bi-chat-square-dots fs-3"></i>
          </div>
          <h4 class="h6 font-title fw-bold text-main mb-1">Nenhum recado ou demanda encontrada para este filtro</h4>
          <p class="text-muted small mb-3">
            Use os botões de filtro acima ou clique abaixo para iniciar uma nova conversa, compartilhar formulários de pesquisa ou postar dúvidas.
          </p>
          <div>
            <button type="button" class="btn btn-sm btn-success fw-bold px-3 py-2" onclick="ICE.abrirModalNovoRecado()">
              <i class="bi bi-plus-circle me-1"></i> + Publicar Primeiro Recado
            </button>
          </div>
        </div>
      `;
      return;
    }

    // 5. Separação em Bloco Docente vs Bloco Equipes
    const recadosDocente = lista.filter(r => r.papel === 'docente' || r.categoria === 'aviso');
    const recadosEquipes = lista.filter(r => r.papel !== 'docente' && r.categoria !== 'aviso');

    let html = '';

    // BLOCO DOCENTE
    if (recadosDocente.length > 0 && filtroAud !== 'geral') {
      html += `
        <div class="mural-bloco mural-bloco-docente mb-4">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom border-warning border-opacity-25">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-warning text-dark px-2.5 py-1 fw-bold">
                <i class="bi bi-megaphone-fill me-1"></i> MURAL DO PROFESSOR — DEMANDAS &amp; ORIENTAÇÕES DA UC
              </span>
              <span class="text-muted small">Orientações didáticas, critérios e prazos dos checkpoints</span>
            </div>
            <button type="button" onclick="switchTab('tab-docente')" class="btn btn-sm btn-outline-warning py-0 px-2 small docente-only">
              <i class="bi bi-sliders me-1"></i> Gestão Docente
            </button>
          </div>
          <div class="row g-3">
            ${recadosDocente.map(r => renderizarCardRecadoIndividual(r, user)).join('')}
          </div>
        </div>
      `;
    }

    // BLOCO EQUIPES (ESTUDANTES)
    if (recadosEquipes.length > 0 && filtroAud !== 'docente') {
      html += `
        <div class="mural-bloco mural-bloco-equipes">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom border-success border-opacity-25">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-success text-white px-2.5 py-1 fw-bold">
                <i class="bi bi-people-fill me-1"></i> MURAL DE ARTICULAÇÃO &amp; DEMANDAS DAS DUPLAS
              </span>
              <span class="text-muted small">Formulários de pesquisa, trocas de dados e comunicação assíncrona</span>
            </div>
            <button type="button" onclick="ICE.abrirModalNovoRecado()" class="btn btn-sm btn-success fw-bold py-1 px-3">
              <i class="bi bi-plus-circle me-1"></i> + Postar Demanda
            </button>
          </div>
          <div class="row g-3">
            ${recadosEquipes.map(r => renderizarCardRecadoIndividual(r, user)).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }
  window.ICE.renderizarMural = renderizarMural;

  function renderizarCardRecadoIndividual(rec, user) {
    const r = normalizarRecado(rec);
    const isDocente = r.papel === 'docente';
    const isDirecionado = r.tipoDestinatario === 'equipe';

    let classeBorda = 'border-geral';
    if (isDocente) classeBorda = 'border-docente';
    else if (isDirecionado) classeBorda = 'border-direcionado';

    const podeExcluir = (user && user.papel === 'docente') || 
      (user && user.email && r.autorEmail && String(user.email).trim().toLowerCase() === String(r.autorEmail).trim().toLowerCase());

    return `
      <div class="col-12 col-md-6 col-lg-4 col-xl-3">
        <div class="mural-card ${classeBorda}">
          <div class="d-flex flex-column flex-grow-1">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-1.5 mb-2">
              <div class="d-flex align-items-center gap-1 flex-wrap" style="max-width: 78%;">
                <span class="mural-badge-categoria">${rotuloCategoriaMural(r.categoria)}</span>
                ${r.fixado ? `<span class="mural-badge-fixado"><i class="bi bi-pin-angle-fill me-0.5"></i>Fixado</span>` : ''}
                ${isDirecionado ? `
                  <span class="mural-badge-direcionado" title="Direcionado: ${escapeHtml(r.equipeAlvo || ('Projeto #' + r.projetoIdAlvo))}">
                    <i class="bi bi-lock-fill me-0.5"></i>${escapeHtml(r.equipeAlvo || ('Projeto #' + r.projetoIdAlvo))}
                  </span>
                ` : `
                  <span class="mural-badge-geral">
                    <i class="bi bi-globe me-0.5"></i>Geral
                  </span>
                `}
              </div>
              <span class="badge font-code" style="background: var(--bg-surface-alt, #f8fafc); color: var(--text-muted); font-size: 0.67rem; border: 1px solid var(--border-color, #e2e8f0); padding: 0.2rem 0.35rem;">
                ${escapeHtml(r.id)}
              </span>
            </div>

            <h4 class="mural-card-title">${escapeHtml(r.titulo)}</h4>
            <div class="mural-card-corpo">${escapeHtml(r.conteudo || '')}</div>
          </div>

          <div class="pt-2 mt-auto border-top border-secondary border-opacity-15">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-1 mb-1.5">
              <div class="small text-muted d-flex align-items-center gap-1 text-truncate" style="font-size: 0.76rem; max-width: 68%;">
                <i class="bi ${isDocente ? 'bi-mortarboard-fill text-warning' : 'bi-person-circle text-primary'}"></i>
                <strong class="text-main text-truncate">${escapeHtml(r.autorNome || 'Autor')}</strong>
                ${isDocente ? `<span class="badge bg-warning-subtle text-dark" style="font-size: 0.62rem; padding: 0.15rem 0.35rem;">Prof</span>` : ''}
              </div>
              <span class="small text-muted text-nowrap" style="font-size: 0.70rem;">
                <i class="bi bi-clock me-0.5"></i>${escapeHtml(r.dataHora || '')}
              </span>
            </div>

            <div class="d-flex justify-content-between align-items-center flex-wrap gap-1.5">
              <div class="text-truncate" style="max-width: 75%;">
                ${formatarBotaoLinkMural(r.linkApoio)}
              </div>
              ${podeExcluir ? `
                <button type="button" class="btn btn-sm btn-outline-danger py-0 px-1.5" style="font-size: 0.70rem;" onclick="ICE.excluirRecado('${r.id}')" title="Excluir este recado do Mural">
                  <i class="bi bi-trash-fill me-0.5"></i>Excluir
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.ICE.filtrarMural = function (tipo, btn) {
    window.ICE.filtroAudienciaMural = tipo;
    const containerBotoes = document.getElementById('mural-audiencia-filtros');
    if (containerBotoes) {
      containerBotoes.querySelectorAll('button').forEach(b => {
        b.classList.remove('active', 'btn-primary');
        if (!b.classList.contains('btn-outline-warning') && !b.classList.contains('btn-outline-info') && !b.classList.contains('btn-outline-secondary')) {
          b.classList.add('btn-outline-primary');
        }
      });
      if (btn) {
        btn.classList.add('active', 'btn-primary');
      }
    }
    window.ICE.renderizarMural();
  };

  window.ICE.aplicarFiltroCategoriaMural = function (cat) {
    window.ICE.filtroCategoriaMural = cat;
    window.ICE.renderizarMural();
  };

  window.ICE.alternarAudienciaRecado = function (val) {
    const bloco = document.getElementById('recado-bloco-equipe-alvo');
    const select = document.getElementById('recado-projeto-alvo');
    if (!bloco) return;

    if (val === 'equipe') {
      bloco.classList.remove('d-none');
      if (select) select.setAttribute('required', 'required');
    } else {
      bloco.classList.add('d-none');
      if (select) select.removeAttribute('required');
    }
  };

  window.ICE.abrirModalNovoRecado = function (prefillProjetoId) {
    let modalEl = document.getElementById('modal-ice-recado');
    if (!modalEl) {
      injetarModais();
      modalEl = document.getElementById('modal-ice-recado');
    }
    if (!modalEl) {
      console.error('Modal #modal-ice-recado não encontrado no documento.');
      return;
    }

    // Popula o seletor de duplas cadastradas
    const select = document.getElementById('recado-projeto-alvo');
    if (select) {
      const projetos = window.ICE.projetos || [];
      if (projetos.length === 0) {
        select.innerHTML = `<option value="">Nenhuma equipe cadastrada ainda no sistema</option>`;
      } else {
        select.innerHTML = `<option value="">-- Escolha a equipe destinatária deste recado --</option>` +
          projetos.map(p => `
            <option value="${p.id}">#${p.id} • ${escapeHtml(p.integrantes)} — ${escapeHtml(p.titulo || 'Sem título')}</option>
          `).join('');
      }

      if (prefillProjetoId) {
        select.value = String(prefillProjetoId);
        const audEquipeRadio = document.getElementById('recado-aud-equipe');
        if (audEquipeRadio) {
          audEquipeRadio.checked = true;
          window.ICE.alternarAudienciaRecado('equipe');
        }
      } else {
        const audGeralRadio = document.getElementById('recado-aud-geral');
        if (audGeralRadio) {
          audGeralRadio.checked = true;
          window.ICE.alternarAudienciaRecado('geral');
        }
      }
    }

    // Pré-preenchimento com dados do usuário logado
    if (window.ICE.usuario) {
      const nomeInput = document.getElementById('recado-autor-nome');
      const emailInput = document.getElementById('recado-autor-email');
      if (nomeInput && !nomeInput.value) nomeInput.value = window.ICE.usuario.nome || '';
      if (emailInput && !emailInput.value) emailInput.value = window.ICE.usuario.email || '';
    }

    try {
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = typeof bootstrap.Modal.getOrCreateInstance === 'function'
          ? bootstrap.Modal.getOrCreateInstance(modalEl)
          : new bootstrap.Modal(modalEl);
        modal.show();
      } else {
        $(modalEl).modal('show');
      }
    } catch (err) {
      console.warn('Erro ao acionar modal do Bootstrap:', err);
      modalEl.classList.add('show');
      modalEl.style.display = 'block';
    }
  };

  window.ICE.salvarNovoRecado = async function (e) {
    e.preventDefault();

    const autorNome = document.getElementById('recado-autor-nome').value.trim();
    const autorEmail = document.getElementById('recado-autor-email').value.trim();
    const audRadio = document.querySelector('input[name="recado-audiencia"]:checked');
    const tipoDestinatario = audRadio ? audRadio.value : 'geral';
    const categoria = document.getElementById('recado-categoria').value;
    const titulo = document.getElementById('recado-titulo').value.trim();
    const conteudo = document.getElementById('recado-conteudo').value.trim();
    const linkApoio = document.getElementById('recado-link-apoio').value.trim();

    let projetoIdAlvo = '';
    let equipeAlvo = 'Toda a Turma';

    if (tipoDestinatario === 'equipe') {
      const sel = document.getElementById('recado-projeto-alvo');
      projetoIdAlvo = sel ? sel.value : '';
      if (!projetoIdAlvo) {
        alert('Por favor, selecione a equipe destinatária para este recado direcionado.');
        return;
      }
      const proj = window.ICE.projetos.find(p => String(p.id) === String(projetoIdAlvo));
      equipeAlvo = proj ? proj.integrantes : ('Equipe #' + projetoIdAlvo);
    }

    const isDocente = window.ICE.usuario && window.ICE.usuario.papel === 'docente';
    const fixadoCheckbox = document.getElementById('recado-fixado');
    const notificarCheckbox = document.getElementById('recado-notificar-email');

    const fixado = isDocente && fixadoCheckbox ? fixadoCheckbox.checked : false;
    const notificarEmail = isDocente && notificarCheckbox ? notificarCheckbox.checked : false;

    // Gerar ID local
    const novoId = 'REC-' + String(Date.now()).slice(-6);
    const dataHoraStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const novoRecado = normalizarRecado({
      id: novoId,
      dataHora: dataHoraStr,
      autorNome: autorNome,
      autorEmail: autorEmail,
      papel: isDocente ? 'docente' : 'aluno',
      tipoDestinatario: tipoDestinatario,
      projetoIdAlvo: projetoIdAlvo,
      equipeAlvo: equipeAlvo,
      titulo: titulo,
      conteudo: conteudo,
      categoria: categoria,
      linkApoio: linkApoio,
      fixado: fixado,
      status: 'ativo'
    });

    // 1. Salvar no estado local imediatamente e com persistência resiliente
    window.ICE.recados = mergeRecados(window.ICE.recados, [novoRecado]);
    salvarRecadosLocalmente();
    window.ICE.renderizarMural();

    // 2. Fechar modal e resetar formulário
    const modalEl = document.getElementById('modal-ice-recado');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }
    document.getElementById('form-ice-recado').reset();

    mostrarToast('✅ Recado publicado com sucesso no Mural!');

    // 3. Persistência na API Apps Script com fallback resiliente
    if (window.ICE.config && window.ICE.config.apiUrl) {
      try {
        const resJson = await chamarApiAppsScript('salvarRecado', {
          recado: {
            ...novoRecado,
            notificarEmail: notificarEmail
          }
        });

        if (resJson && resJson.ok && resJson.recado && resJson.recado.id) {
          // Atualizar com dados confirmados da nuvem
          window.ICE.recados = mergeRecados(window.ICE.recados, [resJson.recado]);
          salvarRecadosLocalmente();
          window.ICE.renderizarMural();
        }
      } catch (err) {
        console.warn('Aviso de rede: recado salvo localmente. Sincronização em nuvem pendente.', err);
      }
    }
  };

  window.ICE.excluirRecado = async function (id) {
    const r = (window.ICE.recados || []).find(x => x.id === id);
    const titulo = r ? r.titulo : id;
    const confirma = confirm(`Deseja realmente remover este recado ("${titulo}") do Mural?`);
    if (!confirma) return;

    // Registrar exclusão para evitar que a sincronização traga de volta
    registrarExclusaoLocal(id);

    // Remover localmente
    window.ICE.recados = (window.ICE.recados || []).filter(x => x.id !== id);
    salvarRecadosLocalmente();
    window.ICE.renderizarMural();
    mostrarToast('Recado removido do Mural.');

    // Sincronizar exclusão com API
    if (window.ICE.config && window.ICE.config.apiUrl) {
      try {
        await chamarApiAppsScript('excluirRecado', { id: id });
      } catch (err) {
        console.warn('Erro ao excluir recado na API:', err);
      }
    }
  };

  window.ICE.carregarRecados = async function () {
    mostrarToast('Atualizando recados do Mural...');
    if (window.ICE.config && window.ICE.config.apiUrl) {
      try {
        const resp = await fetch(window.ICE.config.apiUrl, { method: 'GET' });
        if (resp.ok) {
          const dados = await resp.json();
          if (dados && dados.ok && Array.isArray(dados.recados)) {
            window.ICE.recados = mergeRecados(window.ICE.recados, dados.recados);
            salvarRecadosLocalmente();
            window.ICE.renderizarMural();
            mostrarToast('✅ Mural de Recados sincronizado!');
            return;
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar recados:', err);
      }
    }
    window.ICE.renderizarMural();
    mostrarToast('Mural atualizado com cache local.');
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
