# Padrão visual dos Roteiros Práticos em PDF (LaTeX)

> Registrado em 16/10/2026, a partir do **Roteiro Prático 02 — Starter Kit Python & Gráficos**
> (`2026-2/roteiro-2-python-graficos/roteiro_python_graficos.tex`), que é a **referência viva** deste padrão.
> Preâmbulo pronto para reutilizar: [`preambulo-roteiro-moderno.tex`](preambulo-roteiro-moderno.tex).
> Roteiros já no padrão: **Roteiro 01** (`2026-2/roteiro-1-latex-cotb-imagens-tabelas/roteiro_cotb_latex.tex`, migrado em 16/10/2026) e **Roteiro 02**.
> Exemplos de recursos específicos: esquema TikZ de página em 2 colunas (`figure` × `figure*`) e tabela booktabs "compilada" dentro de cartão (Roteiro 01); esquema da tela do Colab com marcadores numerados (Roteiro 02).

## 1. Princípios

1. **Público iniciante:** a turma pode nunca ter usado as ferramentas (ex.: Google Colab). Todo roteiro explica o "o que é" e o "onde clicar" antes do "como fazer", com passos numerados, glossário e exemplos certo × errado.
2. **Leitura confortável:** fonte sem serifa, entrelinha 1,18, parágrafos separados por espaço (sem recuo), texto alinhado à esquerda em caixas e tabelas estreitas (`\raggedright`).
3. **Cores institucionais IFSC em tons suaves:** azul-escuro e verde como base; cores de destaque só para significado (dica, atenção, conceito, sucesso, avançado).
4. **Ícones com função, não decoração** (`fontawesome5`): identificam o tipo de caixa, botão ou etapa.
5. **Elementos de interface desenhados como na tela:** teclas (`\tecla`), botões/menus (`\botao` + `\seta`).

## 2. Tipografia e página

| Item | Configuração |
|---|---|
| Classe | `article`, 11pt, A4 |
| Texto | `\usepackage[default]{sourcesanspro}` |
| Código | `\usepackage[scale=0.86]{sourcecodepro}` |
| Ícones | `fontawesome5` |
| Margens | `top=2.6cm, bottom=2.6cm, left=2cm, right=2cm, headsep=0.8cm` |
| Espaçamento | `\linespread{1.18}`, `\parskip=0.55em`, `\parindent=0pt` |
| Cor do texto | `tinta` (RGB 30,41,59) — nunca preto puro |

## 3. Paleta

| Nome | RGB | Uso |
|---|---|---|
| `azul` | 30,60,90 | Títulos, cabeçalho de tabelas, badges de seção, faixa da capa |
| `azulMedio` | 37,99,235 | Links internos, ícones de cartões, caixa *conceito*, palavras-chave no código |
| `verde` | 22,101,52 | Strings no código, URLs, faixa da capa (degradê) |
| `verdeVivo` | 22,163,74 | Marcadores de lista, numeração de subseções, caixa *sucesso*, "Certo" |
| `ambar` | 217,119,6 | Caixa *dica* |
| `vermelho` | 220,38,38 | Caixa *atenção*, "Errado", marcadores numerados de figuras esquemáticas |
| `roxo` | 124,58,237 | Caixa *avançado* (conteúdo opcional para quem já sabe) |
| `suave` | 100,116,139 | Textos secundários, cabeçalho/rodapé, comentários de código |
| `borda` | 226,232,240 | Bordas de caixas, régua do cabeçalho, linhas de tabela |
| `fundo` | 248,250,252 | Fundo de cartões, blocos de código, zebra de tabelas |
| `barraTitulo` | 241,245,249 | Barra de título das janelas de código |
| `terminal` | 15,23,42 | Fundo das caixas de saída (estilo terminal) |

## 4. Estrutura da página

- **Cabeçalho:** logo IFSC Garopaba (0,95 cm) à esquerda; à direita "**Roteiro Prático NN** • título curto" em `suave`; régua fina (0,6pt) em `borda`.
- **Rodapé:** nome da UC + curso à esquerda; à direita, "pílula" com `página / total` (`lastpage`).
- **Seções:** número dentro de etiqueta arredondada azul (TikZ) + título azul, sem régua. Subseções com número em `verdeVivo`.
- **Listas:** `itemize` com marcador `\faAngleRight` verde; passos com `enumerate[label={\protect\circulo{\arabic*}}]` (círculos numerados; aceita cor: `\circulo[ambar]{\arabic*}`).

## 5. Abertura padrão de um roteiro (nesta ordem)

1. **Faixa/capa** (`tcolorbox` com degradê `azul → verde`, cantos 12pt): sobrelinha "ROTEIRO PRÁTICO NN • INICIAÇÃO CIENTÍFICA E EXTENSIONISTA", título grande (25pt), subtítulo e **chips** (`\chip{ícone}{texto}`: nível, ferramentas, pré-requisito). Ícone grande translúcido à direita como marca d'água.
2. **Três cartões** (`tcbraster`, 3 colunas, estilo `cartao`): Unidade Curricular, Docentes, Produto final da UC.
3. **Painel de objetivos** (`painel` com `\faBullseye`): "Ao final desta prática você será capaz de…".
4. **Mapa da aula** (`tcbraster` 2×2, cartões coloridos com `\circulo`): etapas da aula com referência às seções.
5. Seção 1 "Onde este roteiro se encaixa": diagrama TikZ do fluxo com ícones, destacando a etapa do roteiro.

Fechamento padrão: seção **Atividade prática** (`painel` com `\faTasks` e passos numerados) + **Checklist de entrega** (caixa verde, itens com `\caixaMarcar`) + endereço do câmpus em `suave`.

## 6. Componentes (definidos no preâmbulo)

| Componente | Sintaxe | Quando usar |
|---|---|---|
| Janela de código | `\begin{codigo}[py\|tex\|txt]{nome do arquivo}` … `\end{codigo}` | Todo código (estilo editor com 3 "bolinhas" e nome do arquivo). Padrão: Python |
| Saída | `\begin{saida}[Título opcional]` … `\end{saida}` | Resultado da execução (fundo escuro, estilo terminal) |
| Certo × errado | `\begin{exemplo}{verdeVivo}{\faCheckCircle\ Certo}` / `{vermelho}{\faTimesCircle\ Errado}` dentro de `tcbraster` 2 colunas | Ensinar sintaxe por contraste |
| Dica | `\begin{dica}{Título}` | Atalhos, boas práticas, "por quê" |
| Atenção | `\begin{atencao}{Título}` | Riscos, erros que fazem perder trabalho, segurança |
| Conceito | `\begin{conceito}{Título}` | Explicar uma ideia nova (ex.: ler mensagem de erro) |
| Sucesso | `\begin{sucesso}{Título}` | Critérios de qualidade, exemplos "bom" |
| Avançado | `\begin{avancado}{Título}` | Conteúdo opcional para quem já programa |
| Painel | `\begin{painel}{\faIcone}{Título}` | Objetivos e atividade da aula |
| Cartão | `\begin{tcolorbox}[cartao]` (em `tcbraster`) | Resumos curtos lado a lado, regras de ouro |
| Tecla | `\tecla{Shift}+\tecla{Enter}` | Atalhos de teclado |
| Botão/menu | `\botao{Arquivo}\seta\botao{Salvar uma cópia no Drive}` | Caminhos de menu e botões de interface |
| Passo numerado | `\circulo[cor]{n}` | Listas de passos, mapa da aula, blocos do código |
| Marcador de figura | `\marca{n}` | Numeração vermelha em esquemas de tela + legenda |
| Caixa de seleção | `\caixaMarcar` | Itens de checklist |
| Tabela | `\rowcolors{2}{fundo}{white}` + `\cabecalho \cab{Coluna} & …` | Sem linhas verticais; colunas `Y` (X alinhada à esquerda) e `P{largura}` |
| QR Code | `\qrcode[height=2.3cm]{URL}` | Links que o aluno vai abrir (ex.: notebook no Colab) |

## 7. Figuras

- Esquemas de interface (ex.: tela do Colab) desenhados em **TikZ**, com `\marca{n}` e legenda em `multicols`; identificar como "representação simplificada".
- Gráficos gerados pelo kit Python já no tamanho de **1 coluna ACM (3,33 × 2,3 pol.)**, sem título interno, paleta Okabe–Ito; no roteiro, exibidos lado a lado dentro de um `tcolorbox` branco com borda `borda`.

## 8. Armadilhas técnicas já resolvidas (não repetir)

- **Vírgula no título de `tcolorbox`** quebra as opções (`/tcb/... unknown key`): envolver o título em chaves nos ambientes baseados em `title=#1` ou evitar vírgulas. Os ambientes `dica`, `atencao` etc. recebem o título como argumento obrigatório e aceitam vírgulas.
- **Aspas `"` dentro de nós TikZ** com `babel[brazil]` causam erro mesmo com `\shorthandoff{"}`: usar `\textquotedbl`.
- **`\color` no início de célula `p{}`/`X`** desalinha a linha verticalmente: preceder com `\leavevmode` (já feito em `\cab`).
- **Caixas em linha (`\botao`, `\tecla`) não quebram**: evite sequências longas no fim de parágrafo; se gerar *overfull*, use `\newline` antes.
- **Texto justificado em cartões/colunas estreitas** cria buracos: o estilo `cartao` e as colunas `Y`/`P` já usam `\raggedright`.
- **`\faFileAlt[regular]`** não existe nesta versão do `fontawesome5`; prefira ícones já testados no Roteiro 02.
- Acentos dentro de `listings` exigem a tabela `literate` do preâmbulo (já inclui `– ± ≈ ÷`).

## 9. Compilação

- Padrão do repositório: `tectonic arquivo.tex` (baixa automaticamente `sourcesanspro`, `sourcecodepro`, `fontawesome5`, `qrcode`, `lastpage`).
- Também compila com `pdflatex` (2–3 passagens, por causa de `lastpage` e referências) desde que esses pacotes estejam instalados.
