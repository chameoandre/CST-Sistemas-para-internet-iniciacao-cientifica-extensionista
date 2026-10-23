# Catálogo de Temas Inspiradores para Pesquisa & Extensão (COTB)

> Registrado em 16/10/2026.  
> Unidade Curricular: Iniciação Científica e Extensionista (CST Sistemas para a Internet — IFSC Garopaba).  
> Docentes: Prof. André Moraes e Prof. Adalberto Tabalipa.  
> Interface Web ativa: `2026-2/index.html` (Aba 4: Painel de Equipes) e `2026-2/ice-live.js`.

---

## 1. Contexto & Diretriz Pedagógica

Para orientar e viabilizar a produção científica de estudantes do 2º semestre em uma carga horária de 60h (sendo 30h CHCE de Extensão Universitária), os temas de pesquisa devem equilibrar:
1. **Relevância Social e Extensão**: Impacto direto na comunidade regional ou em grupos com demandas de inclusão.
2. **Viabilidade Técnica**: Uso de dados acessíveis (abertos, simulados ou coletados via ferramentas no-code/scripts leves).
3. **Análise de Dados com Python**: Aplicação prática dos roteiros de laboratório (Google Colab, Pandas, Seaborn, Matplotlib, métricas estatísticas e gráficos prontos para publicação no padrão ACM/COTB).

---

## 2. Eixos Temáticos Prioritários

### Eixo A: Tecnologia Educacional para Deficiências Diversas (Visual e Auditiva)
- **Tema A1 (Deficiência Visual)**: *Avaliação Quantitativa de Conformidade WCAG 2.2 em Ambientes Virtuais de Aprendizagem (AVAs): Um Estudo com Foco em Leitores de Tela e Baixa Visão*
  - **Método de Análise de Dados**: Auditoria com Axe-core e Lighthouse; consolidação de métricas de violações em CSV; boxplots e barras empilhadas no Colab.
  - **Impacto Extensionista**: Guia prático de boas práticas para professores da rede pública regional.
- **Tema A2 (Deficiência Auditiva)**: *Análise de Desempenho e Acurácia de Sistemas de Legenda Automática (Closed Caption) em Videoaulas de Programação: Inclusão de Estudantes Surdos*
  - **Método de Análise de Dados**: Medição de Word Error Rate (WER com `jiwer`) em modelos Whisper e Google Speech; gráficos de correlação com ruído e velocidade de fala.
  - **Impacto Extensionista**: Recomendações de gravação acessível para docentes.
- **Tema A3 (Acessibilidade Cromática)**: *Diagnóstico de Acessibilidade Cromática e Densidade Visual em Plataformas de Exercícios e Gamificação Educacional para Alunos com Daltonismo*
  - **Método de Análise de Dados**: Simulação de Protanopia/Deuteranopia/Tritanopia com OpenCV/Python; análise de contraste e histogramas.
  - **Impacto Extensionista**: Paleta de cores acessível para escolas municipais.

---

### Eixo B: Linguagem de Sinais (Libras & Tecnologias Assistivas Web)
- **Tema B1 (Visão Computacional no Navegador)**: *Análise Comparativa de Latência e Acurácia de Modelos de Visão Computacional Leves (MediaPipe Hands) para Reconhecimento da Datilologia da Libras no Navegador Web*
  - **Método de Análise de Dados**: Extração de coordenadas 3D de poses manuais; medição de FPS e tempos em ms; matriz de confusão e heatmap em Seaborn.
  - **Impacto Extensionista**: Viabilização de jogos educativos de Libras em computadores modestos de escolas públicas.
- **Tema B2 (Letramento em Computação)**: *Mapeamento e Análise Quantitativa da Cobertura Terminológica em Libras para Conceitos Fundamentais de Programação e Sistemas Web*
  - **Método de Análise de Dados**: Mineração em dicionários abertos (Glossário IF, VLibras); análise de frequência de sinais icônicos vs. dependência de datilologia.
  - **Impacto Extensionista**: Glossário web bilíngue (Português-Libras) para calouros surdos em cursos de TI.
- **Tema B3 (Eficiência Web & Conectividade)**: *Avaliação de Eficiência de Rede e Consumo de Dados em Tradutores Virtuais de Libras (Avatares 3D vs. Vídeo em Streaming) em Ambientes de Baixa Conectividade*
  - **Método de Análise de Dados**: Medição de tráfego de rede (KB) e TTI sob perfis 3G/4G simulados; gráficos de desempenho comparativo.
  - **Impacto Extensionista**: Orientações para sites públicos preservarem a franquia de dados de usuários surdos.

---

### Eixo C: Transmissão de Vídeo no Ambiente Médico (Telemedicina e Baixa Latência)
- **Tema C1 (Streaming em Tempo Real)**: *Análise Comparativa de Protocolos de Streaming em Tempo Real (WebRTC vs. HLS vs. SRT) para Transmissão de Vídeos de Exames Médicos com Baixa Latência*
  - **Método de Análise de Dados**: Simulação de jitter e perda de pacotes (1% a 5%); extração de RTT e quadros congelados; gráficos temporais e violin plots.
  - **Impacto Extensionista**: Subsídio para secretarias de saúde implantarem teleconsultas resilientes em postos rurais.
- **Tema C2 (Qualidade Visual & Codecs)**: *Avaliação da Degradação da Qualidade Visual Objetiva (PSNR, SSIM e VMAF) em Vídeos Médicos de Cirurgia Laparoscópica sob Diferentes Codecs (AV1, H.265 e H.264)*
  - **Método de Análise de Dados**: Codificação via FFmpeg em bitrates decrescentes; cômputo frame a frame de SSIM/PSNR no Colab; curvas de taxa-distorção.
  - **Impacto Extensionista**: Perfis de compressão médica para segunda opinião diagnóstica à distância sem fibra óptica.
- **Tema C3 (Diagnóstico de Infraestrutura SUS)**: *Diagnóstico da Infraestrutura de Conectividade e Desempenho para Teleinterconsultas Web em Estabelecimentos de Saúde Pública do Litoral Sul Catarinense*
  - **Método de Análise de Dados**: Análise de microdados públicos do Cetic.br (TIC Saúde) e Anatel com Pandas; correlação com requisitos do WebRTC.
  - **Impacto Extensionista**: Relatório para Conselhos Municipais de Saúde de Garopaba e região sobre investimentos em conectividade.

---

### Eixo D: Projetos Integradores (Crossover Técnico PI I & II / Graduação CST SI)
*Cruzamento estratégico entre protótipos em hardware/software desenvolvidos no Técnico Integrado (PI I & II) e o aprofundamento analítico/extensionista conduzido pelos estudantes de Sistemas para a Internet.*

- **Tema D1 (Crossover JifTV — PI-II #2)**: *Análise Comparativa de Algoritmos de Taxa de Bits Adaptativa (ABR) e Métricas de QoE em Transmissões Esportivas Escolares Web sob Redes Móveis Instáveis*
  - **Origem / Projeto PI**: Plataforma de streaming adaptativo JifTV com Docker, NGINX e OBS.
  - **Método de Análise de Dados**: Coleta de logs de telemetria de reprodução do player web (bitrate instantâneo, buffer health e eventos de rebuffer em ms); cálculo estatístico do índice de QoE (ITU-T P.1203) e geração de gráficos de linha e violin plots no Google Colab.
  - **Impacto Extensionista**: Definição de perfil de codificação e guia de boas práticas para transmissão online dos Jogos do Instituto Federal (JIFs) e torneios interclasses sem queda de conexão.
- **Tema D2 (Crossover Estação Meteorológica — PI-II #8)**: *Mineração de Séries Temporais Microclimáticas em Garopaba a partir de Estações IoT de Baixo Custo: Aplicação em Alertas Ambientais para a Comunidade Local*
  - **Origem / Projeto PI**: Estação meteorológica com Raspberry Pi, ESP32 e sensores climáticos no câmpus.
  - **Método de Análise de Dados**: Tratamento e limpeza de séries temporais com Pandas; identificação de correlações entre pressão, temperatura e umidade; detecção de anomalias com Isolation Forest e mapas de calor sazonais com Seaborn.
  - **Impacto Extensionista**: Desenvolvimento de um dashboard web aberto para consulta de pescadores artesanais, agricultores e esportistas de Garopaba com alertas meteorológicos de curto prazo.
- **Tema D3 (Crossover ChatBot Secretaria Acadêmica — PI-II #10)**: *Avaliação de Eficiência, Latência e Acurácia de Modelos de Linguagem Locais (SLMs/LLMs) com RAG para Atendimento Automatizado ao Estudante em Instituições Públicas*
  - **Origem / Projeto PI**: Chatbot com IA local (LM Studio / PyTorch) para atendimento na Secretaria Acadêmica do IFSC.
  - **Método de Análise de Dados**: Benchmark automatizado de inferência em Python (tempo até o 1º token - TTFT, tokens por segundo e consumo de RAM/VRAM); avaliação da qualidade das respostas com métricas BLEU, ROUGE e taxa de alucinação factual.
  - **Impacto Extensionista**: Implantação de um assistente web de triagem para a Secretaria Acadêmica do Câmpus Garopaba, reduzindo filas e democratizando o acesso a informações acadêmicas.
- **Tema D4 (Crossover Scout de Vôlei — PI-II #9)**: *Modelagem Quantitativa e Visualização Espacial de Desempenho Tático em Esportes Coletivos Escolares a partir de Dados de Scout em Tempo Real*
  - **Origem / Projeto PI**: Aplicativo de scout de voleibol escolar para aquisição de métricas e autoanálise esportiva.
  - **Método de Análise de Dados**: Cálculo de métricas avançadas de rendimento (Sideout Efficiency, Point Scoring Rate); geração de mapas de calor 2D da quadra em Python com Matplotlib e gráficos de radar de habilidades individuais.
  - **Impacto Extensionista**: Oficina prática para professores de educação física e técnicos de projetos sociais esportivos de Garopaba sobre interpretação de métricas de dados para treinos personalizados.
- **Tema D5 (Crossover Música, Jogo e Atenção / SMC — PI-II #1 e #7)**: *Análise Quantitativa de Usabilidade e Retenção Atencional em Jogos Sérios Acessíveis para Crianças com Dificuldades de Aprendizagem e TDAH*
  - **Origem / Projeto PI**: Jogos didáticos em Pygame e Raspberry Pi voltados a estímulos de musicoterapia e montagem de computadores.
  - **Método de Análise de Dados**: Registro de logs de cliques, tempo de reação motora (ms), taxas de acerto e curvas de desistência; análise estatística com testes de correlação de Spearman e boxplots de evolução atencional entre sessões.
  - **Impacto Extensionista**: Parceria com as Salas de Recursos Multifuncionais e pedagogos da rede municipal de Garopaba para aplicação e validação dos jogos como recurso pedagógico complementar.
- **Tema D6 (Crossover Acervo MAGE 3D — PI-II #6)**: *Otimização de Malhas Poligonais e Desempenho de Renderização WebGL em Museus Virtuais Acessíveis: Preservação Digital do Acervo Arqueológico do IFSC*
  - **Origem / Projeto PI**: Digitalização 3D fotogramétrica das peças e fósseis do laboratório/museu MAGE com Blender e Polycam.
  - **Método de Análise de Dados**: Medição de taxas de transferência (MB baixados), tempo de carregamento de cena (s), taxa de quadros (FPS) e uso de memória GPU sob diferentes níveis de simplificação de malha; curvas de trade-off fidelidade visual vs velocidade.
  - **Impacto Extensionista**: Criação de um portal web de divulgação científica arqueológica e paleontológica para visitação virtual de turmas de escolas fundamentais da região.

---

## 3. Integração com o Dashboard

1. **Vitrine Dinâmica no Painel de Equipes**:
   - Os 15 temas ficam disponíveis na Aba 4 com botões de filtro e cartões com badges institucionais.
   - O botão `Adotar Tema` dispara o modal com título, trilha e objetivo preenchidos.
2. **Formulário de Cadastro**:
   - Seletor rápido no topo do modal com separação por eixos e optgroups temáticos.

