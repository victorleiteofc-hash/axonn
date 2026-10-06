---
name: Axon Skin
description: Advanced Molecular Dermocosmetics & Cutaneous Biotechnology System
colors:
  primary: "#3B7D71"
  secondary: "#E2953B"
  tertiary: "#34D399"
  neutral-dark: "#121F38"
  neutral-void: "#0B111E"
  neutral-bg: "#F4F6F9"
  neutral-white: "#FFFFFF"
  accent-violet: "#8A5CF6"
  accent-ocean: "#3B717D"
typography:
  display:
    fontFamily: "Noto Serif, Georgia, serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Noto Serif, Georgia, serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.02em"
  subtitle:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  data:
    fontFamily: "JetBrains Mono, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
  label:
    fontFamily: "JetBrains Mono, SFMono-Regular, monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.18em"
  badge:
    fontFamily: "JetBrains Mono, SFMono-Regular, monospace"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.15em"
  caption:
    fontFamily: "JetBrains Mono, SFMono-Regular, monospace"
    fontSize: "0.5625rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.15em"
  micro:
    fontFamily: "JetBrains Mono, SFMono-Regular, monospace"
    fontSize: "0.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.2em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-white}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "#2E645A"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input-search:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-dark}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  chip-category:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-dark}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  card-dossier:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.neutral-dark}"
    rounded: "{rounded.xl}"
    padding: "24px 32px"
---

# Design System: Axon Skin

## Overview

**Creative North Star: "O Caderno de Formulação Avançada"**

O Axon Skin opera como um caderno de bancada farmacêutico de última geração. O sistema visual traduz a precisão da bioquímica cutânea, a biofísica das camadas da pele e a integridade clínica em uma experiência digital sóbria, elegante e de altíssima autoridade.

A arquitetura rejeita ornamentos superficiais de marketing estético — dispensando gradientes de texto vistosos e malhas futuristas sintéticas em favor de tipografia editorial médica legível, superfícies de vidro fosco translúcidas e dados tabulares de alta fidelidade. O tom evoca a calma e a seriedade dos centros suíços e alemães de dermatologia experimental.

**Key Characteristics:**
- **Rigor Farmacognósico:** Comunicação direta fundamentada em massas moleculares (Daltons), escalas de pH e comprovação revisada por pares.
- **Bancada Tátil:** Transparências controladas em vidro laboratorial (`backdrop-blur`) delimitadas por fios de 1px em sálvia vegetal.
- **Equilíbrio Cromático Fisiológico:** O verde sálvia medicinal atua como âncora soberana, contrastado pelo calor do âmbar farmacêutico e azuis profundos de estabilidade.
- **Movimento com Propósito:** Elementos 3D orbitam e acompanham a exploração do usuário sem disputar a atenção com a literatura clínica.

## Colors

A paleta cromática do Axon Skin é calibrada para refletir a pureza dos compostos bioativos, a translucidez lipídica e o contraste clínico necessário para a leitura de laudos e fórmulas.

### Primary
- **Verde Sálvia Medicinal** (`#3B7D71`): A cor central de identidade do Axon Skin. Representa o elo botânico-biotecnológico e a segurança terapêutica. Utilizada em botões mestres, estados ativos, anéis moleculares e indicadores de status.

### Secondary
- **Âmbar Farmacêutico** (`#E2953B`): Tom de alerta biológico e acentuação técnica. Utilizado em métricas de fotoproteção, antioxidantes e advertências de interação e sobrecarga cutânea.

### Tertiary
- **Menta de Hidratação Epitelial** (`#34D399`): Acento biológico reservado para ativos hidratantes, ácido hialurônico e indicadores de homeostase hídrica (TEWL).
- **Violeta Retinoide** (`#8A5CF6`): Identificador cromático para a classe de renovadores celulares profundos e retinoides.
- **Azul Peptídico** (`#3B717D`): Identificador cromático de matriz estrutural dérmica, complexos tensores e fatores de crescimento.

### Neutral
- **Azul Marinho Cirúrgico** (`#121F38`): Tinta principal no tema claro. Fornece peso estrutural, seriedade e contraste de texto ideal.
- **Vazio Cósmico Laboratorial** (`#0B111E`): Fundo primário no tema escuro, simulando o contraste de lâminas fluorescentes em microscopia confocal.
- **Cinza Papel Farmacêutico** (`#F4F6F9`): Fundo calmo e não agressivo no tema claro, remetendo a papel de boletim médico fosco.
- **Branco Puro** (`#FFFFFF`): Destaque de luz, placas de dossiê em destaque e reflexos especulares.

### Named Rules
**A Regra da Raridade Terapêutica.** O acento verde sálvia nunca deve ocupar mais de 15% da área visual de um painel. Sua autoridade vem do uso pontual sobre bases neutras sóbrias.
**A Regra do Contraste Clínico.** Nenhuma informação diagnóstica ou concentração de ativo pode ser renderizada com contraste inferior a 4.5:1 (WCAG AA). Textos nunca devem usar gradientes de opacidade que comprometam a leitura rápida.

## Typography

A tipografia do Axon Skin une a tradição editorial científica humanista à precisão instrumental de bancada através de três famílias complementares.

**Display Font:** Noto Serif (serifa humanista clássica)
**Body Font:** Manrope (geométrica moderna de alta legibilidade)
**Label/Mono Font:** JetBrains Mono (monospace cirúrgico com numerais tabulares)

**Character:** Uma união precisa entre compêndio botânico clássico e terminal analítico moderno. As serifas conferem nobreza aos títulos, enquanto o corpo sem serifa garante leitura fluida de mecanismos bioquímicos e a mono organiza variáveis quantitativas.

### Hierarchy
- **Display** (Bold 700, `clamp(2.25rem, 5vw, 3.75rem)`, line-height: `1.05`): Títulos de seções de apresentação e hero principal.
- **Headline** (Bold 700, `clamp(1.75rem, 3.5vw, 2.5rem)`, line-height: `1.15`): Cabeçalhos de dossiês científicos e compêndios.
- **Title** (Bold 700, `1.25rem`, line-height: `1.3`, uppercase tracking: `0.02em`): Nomes de substâncias e cartões de ativos.
- **Body** (Regular 400, `0.875rem` / `14px`, line-height: `1.6`): Descrição de mecanismos de ação e artigos científicos.
- **Label** (SemiBold 600, `0.6875rem` / `11px`, tracking: `0.18em`, uppercase): Identificadores de sistema, slots de dados, dosagens e unidades de medida.
- **Caption** (SemiBold 600, `0.5625rem` / `9px`, tracking: `0.15em`, uppercase): Medidores de instrumentação, carimbos de scanner e leituras de dados densos no HUD.

### Named Rules
**A Regra dos Numerais Tabulares.** Todas as variáveis numéricas (Daltons, pH, percentual de concentração, anos de estudo) devem ser renderizadas com a classe `font-clinical-mono` e `font-feature-settings: "tnum" 1, "zero" 1` para garantir alinhamento tabular perfeito em tabelas e painéis.

## Layout

O espaço do Axon Skin é estruturado em uma grade flexível de 12 colunas com base espacial de **8px** e ritmo harmônico contínuo.

- **Largura Máxima de Contenção:** `1280px` (7xl) para navegação e hero; `1024px` (5xl) para blocos de leitura e compêndio de ativos.
- **Bento Grid Científico:** A biblioteca de ativos adota um grid bento modular com cartões de largura alternada (`col-span-1` e `md:col-span-2`), permitindo que substâncias fundamentais recebam destaque visual justificado pelo volume de literatura.
- **Separação de Seções:** Espaçamento vertical generoso (`py-20` a `py-28`), proporcionando respiração e separação cognitiva entre a missão institucional, a bancada instrumental e a biblioteca.

## Elevation & Depth

O sistema rejeita sombras pesadas ou artificiais. A sensação de tridimensionalidade é obtida por **camadas tonais sobrepostas e vidro laboratorial translúcido** (`backdrop-blur-xl` e `backdrop-blur-2xl`).

Surperfícies de conteúdo descansam em nível neutro com contorno de 1px em sálvia translúcida (`rgba(59, 125, 113, 0.2)`). A elevação é reativa e surge apenas em momentos de interação tátil.

### Shadow Vocabulary
- **Repouso Vidro Clínico** (`box-shadow: 0 8px 32px 0 rgba(0,0,0,0.04)`): Profundidade básica de cartões do compêndio.
- **Hover Ativo** (`box-shadow: 0 20px 45px -12px rgba(59,125,113,0.32)`): Elevação luminosa ao passar o cursor sobre ativos interativos.
- **Janela Modal Flutuante** (`box-shadow: 0 25px 70px rgba(0,0,0,0.45)`): Elevação de sobreposição no dossiê científico ativo.

### Named Rules
**A Regra da Bancada Plana em Repouso.** Todo componente repousa plano, com profundidade definida por transparência e contorno de 1px. Sombras proeminentes só podem se manifestar durante estados de hover, foco ativo ou em janelas modais flutuantes.

## Shapes

A linguagem formal combina curvatura amigável em cantos com limites estritos e limpos.

- **Cartões de Bancada:** Arredondamento suave de `16px` a `24px` (`rounded-2xl` / `rounded-3xl`), transmitindo segurança e acolhimento clínico.
- **Janela de Dossiê:** Moldura de janela de sistema operacional clássica com botões circulares de controle de 12px (estilo traffic light) e cantos arredondados de `24px`.
- **Chips e Pílulas de Status:** Formato pílula completo (`rounded-full` / `9999px`) para badges de classificação química, número de estudos e tags categóricas.
- **Contornos Estruturais:** Bordas de espessura fixa em `1px`, nunca ultrapassando essa medida para preservar a sensação de instrumento de alta calibração.

## Components

### Buttons
- **Shape:** Cantos levemente arredondados (`12px` / `rounded-xl`).
- **Primary:** Fundo verde sálvia (`#3B7D71`), tipografia em JetBrains Mono com tracking estendido (`0.25em`), uppercase, tamanho de texto `10px`, preenchimento interno `10px 20px`.
- **Hover / Focus:** Transição de 300ms com brilho de borda e som sutil de feedback háptico (`playClinicalSound`).
- **Secondary / Ghost:** Borda em sálvia de 1px, fundo transparente, texto em sálvia, invertendo no hover com preenchimento leve.

### Chips de Categoria
- **Style:** Fundo em sálvia translúcida (`rgba(59, 125, 113, 0.1)`), texto em verde sálvia ou cor de classe química, tipografia `9px` em caixa alta com peso bold.
- **State:** Estado ativo com fundo sólido e sombra sutil; estado inativo com fundo neutro translúcido.

### Cards de Dossiê
- **Corner Style:** `rounded-2xl` (16px).
- **Background:** Gradiente sutil de vidro fosco (`backdrop-blur-xl`), com camada especular superior refletiva no hover (`group-hover:opacity-100`).
- **Border:** Fio sálvia em `1px` (`border-[#3B7D71]/20`).
- **Internal Padding:** `24px` a `28px` (`p-6` / `sm:p-7`).

### Inputs de Pesquisa
- **Style:** Fundo neutro suave (`#F4F6F9` no tema claro / `#0B111E` no escuro), ícone de lupa alinhado à esquerda, borda de 1px.
- **Focus:** Destaque de borda em verde sálvia (`#3B7D71`) com anel de foco acessível visível.

### Janela Flutuante de Monografia (Signature Component)
- **Header:** Barra de título cinza suave com controles circulares de janela, título centralizado em código mono (`AXON // DOSSIÊ CIENTÍFICO #ID`), botão de impressão direta para laudo médico e tecla de atalho `ESC` evidente.
- **Corpo:** Grade de duas colunas com mecanismos biológicos, estudos clínicos e compatibilidade de formulação.

## Do's and Don'ts

### Do:
- **Do** utilizar a família `JetBrains Mono` com `font-clinical-mono` para dados quantitativos (Daltons, concentrações, pH).
- **Do** manter o fundo da cena 3D com `pointer-events: none`, permitindo rolagem de tela ininterrupta no desktop e no mobile.
- **Do** fornecer feedback sonoro clínico discreto via Web Audio API para cliques e aberturas de janelas.
- **Do** preservar a semântica de acessibilidade com `role="dialog"` e suporte à tecla `ESC` em todas as camadas modais.

### Don't:
- **Don't** aplicar gradientes de cor com corte de texto (`background-clip: text`) em títulos ou parágrafos. A tipografia médica deve ser sólida e nítida.
- **Don't** inserir grids artificiais estilo "blueprint de ficção científica". A profundidade deve nascer de difusão de luz e reflexos foscos.
- **Don't** disparar áudio institucional ou sons com volume elevado sem ação intencional ou sem opção de silenciamento visível no cabeçalho.
- **Don't** usar sombras pretas opacas pesadas sobre fundos claros; utilize sombras coloridas atenuadas ancoradas no sálvia.
