# Roteiro 2 — instruções de integração na página da UC

Pasta: `2026-2/roteiro-2-python-graficos/`

| Arquivo | Conteúdo |
|---|---|
| `roteiro_python_graficos.tex` / `.pdf` | Roteiro Prático 02 (mesmo preâmbulo/identidade visual do Roteiro 01). Recompilar com `tectonic roteiro_python_graficos.tex` (o PDF atual foi gerado com pdflatex). Usa os pacotes `sourcesanspro`, `sourcecodepro`, `fontawesome5`, `qrcode` e `lastpage` — o tectonic baixa automaticamente. |
| `analise_experimento.py` | Script completo (substitui o código atual do card "Roteiro 2" em `2026-2/index.html`). |
| `analise_experimento.ipynb` | Mesmo código em células, para o Colab. |
| `dados_experimento.csv` | Dados de exemplo (5 portais × 5 rodadas). O script baixa este arquivo do GitHub quando o CSV não está na pasta do Colab — **só funciona depois do push para `main`**. |
| `figures/` | Logo IFSC + gráficos de exemplo usados no PDF. |

## Alterações sugeridas em `2026-2/index.html`

1. **Card "Roteiro 2" (aba `tab-roteiros`, ~linha 756):**
   - Botão "Google Colab": trocar `href` por
     `https://colab.research.google.com/github/chameoandre/CST-Sistemas-para-internet-iniciacao-cientifica-extensionista/blob/main/2026-2/roteiro-2-python-graficos/analise_experimento.ipynb`
   - Adicionar botões no mesmo padrão do Roteiro 1: **Roteiro PDF** (`roteiro-2-python-graficos/roteiro_python_graficos.pdf`, `btn-outline-danger`) e **Dados de exemplo (.csv)** (`roteiro-2-python-graficos/dados_experimento.csv`, `download`, `btn-success`); opcionalmente **Script (.py)**.
   - Substituir o conteúdo de `<pre id="code-python-main">` pelo `analise_experimento.py` (escapar `<`, `>` e `&`).
   - Ajustar o texto descritivo: "Carrega o CSV, calcula estatísticas por grupo, gera barras + boxplot em PDF no tamanho de 1 coluna ACM e exporta a tabela booktabs (`tabela_resultados.tex`)."
   - Corrigir menções a "Artigo SBC" → "Artigo ACM / COTB 2027" (o template da UC é ACM sigconf).
2. **Hub de links (~linha 930):** novo card "Roteiro 2 PDF (Python & Gráficos)" → `roteiro-2-python-graficos/roteiro_python_graficos.pdf`, ícone `bi-file-earmark-pdf-fill text-primary`.
3. **Fluxo norteador (Módulo 5, ~linha 480):** pode apontar para o Roteiro 2.

Commit sugerido: `feat(roteiro-2): adiciona roteiro PDF, notebook Colab, script e dados de exemplo do Starter Kit Python & Gráficos`

## Card na página
Sugestão de descrição curta: "Do zero ao gráfico: primeiros passos no Google Colab (para quem nunca programou), organização dos dados em CSV, gráficos em PDF no tamanho de coluna ACM e tabela booktabs automática."
