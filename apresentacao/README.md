# Prefeitura Digital — Apresentação institucional

Esta pasta reúne a apresentação completa para o Gabinete do Prefeito, as Secretarias e a Câmara Municipal. O material foi feito para funcionar **offline**, sem build, sem backend e sem dependências externas.

## Conteúdo

```text
apresentacao/
├── index.html                          # deck com 28 slides (25 principais + 3 anexos)
├── estilos/
│   └── apresentacao.css                # identidade visual, layout, impressão e responsividade
├── scripts/
│   └── apresentacao.js                 # navegação, notas, gráficos SVG e simulador
├── imagens/                            # logos, telas reais do piloto e fotos ilustrativas
├── Prefeitura-Digital-Apresentacao.pdf # PDF 16:9 com 28 páginas
├── roteiro-apresentacao.md             # fala slide a slide, tempos, Q&A e versão de 15 min
└── resumo-executivo.md                 # documento de apoio de 3 a 4 páginas
```

**Estado do material:** piloto funcional com dados fictícios. A apresentação separa explicitamente o que já funciona no piloto do que é exigido para produção. Os números são estimativas de planejamento, não promessas de resultado.

## Como abrir

### Opção 1 — servidor local (recomendado)

Requer Python instalado:

```powershell
python -m http.server 4199 --directory apresentacao
```

Abra **http://localhost:4199**.

Alternativa com Node.js:

```powershell
npx --yes serve apresentacao -l 4199
```

### Opção 2 — abrir direto

Dê duplo clique em `index.html`. O deck não usa `fetch`, módulos ES ou arquivos externos, então funciona por `file://`. O servidor local é recomendado para testar em outro dispositivo e evitar restrições do navegador.

### Opção 3 — PDF

Abra `Prefeitura-Digital-Apresentacao.pdf` como plano B. O PDF tem 28 páginas, uma por slide, em 16:9 (960 × 540 pt).

## Controles

| Ação | Teclas / gesto |
|---|---|
| Próximo slide | `→`, `↓`, `PageDown`, `Espaço` |
| Slide anterior | `←`, `↑`, `PageUp` |
| Primeiro / último | `Home` / `End` |
| Índice de slides | `O` |
| Notas do apresentador | `N` |
| Tela cheia | `F` |
| Imprimir / salvar em PDF | `P` |
| Ocultar ou mostrar a interface | `U` |
| Ajuda e atalhos | `?` |
| Fechar diálogo, notas, UI ou tela cheia | `Esc` |
| Avançar / voltar no celular | deslizar na horizontal |

O botão **Índice** mostra a lista por seção. O botão **Notas** abre o painel com a fala sugerida de cada slide. O botão **Tela cheia** entra no modo de apresentação. O botão **PDF** abre a impressão.

### Link direto para um slide

Use o hash com o número do slide:

```text
http://localhost:4199/#/12
```

Também funciona com `#12`. Isso é útil para retomar a apresentação ou enviar um link para uma seção específica.

## Exportar PDF

1. Abra o deck no **Chrome** ou **Edge**.
2. Pressione `P` ou clique em **PDF**.
3. Em **Destino**, escolha **Salvar como PDF**.
4. Em **Layout**, escolha **Paisagem**.
5. Em **Margens**, escolha **Nenhuma**.
6. Marque **Gráficos de fundo**.
7. Desmarque **Cabeçalhos e rodapés**.
8. Confira a pré-visualização: cada página deve conter um slide inteiro, sem cortes.

O CSS já define `@page { size: 13.333in 7.5in; margin: 0; }`. Se o navegador oferecer tamanho de papel personalizado, use **13,333 × 7,5 pol.** (equivalente a 16:9). O PDF incluído foi gerado nesse formato e conferido página a página.

> **Atenção:** as notas do apresentador não aparecem no PDF. Elas existem apenas no painel `N`.

## Estrutura dos slides

| Bloco | Slides |
|---|---|
| Abertura e roteiro | 1–2 |
| O problema | 3 |
| A solução | 4–7 |
| Demonstração | 8–9 |
| Como funciona e usabilidade | 10–11 |
| Segurança, privacidade e auditoria | 12–14 |
| Impacto e projeções | 15–21 |
| Caminho, riscos e decisão | 22–24 |
| Encerramento | 25 |
| Anexos | 26–28 |

Duração sugerida: **25 minutos de exposição + perguntas**. O `roteiro-apresentacao.md` traz a versão de 15 minutos e respostas para as objeções mais prováveis.

## Como editar o conteúdo

### Textos e títulos

Cada slide é uma `<section class="slide" id="slide-N">` em `index.html`. Edite o texto diretamente, preservando as classes e a estrutura.

Ao mudar o título de um slide, atualize também:

- `data-titulo`, usado na barra superior e no índice;
- `data-secao`, usado para agrupar o índice.

O rodapé e o contador são preenchidos automaticamente pelo JavaScript.

### Notas do apresentador

As notas ficam em `<template class="nota">` dentro de cada slide. O painel `N` lê esse conteúdo. Elas não são impressas.

### Imagens

Coloque os arquivos em `imagens/` e use caminhos relativos:

```html
<img src="imagens/app-home.png" alt="Descrição da imagem">
```

Mantenha o `alt` descritivo. As telas do app e do painel são do piloto, com dados fictícios. As fotos de cidade são ilustrativas; confirme créditos e licenças antes de divulgação externa.

### Cores e estilos

A identidade visual está em `estilos/apresentacao.css`, com variáveis no topo do arquivo. O layout do palco é fixo em **1280 × 720** e escala para o tamanho da janela. Evite alterar essa proporção sem revisar todos os slides e o PDF.

## Números e gráficos

Os gráficos fixos e o simulador usam as constantes no topo de `scripts/apresentacao.js`:

```js
const ADOCAO = [0.25, 0.32, ..., 0.70]; // 12 meses
const SLA = [0.62, 0.64, ..., 0.85];    // 12 meses
const DEMANDA = 1800;                   // solicitações/mês
const MINUTOS = 15;                     // min economizados por pedido
const CUSTO_HORA = 42;                  // R$/hora carregado
```

Os gráficos de adoção, eficiência e população são recalculados a partir dessas constantes. **Os KPIs e os textos com números no HTML são estáticos** e precisam ser atualizados manualmente para ficarem consistentes. Depois de alterar as constantes, revise:

- slides 15 a 21 (KPIs, cenários e textos);
- slide 28 (memória de cálculo);
- `resumo-executivo.md` e `roteiro-apresentacao.md`.

### Limites dos gráficos

Os gráficos fixos têm escalas máximas definidas em `scripts/apresentacao.js`:

- adoção: `yMax: 2000`;
- eficiência: `yMax: 350`;
- população: `yMax: 3000`.

Se a demanda ou o tempo economizado mudar muito, ajuste esses valores para evitar linhas cortadas ou excesso de espaço vazio.

### Simulador

O simulador do slide 21 usa os mesmos `CUSTO_HORA` e fórmulas. Os controles estão em `index.html`:

- população: 50 mil a 500 mil;
- demanda: 600 a 9.000 por mês;
- adoção no mês 12: 40% a 85%;
- minutos economizados: 8 a 25.

Ao mover a população, a demanda é estimada em **1,8% da população por mês**, limitada entre 600 e 9.000. O botão **Restaurar cenário base** volta para 100 mil habitantes, 1.800 solicitações, 70% de adoção e 15 minutos.

> O simulador usa custo-hora de **R$ 42**. O cenário otimista do slide 17 usa **R$ 48** apenas na tabela estática. Se quiser que o simulador reproduza o otimista, ajuste `CUSTO_HORA` ou inclua o custo como variável.

## Fórmulas

- Pedidos digitais = demanda mensal × adoção.
- Horas liberadas = pedidos digitais × minutos economizados ÷ 60.
- Equivalente em servidores = horas anuais ÷ 1.760.
- Atendimentos adicionais no prazo = demanda × (meta − linha de base).
- Deslocamentos evitados = pedidos digitais × 30% × 75%.
- Benefício ao cidadão = deslocamentos × 2 h × R$ 16.

As premissas completas estão no slide 17 e no slide 28. Os valores são estimativas de planejamento e devem ser recalibrados com a Secretaria de Administração, o protocolo e a TI.

## Antes de apresentar

- [ ] Abrir o deck no navegador e percorrer todos os slides.
- [ ] Conferir se as imagens e os quatro gráficos carregaram.
- [ ] Testar o simulador e o botão de restaurar.
- [ ] Testar `N` (notas), `O` (índice), `F` (tela cheia) e `P` (PDF).
- [ ] Deixar o PDF aberto como plano B.
- [ ] Confirmar a ordem das autoridades e o tratamento correto.
- [ ] Reservar 10 minutos finais para perguntas e encaminhamentos.
- [ ] Se houver demonstração ao vivo, testar o app e o painel antes e usar apenas dados fictícios.

## Limitações e cuidados

- **Não é produção.** O piloto usa dados fictícios. Não use dados pessoais reais nesta versão.
- **Não são promessas.** Os números são projeções de planejamento, com premissas explícitas.
- **Não há coleta de dados.** O deck é estático; não envia informações para servidor algum.
- **Dependência de JavaScript.** Os gráficos e o simulador são gerados no navegador. Se o JavaScript for bloqueado, os gráficos não aparecem; o PDF continua válido.
- **Compatibilidade.** Chrome e Edge são recomendados para tela cheia e impressão. Firefox e Safari funcionam para navegação, mas a pré-visualização de impressão pode variar.
- **Fotos ilustrativas.** Confirme créditos e licenças antes de publicar o material em canais externos.

## Publicação

Por ser um conjunto de arquivos estáticos, a pasta pode ser publicada em qualquer servidor web ou compartilhada como ZIP. Mantenha a estrutura de pastas e os caminhos relativos. Para incorporar em outro site, use um `iframe` com proporção 16:9.

---

**Versão:** outubro de 2026  
**Documento de apoio:** `resumo-executivo.md`  
**Roteiro completo:** `roteiro-apresentacao.md`
