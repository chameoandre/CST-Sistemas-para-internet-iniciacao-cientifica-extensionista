"""
analise_experimento.py — Starter Kit Python & Gráficos (Roteiro Prático 02)
Iniciação Científica e Extensionista — CST Sistemas para a Internet — IFSC Garopaba

O que este script faz, em 5 blocos:
  1. Carrega os dados do experimento a partir de um arquivo CSV;
  2. Calcula as estatísticas descritivas por grupo (n, média, desvio padrão, mín., máx.);
  3. Gera um gráfico de barras (média ± desvio padrão) no tamanho de 1 coluna ACM;
  4. Gera um boxplot com a distribuição de cada grupo;
  5. Exporta uma tabela LaTeX (booktabs) pronta para o Overleaf.

Saídas (na mesma pasta do script / no painel "Arquivos" do Colab):
  grafico_barras.pdf, grafico_barras.png, grafico_boxplot.pdf, grafico_boxplot.png,
  tabela_resultados.tex

Para usar com os SEUS dados, altere apenas a seção "CONFIGURAÇÃO" abaixo.
"""

import os

import matplotlib.pyplot as plt
import pandas as pd

# =====================================================================
# CONFIGURAÇÃO — ajuste aqui para o seu experimento
# =====================================================================
ARQUIVO_DADOS = "dados_experimento.csv"   # seu CSV (uma linha por medição)
COLUNA_GRUPO = "portal"                   # coluna que identifica os grupos comparados
COLUNA_METRICA = "acessibilidade"         # coluna numérica a ser analisada
ROTULO_EIXO_Y = "Pontuação de acessibilidade (0–100)"   # sempre com a unidade!
LIMITE_Y = (0, 105)                       # use None para escala automática

# CSV exportado do Google Planilhas/Excel em português costuma usar ";" e vírgula decimal.
# Se for o seu caso, troque para: SEPARADOR = ";" e DECIMAL = ","
SEPARADOR = ","
DECIMAL = "."

# Dados de exemplo (usados se o arquivo acima não existir na pasta)
URL_EXEMPLO = (
    "https://raw.githubusercontent.com/chameoandre/"
    "CST-Sistemas-para-internet-iniciacao-cientifica-extensionista/main/"
    "2026-2/roteiro-2-python-graficos/dados_experimento.csv"
)

# Largura de UMA coluna no template ACM sigconf ≈ 3,33 polegadas (8,45 cm).
# Gerar a figura já nesse tamanho garante que as fontes fiquem legíveis no artigo.
LARGURA_COLUNA_POL = 3.33
ALTURA_POL = 2.3

# Paleta amigável a daltônicos (Okabe–Ito)
CORES = ["#0072B2", "#E69F00", "#009E73", "#CC79A7", "#56B4E9",
         "#D55E00", "#F0E442", "#000000"]

plt.rcParams.update({
    "font.family": "serif",      # combina com o texto do artigo
    "font.size": 8,
    "axes.labelsize": 8,
    "xtick.labelsize": 7,
    "ytick.labelsize": 7,
    "legend.fontsize": 7,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "pdf.fonttype": 42,          # fontes incorporadas corretamente no PDF
})

# =====================================================================
# 1. CARREGAR OS DADOS
# =====================================================================
if not os.path.exists(ARQUIVO_DADOS):
    import urllib.request
    print(f"📥 '{ARQUIVO_DADOS}' não encontrado localmente — baixando dados de exemplo oficiais...")
    try:
        urllib.request.urlretrieve(URL_EXEMPLO, ARQUIVO_DADOS)
        print(f"✅ '{ARQUIVO_DADOS}' salvo com sucesso no diretório local!")
    except Exception as e:
        print(f"Nota: Carregando diretamente da URL: {e}")

origem = ARQUIVO_DADOS if os.path.exists(ARQUIVO_DADOS) else URL_EXEMPLO
df = pd.read_csv(origem, sep=SEPARADOR, decimal=DECIMAL)
print(f"Dados carregados: {len(df)} linhas, colunas = {list(df.columns)}")
print(df.head())
print()

# =====================================================================
# 2. ESTATÍSTICAS DESCRITIVAS POR GRUPO
# =====================================================================
resumo = (
    df.groupby(COLUNA_GRUPO)[COLUNA_METRICA]
      .agg(n="count", media="mean", desvio="std", minimo="min", maximo="max")
      .reset_index()
)
media_geral = df[COLUNA_METRICA].mean()

print("Estatísticas descritivas por grupo:")
print(resumo.round(2).to_string(index=False))
print(f"\nMédia geral: {media_geral:.2f} | Desvio padrão geral: {df[COLUNA_METRICA].std():.2f}\n")

grupos = resumo[COLUNA_GRUPO].tolist()
cores = [CORES[i % len(CORES)] for i in range(len(grupos))]

# =====================================================================
# 3. GRÁFICO DE BARRAS (média ± desvio padrão)
# =====================================================================
fig, ax = plt.subplots(figsize=(LARGURA_COLUNA_POL, ALTURA_POL))
ax.bar(grupos, resumo["media"], yerr=resumo["desvio"], capsize=3,
       color=cores, edgecolor="black", linewidth=0.5)
ax.axhline(media_geral, color="#444444", linestyle="--", linewidth=0.8,
           label=f"Média geral ({media_geral:.1f})".replace(".", ","))
ax.set_ylabel(ROTULO_EIXO_Y)
if LIMITE_Y:
    ax.set_ylim(*LIMITE_Y)
ax.legend(loc="lower center", bbox_to_anchor=(0.5, 1.0), frameon=False)  # legenda acima, sem cobrir barras
# Sem título dentro da figura: no artigo, quem faz esse papel é o \caption{}.
fig.tight_layout()
fig.savefig("grafico_barras.pdf", bbox_inches="tight")            # vetorial (preferido)
fig.savefig("grafico_barras.png", dpi=300, bbox_inches="tight")   # raster 300 dpi
plt.show()

# =====================================================================
# 4. BOXPLOT (distribuição das medições de cada grupo)
# =====================================================================
dados_por_grupo = [df.loc[df[COLUNA_GRUPO] == g, COLUNA_METRICA] for g in grupos]
fig, ax = plt.subplots(figsize=(LARGURA_COLUNA_POL, ALTURA_POL))
caixas = ax.boxplot(dados_por_grupo, patch_artist=True, widths=0.6,
                    medianprops={"color": "black", "linewidth": 1})
for caixa, cor in zip(caixas["boxes"], cores):
    caixa.set_facecolor(cor)
    caixa.set_alpha(0.85)
ax.set_xticks(range(1, len(grupos) + 1))
ax.set_xticklabels(grupos)
ax.set_ylabel(ROTULO_EIXO_Y)
# No boxplot deixamos a escala automática: começar em 0 "achataria" as caixas.
fig.tight_layout()
fig.savefig("grafico_boxplot.pdf", bbox_inches="tight")
fig.savefig("grafico_boxplot.png", dpi=300, bbox_inches="tight")
plt.show()

# =====================================================================
# 5. TABELA LaTeX (booktabs) PRONTA PARA O OVERLEAF
# =====================================================================
def formatar(valor):
    """Número com 2 casas e vírgula decimal (padrão em português)."""
    return f"{valor:.2f}".replace(".", ",")

linhas = [
    r"\begin{table}[htbp]",
    rf"  \caption{{Estatísticas descritivas de {COLUNA_METRICA} por {COLUNA_GRUPO}}}",
    r"  \label{tab:resultados}",
    r"  \centering",
    r"  \begin{tabular}{lrrrrr}",
    r"    \toprule",
    rf"    \textbf{{{COLUNA_GRUPO.capitalize()}}} & \textbf{{n}} & \textbf{{Média}} & "
    r"\textbf{DP} & \textbf{Mín.} & \textbf{Máx.} \\",
    r"    \midrule",
]
for _, r in resumo.iterrows():
    linhas.append(
        f"    {r[COLUNA_GRUPO]} & {int(r['n'])} & {formatar(r['media'])} & "
        f"{formatar(r['desvio'])} & {formatar(r['minimo'])} & {formatar(r['maximo'])} \\\\"
    )
linhas += [r"    \bottomrule", r"  \end{tabular}", r"\end{table}"]

with open("tabela_resultados.tex", "w", encoding="utf-8") as f:
    f.write("\n".join(linhas) + "\n")

print("-> Arquivos gerados: grafico_barras.pdf/.png, grafico_boxplot.pdf/.png e tabela_resultados.tex")
print("-> Faça o upload deles no Overleaf (Roteiro 02, Seção 8).")
