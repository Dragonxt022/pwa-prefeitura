/* =========================================================
   PREFEITURA DIGITAL · APRESENTAÇÃO INSTITUCIONAL
   Navegação, gráficos, simulador e modo de impressão.
   Sem dependências externas.
   ========================================================= */

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const NS = 'http://www.w3.org/2000/svg';

  const slides = $$('.slide');
  const palco = $('#palco');
  const palcoWrap = $('#palco-wrap');
  const contador = $('#contador');
  const progresso = $('#progresso');
  const secaoAtual = $('#secao-atual');
  const tituloAtual = $('#titulo-atual');
  const anuncio = $('#anuncio-aria');
  const painelNotas = $('#painel-notas');
  const notasConteudo = $('#notas-conteudo');
  const dialogoIndice = $('#dialogo-indice');
  const dialogoAjuda = $('#dialogo-ajuda');
  const indiceLista = $('#indice-lista');

  let atual = 0;
  let temporizadorSimulador = 0;

  const formatador = new Intl.NumberFormat('pt-BR');
  const formatadorDecimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const formatNum = (v) => formatador.format(Math.round(v));

  /* -------------------------------------------------------
     DADOS DO CENÁRIO BASE
     ------------------------------------------------------- */

  const ADOCAO = [0.25, 0.32, 0.39, 0.45, 0.50, 0.54, 0.58, 0.61, 0.64, 0.66, 0.68, 0.70];
  const SLA = [0.62, 0.64, 0.66, 0.69, 0.72, 0.75, 0.77, 0.79, 0.81, 0.83, 0.84, 0.85];
  const MESES = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
  const DEMANDA = 1800;
  const MINUTOS = 15;
  const CUSTO_HORA = 42;

  const pedidosDigitais = ADOCAO.map((a) => DEMANDA * a);
  const horasMes = pedidosDigitais.map((p) => (p * MINUTOS) / 60);
  const deslocamentosMes = pedidosDigitais.map((p) => p * 0.30 * 0.75);
  const adicionaisPrazoMes = SLA.map((s) => DEMANDA * (s - 0.62));

  const acumular = (arr) => {
    let total = 0;
    return arr.map((v) => {
      total += v;
      return total;
    });
  };

  const horasAcumuladas = acumular(horasMes);
  const deslocamentosAcumulados = acumular(deslocamentosMes);
  const adicionaisPrazoAcumulados = acumular(adicionaisPrazoMes);

  const graficos = {
    adocao: {
      chave: 'adocao',
      labels: MESES,
      yMax: 2000,
      ticks: 4,
      formatoY: formatNum,
      series: [
        { nome: 'Demanda total', dados: ADOCAO.map(() => DEMANDA), cor: '#94a3b8', tracejada: true, unidade: 'pedidos' },
        { nome: 'Atendida pelo app', dados: pedidosDigitais, cor: '#1477e6', area: true, unidade: 'pedidos' }
      ]
    },
    eficiencia: {
      chave: 'eficiencia',
      labels: MESES,
      yMax: 350,
      ticks: 7,
      formatoY: formatNum,
      series: [
        { nome: 'Horas liberadas', dados: horasMes, cor: '#1477e6', area: true, unidade: 'h' }
      ]
    },
    populacao: {
      chave: 'populacao',
      labels: MESES,
      yMax: 3000,
      ticks: 6,
      formatoY: formatNum,
      series: [
        { nome: 'Atendimentos no prazo', dados: adicionaisPrazoAcumulados, cor: '#1477e6', area: true, unidade: 'atendimentos' },
        { nome: 'Deslocamentos evitados', dados: deslocamentosAcumulados, cor: '#0e9f6e', unidade: 'deslocamentos' }
      ]
    }
  };

  /* -------------------------------------------------------
     GRÁFICOS SVG
     ------------------------------------------------------- */

  function criarGrafico(el, cfg) {
    if (!el) return;

    const W = 820;
    const H = 330;
    const margem = { top: 18, right: 28, bottom: 34, left: 56 };
    const pw = W - margem.left - margem.right;
    const ph = H - margem.top - margem.bottom;
    const n = cfg.labels.length;
    const x = (i) => margem.left + (pw * i) / Math.max(1, n - 1);
    const y = (v) => margem.top + ph * (1 - v / cfg.yMax);

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-label', cfg.aria || el.getAttribute('aria-label') || 'Gráfico de linhas');
    if (cfg.animar === false) svg.classList.add('sem-animacao');

    const defs = document.createElementNS(NS, 'defs');
    cfg.series.forEach((serie, si) => {
      if (!serie.area) return;
      const id = `grad-${cfg.chave}-${si}`;
      const grad = document.createElementNS(NS, 'linearGradient');
      grad.setAttribute('id', id);
      grad.setAttribute('x1', '0');
      grad.setAttribute('y1', '0');
      grad.setAttribute('x2', '0');
      grad.setAttribute('y2', '1');
      const stop1 = document.createElementNS(NS, 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', serie.cor);
      stop1.setAttribute('stop-opacity', '0.22');
      const stop2 = document.createElementNS(NS, 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', serie.cor);
      stop2.setAttribute('stop-opacity', '0.01');
      grad.append(stop1, stop2);
      defs.appendChild(grad);
    });
    svg.appendChild(defs);

    const ticks = cfg.ticks || 4;
    for (let i = 0; i <= ticks; i += 1) {
      const valor = (cfg.yMax / ticks) * i;
      const yy = y(valor);
      const linha = document.createElementNS(NS, 'line');
      linha.setAttribute('x1', margem.left);
      linha.setAttribute('x2', W - margem.right);
      linha.setAttribute('y1', yy);
      linha.setAttribute('y2', yy);
      linha.setAttribute('stroke', i === 0 ? '#cfdae6' : '#e6edf5');
      linha.setAttribute('stroke-width', '1');
      svg.appendChild(linha);

      const texto = document.createElementNS(NS, 'text');
      texto.setAttribute('x', margem.left - 10);
      texto.setAttribute('y', yy + 3.5);
      texto.setAttribute('text-anchor', 'end');
      texto.setAttribute('font-size', '9.5');
      texto.setAttribute('fill', '#7e91a6');
      texto.textContent = cfg.formatoY ? cfg.formatoY(valor) : formatNum(valor);
      svg.appendChild(texto);
    }

    cfg.labels.forEach((label, i) => {
      const texto = document.createElementNS(NS, 'text');
      texto.setAttribute('x', x(i));
      texto.setAttribute('y', H - 12);
      texto.setAttribute('text-anchor', 'middle');
      texto.setAttribute('font-size', '9.5');
      texto.setAttribute('fill', '#7e91a6');
      texto.textContent = label;
      svg.appendChild(texto);
    });

    const rotuloMes = document.createElementNS(NS, 'text');
    rotuloMes.setAttribute('x', W - margem.right);
    rotuloMes.setAttribute('y', H - 1);
    rotuloMes.setAttribute('text-anchor', 'end');
    rotuloMes.setAttribute('font-size', '8');
    rotuloMes.setAttribute('fill', '#a0b0c2');
    rotuloMes.textContent = 'mês';
    svg.appendChild(rotuloMes);

    cfg.series.forEach((serie, si) => {
      if (!serie.area) return;
      const pontos = serie.dados.map((v, i) => [x(i), y(v)]);
      const base = y(0);
      const d = [
        `M ${pontos[0][0].toFixed(2)} ${pontos[0][1].toFixed(2)}`,
        ...pontos.slice(1).map((p) => `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`),
        `L ${pontos[pontos.length - 1][0].toFixed(2)} ${base.toFixed(2)}`,
        `L ${pontos[0][0].toFixed(2)} ${base.toFixed(2)}`,
        'Z'
      ].join(' ');
      const area = document.createElementNS(NS, 'path');
      area.setAttribute('d', d);
      area.setAttribute('fill', `url(#grad-${cfg.chave}-${si})`);
      area.setAttribute('stroke', 'none');
      svg.appendChild(area);
    });

    cfg.series.forEach((serie, si) => {
      const pontos = serie.dados.map((v, i) => [x(i), y(v)]);
      const d = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
      const linha = document.createElementNS(NS, 'path');
      linha.setAttribute('d', d);
      linha.setAttribute('fill', 'none');
      linha.setAttribute('stroke', serie.cor);
      linha.setAttribute('stroke-width', serie.tracejada ? '2' : '2.6');
      linha.setAttribute('stroke-linecap', 'round');
      linha.setAttribute('stroke-linejoin', 'round');
      if (serie.tracejada) linha.setAttribute('stroke-dasharray', '5 6');
      if (!serie.tracejada) linha.setAttribute('pathLength', '1');
      linha.setAttribute('class', serie.tracejada ? 'linha-grafico linha-grafico--tracejada' : 'linha-grafico');
      svg.appendChild(linha);

      pontos.forEach((p, i) => {
        const ponto = document.createElementNS(NS, 'circle');
        ponto.setAttribute('cx', p[0]);
        ponto.setAttribute('cy', p[1]);
        ponto.setAttribute('r', serie.tracejada ? '2.4' : '3.2');
        ponto.setAttribute('fill', '#fff');
        ponto.setAttribute('stroke', serie.cor);
        ponto.setAttribute('stroke-width', '2');
        const titulo = document.createElementNS(NS, 'title');
        titulo.textContent = `${cfg.labels[i]} · ${formatNum(serie.dados[i])} ${serie.unidade || ''}`.trim();
        ponto.appendChild(titulo);
        svg.appendChild(ponto);
      });
    });

    cfg.series.forEach((serie, si) => {
      const ultimo = serie.dados[serie.dados.length - 1];
      const ultimoPonto = [x(n - 1), y(ultimo)];
      const texto = document.createElementNS(NS, 'text');
      texto.setAttribute('x', ultimoPonto[0] - 7);
      texto.setAttribute('y', ultimoPonto[1] + (si === 0 ? -8 : 14));
      texto.setAttribute('text-anchor', 'end');
      texto.setAttribute('font-size', '10.5');
      texto.setAttribute('font-weight', '700');
      texto.setAttribute('fill', serie.cor);
      texto.textContent = formatNum(ultimo);
      svg.appendChild(texto);
    });

    el.innerHTML = '';
    el.appendChild(svg);

    const legenda = document.querySelector(`[data-legenda="${cfg.chave}"]`);
    if (legenda) {
      legenda.innerHTML = cfg.series.map((serie) => {
        const classes = ['legenda__marca'];
        if (serie.tracejada) classes.push('legenda__marca--tracejada');
        if (serie.cor === '#0e9f6e') classes.push('legenda__marca--verde');
        return `<span class="legenda__item"><span class="${classes.join(' ')}" style="--cor:${serie.cor}"></span>${serie.nome}</span>`;
      }).join('');
    }
  }

  function escalaY(maximo) {
    if (maximo <= 20) return Math.ceil(maximo / 5) * 5;
    if (maximo <= 100) return Math.ceil(maximo / 20) * 20;
    if (maximo <= 500) return Math.ceil(maximo / 50) * 50;
    if (maximo <= 2000) return Math.ceil(maximo / 250) * 250;
    return Math.ceil(maximo / 500) * 500;
  }

  function renderizarGraficosFixos() {
    Object.values(graficos).forEach((cfg) => {
      criarGrafico(document.querySelector(`[data-grafico="${cfg.chave}"]`), cfg);
    });
  }

  /* -------------------------------------------------------
     SIMULADOR
     ------------------------------------------------------- */

  const sim = {
    populacao: $('#sim-populacao'),
    demanda: $('#sim-demanda'),
    adocao: $('#sim-adocao'),
    minutos: $('#sim-minutos'),
    outPopulacao: $('#out-populacao'),
    outDemanda: $('#out-demanda'),
    outAdocao: $('#out-adocao'),
    outMinutos: $('#out-minutos'),
    horas: $('#sim-horas'),
    servidores: $('#sim-servidores'),
    valor: $('#sim-valor'),
    deslocamentos: $('#sim-deslocamentos'),
    prazo: $('#sim-prazo'),
    reset: $('#sim-reset'),
    grafico: document.querySelector('[data-grafico="simulador"]')
  };

  function valorSimulador() {
    return {
      populacao: Number(sim.populacao.value),
      demanda: Number(sim.demanda.value),
      adocao: Number(sim.adocao.value) / 100,
      minutos: Number(sim.minutos.value)
    };
  }

  function formatarMilhar(valor) {
    if (valor >= 1000) return `R$ ${formatNum(Math.round(valor / 1000))}<small>mil</small>`;
    return `R$ ${formatNum(valor)}`;
  }

  function renderizarSimulador() {
    const { populacao, demanda, adocao, minutos } = valorSimulador();
    const horasAno = (demanda * adocao * minutos * 12) / 60;
    const servidores = horasAno / 1760;
    const valor = horasAno * CUSTO_HORA;
    const deslocamentos = demanda * 12 * adocao * 0.30 * 0.75;
    const prazo = demanda * 12 * (0.85 - 0.62);

    sim.outPopulacao.textContent = populacao >= 1000 ? `${formatNum(populacao / 1000)} mil` : formatNum(populacao);
    sim.outDemanda.textContent = formatNum(demanda);
    sim.outAdocao.textContent = `${Math.round(adocao * 100)}%`;
    sim.outMinutos.textContent = `${minutos} min`;

    sim.horas.innerHTML = `${formatNum(horasAno)}<small>h</small>`;
    sim.servidores.textContent = formatadorDecimal.format(servidores);
    sim.valor.innerHTML = formatarMilhar(valor);
    sim.deslocamentos.textContent = formatNum(deslocamentos);
    sim.prazo.textContent = formatNum(prazo);

    const dados = Array.from({ length: 12 }, (_, i) => {
      const rampa = 0.25 + (adocao - 0.25) * (i / 11);
      return (demanda * rampa * minutos) / 60;
    });
    const maximo = Math.max(...dados) * 1.12;
    const cfg = {
      chave: 'simulador',
      labels: MESES,
      yMax: escalaY(maximo),
      ticks: 4,
      formatoY: (v) => formatNum(v),
      animar: false,
      series: [{ nome: 'Horas liberadas', dados, cor: '#1477e6', area: true, unidade: 'h' }]
    };
    criarGrafico(sim.grafico, cfg);
  }

  function agendarSimulador() {
    window.clearTimeout(temporizadorSimulador);
    temporizadorSimulador = window.setTimeout(renderizarSimulador, 70);
  }

  if (sim.populacao && sim.demanda) {
    sim.populacao.addEventListener('input', () => {
      const populacao = Number(sim.populacao.value);
      const demandaEstimada = Math.max(600, Math.min(9000, Math.round((populacao * 0.018) / 100) * 100));
      sim.demanda.value = String(demandaEstimada);
      agendarSimulador();
    });
    [sim.demanda, sim.adocao, sim.minutos].forEach((input) => {
      if (input) input.addEventListener('input', agendarSimulador);
    });
    if (sim.reset) {
      sim.reset.addEventListener('click', () => {
        sim.populacao.value = '100000';
        sim.demanda.value = '1800';
        sim.adocao.value = '70';
        sim.minutos.value = '15';
        renderizarSimulador();
      });
    }
    renderizarSimulador();
  }

  /* -------------------------------------------------------
     NAVEGAÇÃO
     ------------------------------------------------------- */

  function ajustarEscala() {
    if (!palco || !palcoWrap) return;
    const largura = Math.max(320, palcoWrap.clientWidth - 28);
    const altura = Math.max(180, palcoWrap.clientHeight - 28);
    const escala = Math.min(largura / 1280, altura / 720);
    palco.style.transform = `scale(${escala})`;
  }

  function atualizarIndiceAtivo() {
    $$('.indice__link').forEach((link) => {
      link.classList.toggle('ativo', Number(link.dataset.ir) === atual);
    });
  }

  function atualizarNotas() {
    if (!painelNotas || !notasConteudo) return;
    const nota = slides[atual]?.querySelector('.nota');
    notasConteudo.innerHTML = nota ? nota.innerHTML : '<p>Sem notas para este slide.</p>';
  }

  function irPara(indice, opcoes = {}) {
    const destino = Math.max(0, Math.min(slides.length - 1, indice));
    if (destino === atual && opcoes.forcar !== true) {
      if (!opcoes.silencioso) atualizarNotas();
      return;
    }

    slides[atual]?.classList.remove('ativo');
    atual = destino;
    slides[atual].classList.add('ativo');

    if (contador) contador.textContent = `${String(atual + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    if (progresso) progresso.style.width = `${((atual + 1) / slides.length) * 100}%`;
    if (secaoAtual) secaoAtual.textContent = slides[atual].dataset.secao || '';
    if (tituloAtual) tituloAtual.textContent = slides[atual].dataset.titulo || '';
    if (anuncio) anuncio.textContent = `Slide ${atual + 1} de ${slides.length}: ${slides[atual].dataset.titulo || ''}`;

    atualizarNotas();
    atualizarIndiceAtivo();

    if (!opcoes.silencioso) {
      try {
        history.replaceState(null, '', `#/${atual + 1}`);
      } catch {
        /* ambientes que bloqueiam history em file:// */
      }
    }
  }

  function proximo() { irPara(atual + 1); }
  function anterior() { irPara(atual - 1); }

  /* -------------------------------------------------------
     ÍNDICE
     ------------------------------------------------------- */

  function montarIndice() {
    if (!indiceLista) return;
    const grupos = new Map();
    slides.forEach((slide, i) => {
      const secao = slide.dataset.secao || 'Apresentação';
      if (!grupos.has(secao)) grupos.set(secao, []);
      grupos.get(secao).push({ i, titulo: slide.dataset.titulo || `Slide ${i + 1}` });
    });

    indiceLista.innerHTML = [...grupos.entries()].map(([secao, itens]) => `
      <div class="indice__grupo">
        <h3>${secao}</h3>
        ${itens.map((item) => `
          <button class="indice__link" type="button" data-ir="${item.i}">
            <span class="indice__num">${String(item.i + 1).padStart(2, '0')}</span>
            <span>${item.titulo}</span>
          </button>
        `).join('')}
      </div>
    `).join('');

    $$('.indice__link', indiceLista).forEach((link) => {
      link.addEventListener('click', () => {
        irPara(Number(link.dataset.ir));
        dialogoIndice.close();
      });
    });
    atualizarIndiceAtivo();
  }

  /* -------------------------------------------------------
     NOTAS / DIÁLOGOS / TELA CHEIA / UI
     ------------------------------------------------------- */

  function alternarNotas() {
    if (!painelNotas) return;
    const aberto = painelNotas.classList.toggle('aberto');
    const botao = document.querySelector('[data-acao="notas"]');
    if (botao) botao.setAttribute('aria-pressed', String(aberto));
    atualizarNotas();
  }

  function abrirDialogo(dialogo) {
    if (!dialogo) return;
    if (typeof dialogo.showModal === 'function') dialogo.showModal();
    else dialogo.setAttribute('open', '');
  }

  function fecharDialogo(dialogo) {
    if (!dialogo) return;
    if (typeof dialogo.close === 'function') dialogo.close();
    else dialogo.removeAttribute('open');
  }

  async function alternarTelaCheia() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* navegador pode bloquear; o botão continua disponível */
    }
  }

  function alternarUi() {
    document.body.classList.toggle('ui-oculta');
    requestAnimationFrame(ajustarEscala);
  }

  function mostrarUi() {
    document.body.classList.remove('ui-oculta');
    requestAnimationFrame(ajustarEscala);
  }

  function fecharTudo() {
    if (dialogoIndice?.open) dialogoIndice.close();
    if (dialogoAjuda?.open) dialogoAjuda.close();
    painelNotas?.classList.remove('aberto');
    if (document.body.classList.contains('ui-oculta')) mostrarUi();
  }

  /* -------------------------------------------------------
     EVENTOS
     ------------------------------------------------------- */

  document.addEventListener('click', (event) => {
    const botao = event.target.closest('[data-acao]');
    if (!botao) return;
    const acao = botao.dataset.acao;
    if (acao === 'proximo') proximo();
    if (acao === 'anterior') anterior();
    if (acao === 'indice') abrirDialogo(dialogoIndice);
    if (acao === 'notas') alternarNotas();
    if (acao === 'tela-cheia') alternarTelaCheia();
    if (acao === 'imprimir') window.print();
    if (acao === 'ajuda') abrirDialogo(dialogoAjuda);
    if (acao === 'ocultar-ui') alternarUi();
    if (acao === 'mostrar-ui') mostrarUi();
    if (acao === 'fechar-notas') painelNotas?.classList.remove('aberto');
    if (acao === 'fechar-indice') fecharDialogo(dialogoIndice);
    if (acao === 'fechar-ajuda') fecharDialogo(dialogoAjuda);
  });

  [dialogoIndice, dialogoAjuda].forEach((dialogo) => {
    if (!dialogo) return;
    dialogo.addEventListener('click', (event) => {
      if (event.target === dialogo) dialogo.close();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const alvo = event.target;
    const digitando = alvo && (alvo.matches('input, textarea, select') || alvo.isContentEditable);
    const emBotao = alvo && alvo.closest('button, a');
    const tecla = event.key;

    if (tecla === 'Escape') {
      if (dialogoIndice?.open || dialogoAjuda?.open) {
        fecharDialogo(dialogoIndice?.open ? dialogoIndice : dialogoAjuda);
        return;
      }
      if (painelNotas?.classList.contains('aberto')) {
        painelNotas.classList.remove('aberto');
        return;
      }
      if (document.body.classList.contains('ui-oculta')) {
        mostrarUi();
        return;
      }
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      return;
    }

    if (digitando || emBotao) return;
    if (dialogoIndice?.open || dialogoAjuda?.open) return;

    if (tecla === 'ArrowRight' || tecla === 'ArrowDown' || tecla === 'PageDown' || tecla === ' ') {
      event.preventDefault();
      proximo();
    } else if (tecla === 'ArrowLeft' || tecla === 'ArrowUp' || tecla === 'PageUp') {
      event.preventDefault();
      anterior();
    } else if (tecla === 'Home') {
      event.preventDefault();
      irPara(0);
    } else if (tecla === 'End') {
      event.preventDefault();
      irPara(slides.length - 1);
    } else if (tecla === 'n' || tecla === 'N') {
      alternarNotas();
    } else if (tecla === 'o' || tecla === 'O') {
      abrirDialogo(dialogoIndice);
    } else if (tecla === 'f' || tecla === 'F') {
      alternarTelaCheia();
    } else if (tecla === 'p' || tecla === 'P') {
      window.print();
    } else if (tecla === 'u' || tecla === 'U') {
      alternarUi();
    } else if (tecla === '?') {
      abrirDialogo(dialogoAjuda);
    }
  });

  /* Swipe horizontal no palco */
  let inicioToque = null;
  palcoWrap?.addEventListener('pointerdown', (event) => {
    if (event.target.closest('input, button, a, dialog')) return;
    inicioToque = { x: event.clientX, y: event.clientY };
  });
  palcoWrap?.addEventListener('pointerup', (event) => {
    if (!inicioToque) return;
    const dx = event.clientX - inicioToque.x;
    const dy = event.clientY - inicioToque.y;
    inicioToque = null;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) proximo();
      else anterior();
    }
  });
  palcoWrap?.addEventListener('pointercancel', () => { inicioToque = null; });

  window.addEventListener('resize', () => requestAnimationFrame(ajustarEscala));
  window.addEventListener('orientationchange', () => requestAnimationFrame(ajustarEscala));
  document.addEventListener('fullscreenchange', () => requestAnimationFrame(ajustarEscala));
  window.addEventListener('hashchange', () => {
    const match = window.location.hash.match(/#\/?(\d+)/);
    if (!match) return;
    const indice = Number(match[1]) - 1;
    if (Number.isFinite(indice) && indice !== atual) irPara(indice, { silencioso: true });
  });

  /* -------------------------------------------------------
     INICIALIZAÇÃO
     ------------------------------------------------------- */

  montarIndice();
  renderizarGraficosFixos();

  const hashInicial = window.location.hash.match(/#\/?(\d+)/);
  const indiceInicial = hashInicial ? Number(hashInicial[1]) - 1 : 0;
  slides[0]?.classList.add('ativo');
  irPara(Number.isFinite(indiceInicial) ? indiceInicial : 0, { forcar: true, silencioso: true });

  requestAnimationFrame(ajustarEscala);
  window.addEventListener('load', () => requestAnimationFrame(ajustarEscala));

  /* Recalcula a escala quando a fonte ou imagens mudarem de tamanho. */
  if ('ResizeObserver' in window) {
    const observador = new ResizeObserver(() => requestAnimationFrame(ajustarEscala));
    observador.observe(palcoWrap);
  }
})();
