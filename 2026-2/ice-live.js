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
      progresso: 30,
      avancos: 'Coleta de coordenadas 3D de poses manuais e estruturação de dataset para análise no Colab.',
      status: 'ativo'
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
      progresso: 50,
      avancos: 'Testes de transmissão sob perda de pacotes concluídos; geração dos gráficos de latência no Colab.',
      status: 'ativo'
    }
  ];

  // ==========================================
  // BANCO DE TEMAS INSPIRADORES (PESQUISA & EXTENSÃO)
  // Foco: Análise de Dados, Acessibilidade, Libras e Telemedicina
  // ==========================================
  const TEMAS_SUGERIDOS = [
    // --- 1. TECNOLOGIA EDUCACIONAL & DEFICIÊNCIAS DIVERSAS (VISUAL / AUDITIVA) ---
    {
      id: 'tema-edu-1',
      categoria: 'educacao_acessibilidade',
      categoriaNome: 'Tec. Educacional & Deficiência Visual',
      badgeCor: 'bg-primary-subtle text-primary border border-primary border-opacity-25',
      icone: 'bi-eye-slash-fill',
      titulo: 'Avaliação Quantitativa de Conformidade WCAG 2.2 em Ambientes Virtuais de Aprendizagem (AVAs): Um Estudo com Foco em Leitores de Tela e Baixa Visão',
      trilha: 'Trilha 2: Acessibilidade & Usabilidade Web',
      descricao: 'Investiga barreiras críticas de acessibilidade (contraste insuficiente, tags semânticas ARIA e operabilidade por teclado) em salas de aula virtuais utilizadas no ensino público e privado.',
      analiseDados: 'Auditoria automatizada com Axe-core e Lighthouse em 10 plataformas de cursos; cálculo estatístico de violações por severidade com Pandas e geração de boxplots/gráficos de barras no Google Colab.',
      extensao: 'Elaboração de um guia prático com recomendações de formatação acessível para docentes da rede pública de Garopaba e região.',
      objetivo: 'Diagnosticar quantitativamente as violações de acessibilidade WCAG 2.2 em Ambientes Virtuais de Aprendizagem (AVAs) e propor um guia de adaptação inclusiva para professores da rede básica e técnica regional.'
    },
    {
      id: 'tema-edu-2',
      categoria: 'educacao_acessibilidade',
      categoriaNome: 'Tec. Educacional & Deficiência Auditiva',
      badgeCor: 'bg-primary-subtle text-primary border border-primary border-opacity-25',
      icone: 'bi-ear-fill',
      titulo: 'Análise de Desempenho e Acurácia de Sistemas de Legenda Automática (Closed Caption) em Videoaulas de Programação: Inclusão de Estudantes Surdos',
      trilha: 'Trilha 1: Ciência de Dados & Dados Abertos',
      descricao: 'Avalia a precisão de ferramentas abertas de reconhecimento de voz e transcrição de áudio ao lidar com terminologia técnica de informática em videoaulas em língua portuguesa.',
      analiseDados: 'Extração e comparação de transcrições com modelo Whisper (OpenAI) e Google Speech; medição de Word Error Rate (WER) com biblioteca jiwer em Python e gráficos de dispersão correlacionando ruído e cadência.',
      extensao: 'Publicação de diretrizes acústicas e técnicas de gravação para instrutores produzirem videoaulas com legendas automáticas de alta fidelidade para estudantes com deficiência auditiva.',
      objetivo: 'Mensurar e correlacionar a taxa de erro de palavras (WER) e o atraso temporal de algoritmos de Closed Caption em videoaulas de computação para subsidiar boas práticas na criação de materiais audiovisuais acessíveis.'
    },
    {
      id: 'tema-edu-3',
      categoria: 'educacao_acessibilidade',
      categoriaNome: 'Tec. Educacional & Acessibilidade Cromática',
      badgeCor: 'bg-primary-subtle text-primary border border-primary border-opacity-25',
      icone: 'bi-palette-fill',
      titulo: 'Diagnóstico de Acessibilidade Cromática e Densidade Visual em Plataformas de Exercícios e Gamificação Educacional para Alunos com Daltonismo',
      trilha: 'Trilha 2: Acessibilidade & Usabilidade Web',
      descricao: 'Mapeia a conformidade cromática de jogos e quizzes didáticos para estudantes com discromatopsias (protanopia, deuteranopia e tritanopia).',
      analiseDados: 'Simulação automatizada de filtros cromáticos via scripts Python/OpenCV; quantificação de áreas de contraste inferior a 4.5:1 e medição de tempos médios de reconhecimento visual.',
      extensao: 'Criação de paleta cromática universal validada para professores e designers instrucionais da educação básica de Santa Catarina.',
      objetivo: 'Avaliar barreiras de contraste e identificação visual de cores em plataformas web gamificadas de ensino, oferecendo um catálogo de paletas e padrões gráficos seguros para estudantes com daltonismo.'
    },

    // --- 2. LINGUAGEM DE SINAIS (LIBRAS & TECNOLOGIAS ASSISTIVAS) ---
    {
      id: 'tema-libras-1',
      categoria: 'linguagem_sinais',
      categoriaNome: 'Libras & Visão Computacional Leve',
      badgeCor: 'bg-success-subtle text-success border border-success border-opacity-25',
      icone: 'bi-hand-index-thumb-fill',
      titulo: 'Análise Comparativa de Latência e Acurácia de Modelos de Visão Computacional Leves (MediaPipe Hands) para Reconhecimento da Datilologia da Libras no Navegador Web',
      trilha: 'Trilha 3: Desempenho & Otimização Web',
      descricao: 'Avalia a viabilidade de reconhecer sinais estáticos do alfabeto manual de Libras diretamente no navegador sem depender de placas de vídeo dedicadas ou servidores caros.',
      analiseDados: 'Testes de inferência em tempo real com MediaPipe Hands em diferentes resoluções de câmera; registro de FPS, tempo por quadro (ms) e matriz de confusão entre letras similares gerada com Seaborn/Matplotlib.',
      extensao: 'Disponibilização de um protótipo web aberto para que escolas e familiares de alunos surdos pratiquem o alfabeto manual de Libras de forma lúdica.',
      objetivo: 'Avaliar o consumo de recursos computacionais e a acurácia de classificação de poses de mão no navegador para reconhecimento do alfabeto da Libras em computadores de baixo custo.'
    },
    {
      id: 'tema-libras-2',
      categoria: 'linguagem_sinais',
      categoriaNome: 'Libras & Letramento em Computação',
      badgeCor: 'bg-success-subtle text-success border border-success border-opacity-25',
      icone: 'bi-translate',
      titulo: 'Mapeamento e Análise Quantitativa da Cobertura Terminológica em Libras para Conceitos Fundamentais de Programação e Sistemas Web',
      trilha: 'Trilha 4: Letramento Digital & Extensão Comunitária',
      descricao: 'Investiga a existência, padronização e lacunas de sinais em Libras para termos cotidianos da área de TI (ex: backend, framework, banco de dados, função, loop).',
      analiseDados: 'Mineração e categorização de dados em repositórios abertos (Glossário IF, INES, VLibras); cálculo da taxa de cobertura de termos e análise de frequência de sinais icônicos vs. dependência de soletração datilológica.',
      extensao: 'Construção de uma página web com glossário colaborativo visual para intérpretes de Libras e calouros surdos dos cursos de computação do IFSC.',
      objetivo: 'Identificar a cobertura vocabular de termos de desenvolvimento web em dicionários digitais de Libras e sistematizar um glossário terminológico para apoio à permanência de estudantes surdos na área de TI.'
    },
    {
      id: 'tema-libras-3',
      categoria: 'linguagem_sinais',
      categoriaNome: 'Libras & Otimização de Rede Web',
      badgeCor: 'bg-success-subtle text-success border border-success border-opacity-25',
      icone: 'bi-wifi',
      titulo: 'Avaliação de Eficiência de Rede e Consumo de Dados em Tradutores Virtuais de Libras (Avatares 3D vs. Vídeo em Streaming) em Ambientes de Baixa Conectividade',
      trilha: 'Trilha 3: Desempenho & Otimização Web',
      descricao: 'Compara a carga de rede e o tempo de carregamento de páginas web governamentais e educacionais que utilizam tradutores em avatar 3D (ex: VLibras) versus intérpretes gravados em vídeo.',
      analiseDados: 'Medição de pacotes de dados (KB transferidos), tempo até a primeira interação (TTI) e taxa de descarte em perfis simulados de rede móvel (3G e 4G) com scripts de teste em Python.',
      extensao: 'Fornecer recomendações a desenvolvedores de sites públicos municipais para otimizar o acesso de cidadãos surdos que utilizam franquias de dados móveis limitadas.',
      objetivo: 'Comparar quantitativamente o consumo de dados de rede e o tempo de resposta entre soluções baseadas em avatares 3D e vídeos convencionais de Libras em portais de serviços públicos.'
    },

    // --- 3. TRANSMISSÃO DE VÍDEO NO AMBIENTE MÉDICO (TELEMEDICINA & BAIXA LATÊNCIA) ---
    {
      id: 'tema-med-1',
      categoria: 'video_medico',
      categoriaNome: 'Vídeo Médico & Streaming em Tempo Real',
      badgeCor: 'bg-danger-subtle text-danger border border-danger border-opacity-25',
      icone: 'bi-camera-video-fill',
      titulo: 'Análise Comparativa de Protocolos de Streaming em Tempo Real (WebRTC vs. HLS vs. SRT) para Transmissão de Vídeos de Exames Médicos com Baixa Latência',
      trilha: 'Trilha 3: Desempenho & Otimização Web',
      descricao: 'Analisa o impacto de oscilações de rede (jitter, perda de pacotes de 1% a 5% e variações de banda) no atraso e na integridade de vídeo para teleconsultas e teleinterconsultas especializadas.',
      analiseDados: 'Testes de transmissão em bancada experimental simulando perdas de pacotes com tc/NetEm; extração de métricas de Round Trip Time (RTT), latência ponta a ponta e quadros congelados usando Python para análise estatística.',
      extensao: 'Orientar equipes de TI e secretarias municipais de saúde na escolha de arquiteturas web resilientes para telemedicina em postos de saúde de bairros periféricos ou rurais.',
      objetivo: 'Investigar empiricamente o comportamento de protocolos de transmissão de vídeo sob condições adversas de rede para definir parâmetros técnicos mínimos em sistemas web de telemedicina regional.'
    },
    {
      id: 'tema-med-2',
      categoria: 'video_medico',
      categoriaNome: 'Vídeo Médico & Compressão com Codecs',
      badgeCor: 'bg-danger-subtle text-danger border border-danger border-opacity-25',
      icone: 'bi-file-earmark-play-fill',
      titulo: 'Avaliação da Degradação da Qualidade Visual Objetiva (PSNR, SSIM e VMAF) em Vídeos Médicos de Cirurgia Laparoscópica sob Diferentes Codecs (AV1, H.265 e H.264)',
      trilha: 'Trilha 1: Ciência de Dados & Dados Abertos',
      descricao: 'Verifica até que ponto a compressão agressiva de vídeo médico para transmissão em conexões de baixa velocidade preserva a acuidade diagnóstica e anatômica necessária para teleducação médica.',
      analiseDados: 'Codificação de amostras abertas de cirurgias endoscópicas com FFmpeg em múltiplos bitrates (500 kbps a 4 Mbps); cômputo frame a frame de métricas de similaridade estrutural (SSIM/PSNR) em Python e plotagem de curvas taxa-distorção.',
      extensao: 'Definição de perfis de codificação de vídeo médico que viabilizem a transmissão de cirurgias e exames para segunda opinião médica em cidades do litoral sem link de alta velocidade.',
      objetivo: 'Determinar a relação entre compressão de dados e preservação da qualidade visual em vídeos laparoscópicos, identificando a taxa de bits mínima que garante confiabilidade diagnóstica à distância.'
    },
    {
      id: 'tema-med-3',
      categoria: 'video_medico',
      categoriaNome: 'Vídeo Médico & Diagnóstico de Infraestrutura SUS',
      badgeCor: 'bg-danger-subtle text-danger border border-danger border-opacity-25',
      icone: 'bi-hospital-fill',
      titulo: 'Diagnóstico da Infraestrutura de Conectividade e Desempenho para Teleinterconsultas Web em Estabelecimentos de Saúde Pública do Litoral Sul Catarinense',
      trilha: 'Trilha 1: Ciência de Dados & Dados Abertos',
      descricao: 'Analisa os dados abertos de telecomunicações e realiza sondagens web para verificar a prontidão dos postos de saúde locais para suporte a teleconsultoria síncrona com vídeo HD.',
      analiseDados: 'Tratamento de bases de dados do Cetic.br (TIC Saúde) e Anatel com Pandas; correlação entre velocidade contratada, taxa de latência média e requisitos do padrão WebRTC médico; criação de gráficos e mapas temáticos.',
      extensao: 'Elaboração de relatório técnico para os Conselhos Municipais de Saúde de Garopaba e região sobre as demandas de infraestrutura para expansão do programa SUS Digital.',
      objetivo: 'Avaliar a infraestrutura digital das Unidades Básicas de Saúde da região em relação aos requisitos mínimos de transmissão de vídeo para telemedicina, indicando gargalos técnicos e soluções de otimização.'
    },

    // --- 4. PROJETOS INTEGRADORES (CROSSOVER PI I & II) ---
    {
      id: 'tema-pi-1',
      categoria: 'crossover_pi',
      categoriaNome: 'Streaming Web & QoE (Crossover JifTV)',
      badgeCor: 'bg-info-subtle text-info border border-info border-opacity-25',
      icone: 'bi-broadcast-pin',
      titulo: 'Análise Comparativa de Algoritmos de Taxa de Bits Adaptativa (ABR) e Métricas de QoE em Transmissões Esportivas Escolares Web sob Redes Móveis Instáveis',
      trilha: 'Trilha 3: Desempenho & Otimização Web',
      descricao: 'Avalia como os algoritmos de seleção de resolução (BOLA, Dynamic e Throughput-based) no HLS/DASH respondem a variações de banda e jitter durante transmissões ao vivo de eventos escolares.',
      analiseDados: 'Extração de logs de telemetria de reprodução do player web (bitrate instantâneo, buffer health e eventos de rebuffer em ms); cálculo estatístico do índice de QoE (ITU-T P.1203) e geração de gráficos de linha e violin plots no Google Colab.',
      extensao: 'Definição de perfil de codificação e guia de boas práticas para transmissão online dos Jogos do Instituto Federal (JIFs) e torneios interclasses sem queda de conexão.',
      objetivo: 'Mensurar o impacto de oscilações de rede móvel na qualidade percebida pelo usuário (QoE) em transmissões web ao vivo, propondo parâmetros ótimos de bitrate para o streaming de eventos escolares comunitários.'
    },
    {
      id: 'tema-pi-2',
      categoria: 'crossover_pi',
      categoriaNome: 'IoT Climática & Dados Abertos (Crossover Estação)',
      badgeCor: 'bg-warning-subtle text-warning border border-warning border-opacity-25',
      icone: 'bi-cloud-sun-fill',
      titulo: 'Mineração de Séries Temporais Microclimáticas em Garopaba a partir de Estações IoT de Baixo Custo: Aplicação em Alertas Ambientais para a Comunidade Local',
      trilha: 'Trilha 1: Ciência de Dados & Dados Abertos',
      descricao: 'Estrutura e analisa os dados coletados por microestações meteorológicas baseadas em Raspberry Pi/ESP32 instaladas no câmpus, correlacionando com previsões oficiais e eventos climáticos extremos.',
      analiseDados: 'Tratamento e limpeza de séries temporais com Pandas; identificação de correlações entre pressão, temperatura e umidade; detecção de anomalias com Isolation Forest e mapas de calor sazonais com Seaborn.',
      extensao: 'Desenvolvimento de um dashboard web aberto para consulta de pescadores artesanais, agricultores e esportistas de Garopaba com alertas meteorológicos de curto prazo.',
      objetivo: 'Construir uma rotina em Python para análise e detecção de padrões microclimáticos costeiros a partir de dados abertos de sensores IoT, disponibilizando indicadores ambientais para a comunidade de Garopaba.'
    },
    {
      id: 'tema-pi-3',
      categoria: 'crossover_pi',
      categoriaNome: 'IA Generativa Local & RAG (Crossover ChatBot)',
      badgeCor: 'bg-primary-subtle text-primary border border-primary border-opacity-25',
      icone: 'bi-chat-dots-fill',
      titulo: 'Avaliação de Eficiência, Latência e Acurácia de Modelos de Linguagem Locais (SLMs/LLMs) com RAG para Atendimento Automatizado ao Estudante em Instituições Públicas',
      trilha: 'Trilha 3: Desempenho & Otimização Web',
      descricao: 'Investiga a viabilidade técnica e precisão de modelos compactos de linguagem (Llama-3, Phi-3, Mistral) rodando localmente (sem custo de API em nuvem) para responder dúvidas frequentes sobre calendários, editais e regulamentos do IFSC.',
      analiseDados: 'Benchmark automatizado de inferência em Python (tempo até o 1º token - TTFT, tokens por segundo e consumo de RAM/VRAM); avaliação da qualidade das respostas com métricas BLEU, ROUGE e taxa de alucinação factual.',
      extensao: 'Implantação de um assistente web de triagem para a Secretaria Acadêmica do Câmpus Garopaba, reduzindo filas e democratizando o acesso a informações acadêmicas.',
      objetivo: 'Avaliar quantitativamente o trade-off entre latência de processamento e acurácia de resposta em modelos de linguagem locais integrados a bancos vetoriais para atendimento estudantil.'
    },
    {
      id: 'tema-pi-4',
      categoria: 'crossover_pi',
      categoriaNome: 'Ciência de Dados no Esporte Escolar (Crossover Scout)',
      badgeCor: 'bg-success-subtle text-success border border-success border-opacity-25',
      icone: 'bi-trophy-fill',
      titulo: 'Modelagem Quantitativa e Visualização Espacial de Desempenho Tático em Esportes Coletivos Escolares a partir de Dados de Scout em Tempo Real',
      trilha: 'Trilha 1: Ciência de Dados & Dados Abertos',
      descricao: 'Explora os dados gerados pelo aplicativo de scout de partidas de voleibol para identificar zonas de fragilidade defensiva, probabilidade de conversão de pontos e fadiga de atletas escolares ao longo dos sets.',
      analiseDados: 'Cálculo de métricas avançadas de rendimento (Sideout Efficiency, Point Scoring Rate); geração de mapas de calor 2D da quadra em Python com Matplotlib e gráficos de radar de habilidades individuais.',
      extensao: 'Oficina prática para professores de educação física e técnicos de projetos sociais esportivos de Garopaba sobre interpretação de métricas de dados para treinos personalizados.',
      objetivo: 'Modelar e visualizar padrões espaciais e estatísticos de desempenho em voleibol escolar, democratizando ferramentas analíticas para escolas municipais da região.'
    },
    {
      id: 'tema-pi-5',
      categoria: 'crossover_pi',
      categoriaNome: 'Jogos Educacionais & Neurodiversidade (Crossover Música & Jogo)',
      badgeCor: 'bg-secondary-subtle text-secondary border border-secondary border-opacity-25',
      icone: 'bi-controller',
      titulo: 'Análise Quantitativa de Usabilidade e Retenção Atencional em Jogos Sérios Acessíveis para Crianças com Dificuldades de Aprendizagem e TDAH',
      trilha: 'Trilha 2: Acessibilidade & Usabilidade Web',
      descricao: 'Mede parâmetros comportamentais e cognitivos de interação de crianças com jogos educativos de estimulação sonora e montagem lógica desenvolvidos em Python/Pygame.',
      analiseDados: 'Registro de logs de cliques, tempo de reação motora (ms), taxas de acerto e curvas de desistência; análise estatística com testes de correlação de Spearman e boxplots de evolução atencional entre sessões.',
      extensao: 'Parceria com as Salas de Recursos Multifuncionais e pedagogos da rede municipal de Garopaba para aplicação e validação dos jogos como recurso pedagógico complementar.',
      objetivo: 'Quantificar a curva de aprendizagem e a manutenção do foco atencional proporcionadas por jogos sérios baseados em estímulos sonoros em crianças da educação básica.'
    },
    {
      id: 'tema-pi-6',
      categoria: 'crossover_pi',
      categoriaNome: 'Patrimônio 3D & Compressão Web (Crossover MAGE)',
      badgeCor: 'bg-danger-subtle text-danger border border-danger border-opacity-25',
      icone: 'bi-box-fill',
      titulo: 'Otimização de Malhas Poligonais e Desempenho de Renderização WebGL em Museus Virtuais Acessíveis: Preservação Digital do Acervo Arqueológico do IFSC',
      trilha: 'Trilha 3: Desempenho & Otimização Web',
      descricao: 'Investiga algoritmos de decimação de malha e compressão geométrica (Draco/KTX2) para permitir que modelos 3D fotogramétricos de fósseis e rochas do laboratório MAGE rodem com fluidez em smartphones de estudantes da rede pública.',
      analiseDados: 'Medição de taxas de transferência (MB baixados), tempo de carregamento de cena (s), taxa de quadros (FPS) e uso de memória GPU sob diferentes níveis de simplificação de malha; curvas de trade-off fidelidade visual vs velocidade.',
      extensao: 'Criação de um portal web de divulgação científica arqueológica e paleontológica para visitação virtual de turmas de escolas fundamentais da região.',
      objetivo: 'Identificar o nível ideal de simplificação geométrica que preserva detalhes anatômicos e científicos de peças arqueológicas enquanto assegura carregamento instantâneo em navegadores populares.'
    }
  ];

  window.ICE.temasSugeridos = TEMAS_SUGERIDOS;

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    carregarProjetos();
    inicializarAuth();
    renderizarVitrineTemas('todos');
    renderizarCards();
    injetarModais();
  });

  // ==========================================
  // GESTÃO DE DADOS (STORAGE + APPS SCRIPT API)
  // ==========================================
  async function carregarProjetos() {
    // 1. Carregamento imediato do cache local para resposta visual instantânea
    try {
      const salvos = localStorage.getItem(STORAGE_KEY_PROJETOS);
      if (salvos) {
        const parsed = JSON.parse(salvos);
        const idsExistentes = new Set(parsed.map(p => p.id));
        DADOS_INICIAIS.forEach(padrao => {
          if (!idsExistentes.has(padrao.id)) {
            parsed.push(padrao);
          }
        });
        window.ICE.projetos = parsed;
      } else {
        window.ICE.projetos = [...DADOS_INICIAIS];
        salvarProjetosLocalmente();
      }
    } catch (e) {
      console.warn('Erro ao carregar do localStorage:', e);
      window.ICE.projetos = [...DADOS_INICIAIS];
    }

    renderizarCards();

    // 2. Sincronização online via Google Apps Script (se apiUrl estiver configurada)
    if (window.ICE.config && window.ICE.config.apiUrl) {
      atualizarBadgeConexao('sincronizando');
      try {
        const resp = await fetch(window.ICE.config.apiUrl, { method: 'GET' });
        if (resp.ok) {
          const dados = await resp.json();
          if (dados && dados.ok && Array.isArray(dados.projetos) && dados.projetos.length > 0) {
            window.ICE.projetos = dados.projetos;
            salvarProjetosLocalmente();
            renderizarCards();
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

    const badgeTotal = document.getElementById('total-equipes-badge');
    if (badgeTotal) {
      badgeTotal.textContent = `${window.ICE.projetos.length} equipe(s) em mentoria`;
    }
  }

  // ==========================================
  // VITRINE DE TEMAS INSPIRADORES
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
        <div class="col-md-6 col-lg-4">
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

              <h5 class="h6 font-title fw-bold text-main mb-2" style="font-size: 0.88rem; line-height: 1.35;">
                ${t.titulo}
              </h5>

              <p class="text-muted small mb-2" style="font-size: 0.79rem; line-height: 1.4;">
                ${t.descricao}
              </p>

              <div class="tema-box-dados">
                <strong class="d-block text-primary small" style="font-size: 0.74rem;">
                  <i class="bi bi-cpu-fill me-1"></i>Análise de Dados &amp; Python:
                </strong>
                <span class="text-secondary" style="font-size: 0.74rem;">${t.analiseDados}</span>
              </div>

              <div class="tema-box-extensao">
                <strong class="d-block text-success small" style="font-size: 0.74rem;">
                  <i class="bi bi-people-fill me-1"></i>Impacto Extensionista:
                </strong>
                <span class="text-secondary" style="font-size: 0.74rem;">${t.extensao}</span>
              </div>
            </div>

            <div class="pt-2 border-top border-secondary border-opacity-15 d-flex justify-content-between align-items-center mt-2">
              <span class="badge bg-secondary-subtle text-secondary" style="font-size: 0.7rem;">
                ${t.trilha.split(':')[0]}
              </span>
              <button class="btn btn-sm btn-outline-success py-1 px-2 d-inline-flex align-items-center gap-1" style="font-size: 0.76rem;" onclick="ICE.adotarTema('${t.id}')">
                <i class="bi bi-magic"></i> Adotar Tema
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
                    <optgroup label="🎓 Tecnologia Educacional &amp; Acessibilidade (Visual / Auditiva)">
                      <option value="tema-edu-1">1. Acessibilidade WCAG 2.2 em Ambientes Virtuais de Aprendizagem (AVAs)</option>
                      <option value="tema-edu-2">2. Desempenho e Acurácia de Legendas Automáticas (Closed Caption) em Videoaulas</option>
                      <option value="tema-edu-3">3. Acessibilidade Cromática e Visual em Jogos/Quizzes Educacionais (Daltonismo)</option>
                    </optgroup>
                    <optgroup label="🤟 Linguagem de Sinais (Libras &amp; Tecnologias Assistivas Web)">
                      <option value="tema-libras-1">4. Visão Computacional Leve (MediaPipe Hands) para Datilologia da Libras na Web</option>
                      <option value="tema-libras-2">5. Mapeamento e Vocabulário Técnico de Computação/Web em Libras</option>
                      <option value="tema-libras-3">6. Consumo de Dados em Tradutores Virtuais de Libras (Avatares 3D vs. Vídeo)</option>
                    </optgroup>
                    <optgroup label="🩺 Transmissão de Vídeo &amp; Telemedicina no Ambiente Médico">
                      <option value="tema-med-1">7. Streaming de Vídeo em Tempo Real (WebRTC vs HLS) para Exames Médicos</option>
                      <option value="tema-med-2">8. Avaliação de Qualidade Visual (PSNR/SSIM) em Vídeos Cirúrgicos (AV1/H.265)</option>
                      <option value="tema-med-3">9. Diagnóstico de Infraestrutura para Teleinterconsultas em Postos de Saúde (UBS)</option>
                    </optgroup>
                    <optgroup label="🔄 Projetos Integradores (Crossover PI I &amp; II)">
                      <option value="tema-pi-1">10. Streaming Web &amp; QoE em Transmissões Esportivas (JifTV)</option>
                      <option value="tema-pi-2">11. Séries Microclimáticas &amp; Alertas Ambientais IoT (Estação Meteorológica)</option>
                      <option value="tema-pi-3">12. IA Generativa Local (SLMs/LLMs) no Atendimento Estudantil (Chatbot Secretaria)</option>
                      <option value="tema-pi-4">13. Ciência de Dados &amp; Scout Tático no Esporte Escolar (Scout de Vôlei)</option>
                      <option value="tema-pi-5">14. Jogos Sérios &amp; Usabilidade para Crianças com TDAH (Música e Atenção)</option>
                      <option value="tema-pi-6">15. Otimização 3D WebGL para Museus Virtuais (Acervo MAGE 3D)</option>
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
          mostrarToast(`Proposta #${resJson.projeto.id} salva na planilha oficial do Google Drive!`);
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

    const dadosAtualizados = {
      id: id,
      titulo: document.getElementById('edit-titulo').value.trim(),
      trilha: document.getElementById('edit-trilha').value,
      checkpoint: document.getElementById('edit-checkpoint').value,
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
          mostrarToast(`Ficha #${id} atualizada na planilha oficial do Google Drive!`);
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
    mostrarToast(`Ficha #${id} atualizada localmente!`);
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
