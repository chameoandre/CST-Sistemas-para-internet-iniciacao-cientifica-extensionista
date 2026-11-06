# Diretriz Pedagógica: Oficina Integrada "Do Dado Piloto ao Artigo no Overleaf"

> Registrado em 06/11/2026.  
> Unidade Curricular: Iniciação Científica e Extensionista (CST Sistemas para a Internet — IFSC Garopaba).  
> Docentes: Prof. André Moraes e Prof. Adalberto Tabalipa (Mediação em sala: Prof. Alberto).  
> Arquivo de referência: `2026-2/roteiro-oficina-dados-overleaf/roteiro_oficina_dados_overleaf.tex` (compilado via `tectonic`).

---

## 1. Contexto e Problema Resolvido

Ao avançar do Starter Kit Python (Roteiro 02) para a redação do artigo científico no padrão ACM/COTB (Roteiro 01), estudantes iniciantes enfrentam dois grandes gargalos:
1. **Paralisia por falta de dados reais imediatos:** Dúvida sobre "quais dados colocar" antes de iniciar a coleta definitiva em campo.
2. **Dispersão e sobrecarga docente em sala:** Diferentes duplas gerando planilhas com estruturas aleatórias de colunas, causando erros em série no código Python.

---

## 2. A Solução: Padrão Universal de 3 Colunas + Dados Piloto

### Regra Universal de Planilha
Toda equipe adota obrigatoriamente a mesma convenção de colunas:
```csv
grupo,rodada,valor
Grupo A,1,85.5
Grupo A,2,82.0
Grupo B,1,62.0
...
```
* `grupo`: O sistema, sinal, tecnologia ou local avaliado (independe da área temática).
* `rodada`: O número da medição repetida ($n = 1$ a $5$).
* `valor`: O dado numérico com ponto decimal (nota WCAG, latência em ms, acurácia %, tempo em segundos).

### Benefícios Pedagógicos
* O código Python de configuração é idêntico para a turma toda (`COLUNA_GRUPO = "grupo"`, `COLUNA_METRICA = "valor"`).
* O professor em sala não perde tempo depurando nomes de colunas incorretos.
* As duplas aprendem o conceito de **Baseline / Dados Piloto**: constroem o pipeline completo (planilha $\rightarrow$ gráficos ACM $\rightarrow$ tabela booktabs $\rightarrow$ Overleaf) no início. Quando a coleta empírica terminar, basta substituir o CSV e recompilar.

---

## 3. Diagrama de Andamento da Atividade (5 Etapas)

1. **Etapa 1 (Planilha Piloto):** Criação no Google Planilhas com 3 colunas e exportação em `.csv`.
2. **Etapa 2 (Google Colab):** Upload na pasta 📁 do notebook e ajuste de 4 linhas de texto.
3. **Etapa 3 (Artefatos Científicos):** Download de `grafico_barras.pdf` (3,33 pol.) e `tabela_resultados.tex`.
4. **Etapa 4 (Enxerto no Overleaf):** Upload no projeto COTB e inclusão com `\begin{figure}` e `\input{tabela_resultados}` no `main.tex`.
5. **Etapa 5 (Artigo Pronto & Painel):** Compilação sem erros (`Recompile`) e registro do link no Painel de Equipes.

---

## 4. Lição Técnica do Tectonic no macOS

* Pacotes como `fontawesome5` causam crashes de alocação de memória no motor de fontes do Tectonic em sistemas macOS ARM quando compilados offline.
* **Padrão adotado com sucesso:** Desenhar ícones e indicadores diretamente em TikZ nativo ou utilizar formas vetoriais geométricas limpas (`\icoTable`, `\icoPlay`, `\icoChart`), garantindo compilação ultra-rápida (2 segundos) sem qualquer dependência externa ou crash de memória.

