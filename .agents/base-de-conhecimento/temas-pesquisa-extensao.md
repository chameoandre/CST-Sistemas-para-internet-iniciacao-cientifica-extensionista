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

## 3. Integração com o Dashboard

1. **Vitrine Dinâmica no Painel de Equipes**:
   - Os 9 temas ficam disponíveis na Aba 4 com botões de filtro e cartão explicativo.
   - O botão `Adotar Tema` dispara o modal com título, trilha e objetivo preenchidos.
2. **Formulário de Cadastro**:
   - Seletor rápido no topo do modal para duplas que abrirem o formulário manualmente.
