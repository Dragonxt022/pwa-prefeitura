import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  Clock3,
  Copy,
  ImagePlus,
  Info,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UploadCloud,
  WifiOff,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ErrorState from '../componentes/ErrorState'
import { IlustracaoSucesso } from '../componentes/Ilustracoes'
import { SkeletonBloco } from '../componentes/Loading'
import { StatusBadge } from '../componentes/StatusBadge'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useRecurso } from '../hooks/useRecurso'
import {
  consultarSemelhantes,
  criarSolicitacao,
  listarServicos,
} from '../servicos/api'
import { consultarCep } from '../servicos/cep'
import { listarPedidos, registrarConsulta, registrarPedido } from '../servicos/consultas'
import { enfileirar, listarFila, ultimoEnvio } from '../servicos/fila'
import { formatarDataHora } from '../utils/format'
import { prepararFoto } from '../utils/imagem'
import { infoPrazo } from '../utils/prazos'
import { carregarRascunho, limparRascunho, salvarRascunho } from '../servicos/rascunho'
import { visualServico } from '../utils/visual'

const LIMITES = {
  descricaoMin: 10,
  descricaoMax: 1200,
  enderecoMin: 5,
  enderecoMax: 200,
  contatoMax: 120,
}

const FORMULARIO_VAZIO = {
  tipo: '',
  descricao: '',
  endereco: '',
  contato: '',
  cep: '',
  localizacao: null,
  foto: null,
}

const normalizar = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

function formatarCep(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, 8)
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos
}

function novoClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `pedido-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function temConteudo(formulario) {
  return Object.entries(formulario).some(([campo, valor]) => {
    if (campo === 'localizacao') return Boolean(valor)
    if (campo === 'foto') return Boolean(valor)
    return String(valor ?? '').trim().length > 0
  })
}

export default function NovaSolicitacao() {
  const [params] = useSearchParams()
  const tipoDaUrl = params.get('tipo') ?? ''
  const online = useOnlineStatus()

  const rascunhoInicial = useMemo(() => carregarRascunho(), [])
  const { dados: servicos, carregando, erro: erroServicos, recarregar } = useRecurso(listarServicos, [])

  const [formulario, setFormulario] = useState(() => {
    const salvo = rascunhoInicial?.formulario ?? {}
    return {
      ...FORMULARIO_VAZIO,
      ...salvo,
      tipo: tipoDaUrl || salvo.tipo || '',
    }
  })
  const [buscaServico, setBuscaServico] = useState('')
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [fotoErro, setFotoErro] = useState('')
  const [mensagemFoto, setMensagemFoto] = useState('')
  const [processandoFoto, setProcessandoFoto] = useState(false)
  const [localizando, setLocalizando] = useState(false)
  const [mensagemLocalizacao, setMensagemLocalizacao] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [mensagemCep, setMensagemCep] = useState('')
  const [semelhantes, setSemelhantes] = useState([])
  const [consultandoSemelhantes, setConsultandoSemelhantes] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [protocolo, setProtocolo] = useState(null)
  const [pendente, setPendente] = useState(null)
  const [pendenteEm, setPendenteEm] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [rascunhoStatus, setRascunhoStatus] = useState(
    rascunhoInicial?.formulario && temConteudo(rascunhoInicial.formulario)
      ? 'Rascunho restaurado. Continue de onde parou.'
      : '',
  )

  const resumoErroRef = useRef(null)
  const enderecoRef = useRef(null)
  const fotoInputRef = useRef(null)

  const servicosFiltrados = useMemo(() => {
    const termo = normalizar(buscaServico).trim()
    if (!termo) return servicos ?? []
    return (servicos ?? []).filter((servico) =>
      normalizar(`${servico.titulo} ${servico.descricao} ${servico.categoria}`).includes(termo),
    )
  }, [buscaServico, servicos])

  const servicoSelecionado = useMemo(
    () => (servicos ?? []).find((servico) => servico.id === formulario.tipo),
    [formulario.tipo, servicos],
  )

  const formularioInicialRef = useRef(formulario)

  useEffect(() => {
    // Um rascunho recém-restaurado já está salvo; preserve o aviso até haver edição.
    if (formulario === formularioInicialRef.current) return undefined
    if (protocolo || pendente || !temConteudo(formulario)) return undefined

    const timer = window.setTimeout(() => {
      const salvo = salvarRascunho(formulario)
      setRascunhoStatus(salvo ? 'Rascunho salvo neste aparelho.' : 'Não foi possível salvar o rascunho.')
    }, 700)

    return () => window.clearTimeout(timer)
  }, [formulario, protocolo, pendente])

  useEffect(() => {
    const tipo = formulario.tipo
    const endereco = formulario.endereco.trim()
    if (!tipo || endereco.length < LIMITES.enderecoMin) {
      setSemelhantes([])
      return undefined
    }

    let ativo = true
    const timer = window.setTimeout(async () => {
      setConsultandoSemelhantes(true)
      try {
        const dados = await consultarSemelhantes({
          tipo,
          endereco,
          latitude: formulario.localizacao?.latitude,
          longitude: formulario.localizacao?.longitude,
        })
        if (ativo) setSemelhantes(dados)
      } catch {
        if (ativo) setSemelhantes([])
      } finally {
        if (ativo) setConsultandoSemelhantes(false)
      }
    }, 900)

    return () => {
      ativo = false
      window.clearTimeout(timer)
    }
  }, [formulario.tipo, formulario.endereco, formulario.localizacao])

  useEffect(() => {
    if (!pendente || !pendenteEm) return undefined

    const verificarEnvio = () => {
      const aindaNaFila = listarFila().some((item) => item.clientId === pendente.clientId)
      if (aindaNaFila) return

      const envio = ultimoEnvio()
      if (!envio?.protocolo || !envio.em || envio.em < pendenteEm) return
      const pedido = listarPedidos().find((item) => item.protocolo === envio.protocolo)
      if (!pedido) return

      setPendente(null)
      setPendenteEm(null)
      setProtocolo(pedido)
    }

    window.addEventListener('prefeitura:fila', verificarEnvio)
    return () => window.removeEventListener('prefeitura:fila', verificarEnvio)
  }, [pendente, pendenteEm])

  function alterar(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
    setErros((atuais) => {
      if (!(campo in atuais)) return atuais
      const { [campo]: _removido, ...resto } = atuais
      return resto
    })
    setErroGeral(null)
  }

  function selecionarServico(id) {
    alterar('tipo', id)
    setBuscaServico('')
  }

  function validar() {
    const proximos = {}
    const descricao = formulario.descricao.trim()
    const endereco = formulario.endereco.trim()

    if (!formulario.tipo) proximos.tipo = 'Escolha um serviço.'
    if (descricao.length < LIMITES.descricaoMin) {
      proximos.descricao = `Mínimo de ${LIMITES.descricaoMin} caracteres.`
    } else if (descricao.length > LIMITES.descricaoMax) {
      proximos.descricao = `Máximo de ${LIMITES.descricaoMax} caracteres.`
    }
    if (endereco.length < LIMITES.enderecoMin) {
      proximos.endereco = 'Informe o endereço com um ponto de referência.'
    } else if (endereco.length > LIMITES.enderecoMax) {
      proximos.endereco = `Máximo de ${LIMITES.enderecoMax} caracteres.`
    }
    if (formulario.contato.trim().length > LIMITES.contatoMax) {
      proximos.contato = `Máximo de ${LIMITES.contatoMax} caracteres.`
    }

    setErros(proximos)
    return Object.keys(proximos).length === 0
  }

  async function buscarCep() {
    const cep = formulario.cep.replace(/\D/g, '')
    if (cep.length !== 8) {
      setMensagemCep('Informe um CEP com 8 dígitos.')
      return
    }
    if (!online) {
      setMensagemCep('Sem conexão. Preencha o endereço manualmente.')
      return
    }

    setBuscandoCep(true)
    setMensagemCep('')
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 7000)

    try {
      const dados = await consultarCep(cep, { signal: controller.signal })
      if (dados.erro) {
        setMensagemCep('CEP não encontrado. Confira os números.')
        return
      }

      const numeroAtual = formulario.endereco.match(/,\s*(\d+[A-Za-z]?)/)?.[1]
      const logradouro = [dados.logradouro, numeroAtual].filter(Boolean).join(', ')
      const endereco = [logradouro, dados.bairro, dados.localidade]
        .filter(Boolean)
        .join(' - ')
        .slice(0, LIMITES.enderecoMax)

      if (endereco) {
        alterar('endereco', endereco)
        setMensagemCep(
          `Endereço localizado em ${dados.localidade}/${dados.uf}. Complete com o número e o complemento.`,
        )
        requestAnimationFrame(() => enderecoRef.current?.focus())
      } else {
        setMensagemCep('O CEP não trouxe um logradouro. Preencha o endereço manualmente.')
      }
    } catch (erro) {
      setMensagemCep(
        erro?.name === 'AbortError'
          ? 'A consulta demorou. Preencha o endereço manualmente.'
          : 'Não foi possível consultar o CEP. Preencha o endereço manualmente.',
      )
    } finally {
      window.clearTimeout(timer)
      setBuscandoCep(false)
    }
  }

  function capturarLocalizacao() {
    if (!navigator.geolocation) {
      setMensagemLocalizacao('Este navegador não oferece localização.')
      return
    }

    setLocalizando(true)
    setMensagemLocalizacao('Obtendo sua localização…')
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const localizacao = {
          latitude: Number(posicao.coords.latitude.toFixed(6)),
          longitude: Number(posicao.coords.longitude.toFixed(6)),
          precisao: Math.round(posicao.coords.accuracy),
        }
        alterar('localizacao', localizacao)
        setMensagemLocalizacao(
          `Localização anexada com precisão de aproximadamente ${localizacao.precisao} m.`,
        )
        setLocalizando(false)
      },
      (falha) => {
        setLocalizando(false)
        setMensagemLocalizacao(
          falha.code === falha.PERMISSION_DENIED
            ? 'Permissão de localização não concedida. Você pode informar o endereço.'
            : 'Não foi possível obter a localização. Tente novamente ou siga só com o endereço.',
        )
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    )
  }

  async function escolherFoto(evento) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return

    setFotoErro('')
    setMensagemFoto('')
    setProcessandoFoto(true)
    try {
      const preparada = await prepararFoto(arquivo)
      alterar('foto', preparada.dataUrl)
      setMensagemFoto('Foto pronta. Metadados de localização foram removidos.')
    } catch (erro) {
      setFotoErro(erro.message)
    } finally {
      setProcessandoFoto(false)
      if (fotoInputRef.current) fotoInputRef.current.value = ''
    }
  }

  function salvarNaFila(payload) {
    enfileirar(payload)
    const persistiu = listarFila().some((item) => item.clientId === payload.clientId)
    if (!persistiu) {
      setErroGeral(
        new Error(
          'Não há espaço no aparelho para guardar este pedido. Tente sem a foto ou libere armazenamento.',
        ),
      )
      return false
    }

    limparRascunho()
    setRascunhoStatus('')
    setPendente(payload)
    setPendenteEm(new Date().toISOString())
    return true
  }

  function concluir(criada) {
    registrarConsulta(criada.protocolo)
    registrarPedido(criada)
    limparRascunho()
    setRascunhoStatus('')
    setProtocolo(criada)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function aoEnviar(evento) {
    evento.preventDefault()
    setErroGeral(null)
    setFotoErro('')

    if (!validar()) {
      requestAnimationFrame(() => resumoErroRef.current?.focus())
      return
    }

    const payload = {
      tipo: formulario.tipo,
      descricao: formulario.descricao,
      endereco: formulario.endereco,
      contato: formulario.contato,
      foto: formulario.foto,
      localizacao: formulario.localizacao,
      clientId: novoClientId(),
    }

    setEnviando(true)
    if (!online) {
      salvarNaFila(payload)
      setEnviando(false)
      return
    }

    try {
      const criada = await criarSolicitacao(payload)
      concluir(criada)
    } catch (erro) {
      if (erro.offline) {
        salvarNaFila(payload)
      } else {
        setErroGeral(erro)
        if (erro.campos) {
          setErros(erro.campos)
          if (erro.campos.foto) setFotoErro(erro.campos.foto)
        }
        requestAnimationFrame(() => resumoErroRef.current?.focus())
      }
    } finally {
      setEnviando(false)
    }
  }

  async function copiarProtocolo() {
    try {
      await navigator.clipboard.writeText(protocolo.protocolo)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }

  function novaSolicitacao() {
    limparRascunho()
    setFormulario({ ...FORMULARIO_VAZIO })
    setProtocolo(null)
    setPendente(null)
    setPendenteEm(null)
    setErros({})
    setErroGeral(null)
    setFotoErro('')
    setMensagemFoto('')
    setMensagemLocalizacao('')
    setMensagemCep('')
    setSemelhantes([])
    setCopiado(false)
    setRascunhoStatus('')
    setBuscaServico('')
  }

  if (protocolo) {
    const servico = visualServico(protocolo.tipo)
    const IconeServico = servico.Icone
    const prazo = infoPrazo(protocolo)

    return (
      <div className="pagina pagina--estreita">
        <div className="cartao cartao--confirmacao">
          <IlustracaoSucesso className="confirmacao__arte" />
          <span className="selo selo--sucesso">
            <Check aria-hidden="true" />
            Protocolo criado
          </span>
          <h1>Pronto!</h1>
          <p className="texto-suave">Guarde o número para acompanhar.</p>

          <div className="protocolo-caixa">
            <code>{protocolo.protocolo}</code>
            <button
              type="button"
              className="botao botao--secundario botao--icone"
              onClick={copiarProtocolo}
              aria-label={copiado ? 'Protocolo copiado' : 'Copiar protocolo'}
              title={copiado ? 'Protocolo copiado' : 'Copiar protocolo'}
            >
              {copiado ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            </button>
          </div>
          <span className="protocolo-caixa__status" role="status">
            {copiado ? 'Copiado' : ''}
          </span>

          <ul className="lista-dados">
            <li className="lista-dados__item">
              <span className={`lista-dados__icone tom-${servico.tom}`}>
                <IconeServico aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Serviço</span>
                <strong className="lista-dados__valor">{protocolo.tipoTitulo}</strong>
              </span>
            </li>
            <li className="lista-dados__item">
              <span className="lista-dados__icone tom-azul">
                <MapPin aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Endereço</span>
                <strong className="lista-dados__valor">{protocolo.endereco}</strong>
              </span>
            </li>
            <li className="lista-dados__item">
              <span className="lista-dados__icone tom-azul">
                <CalendarDays aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Registrado em</span>
                <strong className="lista-dados__valor">{formatarDataHora(protocolo.criadoEm)}</strong>
              </span>
            </li>
            {prazo && (
              <li className="lista-dados__item">
                <span className="lista-dados__icone tom-verde">
                  <Clock3 aria-hidden="true" />
                </span>
                <span className="lista-dados__texto">
                  <span className="lista-dados__rotulo">Prazo estimado</span>
                  <strong className="lista-dados__valor">
                    {prazo.data} · {prazo.rotulo}
                  </strong>
                </span>
              </li>
            )}
            {protocolo.localizacao && (
              <li className="lista-dados__item">
                <span className="lista-dados__icone tom-azul">
                  <LocateFixed aria-hidden="true" />
                </span>
                <span className="lista-dados__texto">
                  <span className="lista-dados__rotulo">Localização</span>
                  <strong className="lista-dados__valor">Anexada ao pedido</strong>
                </span>
              </li>
            )}
          </ul>

          <div className="acoes acoes--centro">
            <Link className="botao botao--primario" to={`/acompanhar?protocolo=${protocolo.protocolo}`}>
              Acompanhar
              <ArrowRight aria-hidden="true" />
            </Link>
            <button type="button" className="botao botao--secundario" onClick={novaSolicitacao}>
              Nova solicitação
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (pendente) {
    const servico = visualServico(pendente.tipo)
    const IconeServico = servico.Icone

    return (
      <div className="pagina pagina--estreita">
        <div className="cartao cartao--confirmacao cartao--pendente">
          <span className="selo selo--pendente">
            <WifiOff aria-hidden="true" />
            Guardado no aparelho
          </span>
          <h1>Pedido salvo</h1>
          <p className="texto-suave">
            Sem conexão agora. Vamos enviar automaticamente quando a internet voltar.
          </p>

          <ul className="lista-dados">
            <li className="lista-dados__item">
              <span className={`lista-dados__icone tom-${servico.tom}`}>
                <IconeServico aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Serviço</span>
                <strong className="lista-dados__valor">{servicoSelecionado?.titulo ?? servico.rotulo}</strong>
              </span>
            </li>
            <li className="lista-dados__item">
              <span className="lista-dados__icone tom-azul">
                <MapPin aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Endereço</span>
                <strong className="lista-dados__valor">{pendente.endereco}</strong>
              </span>
            </li>
          </ul>

          <p className="alerta alerta--info">
            <Info aria-hidden="true" />
            <span>O protocolo será gerado no envio. Acompanhe a fila em “Meus pedidos”.</span>
          </p>

          <div className="acoes acoes--centro">
            <Link className="botao botao--primario" to="/acompanhar">
              Meus pedidos
              <ArrowRight aria-hidden="true" />
            </Link>
            <button type="button" className="botao botao--secundario" onClick={novaSolicitacao}>
              Nova solicitação
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pagina pagina--estreita">
      <header className="cabecalho-pagina">
        <p className="cabecalho-pagina__sobre">Nova solicitação</p>
        <h1>O que aconteceu?</h1>
        <p className="texto-suave">
          Escolha o serviço, informe o local e, se puder, anexe uma foto.
        </p>
      </header>

      {erroServicos ? (
        <ErrorState erro={erroServicos} aoTentarNovamente={recarregar} />
      ) : carregando ? (
        <SkeletonBloco linhas={5} />
      ) : (
        <form className="cartao formulario" onSubmit={aoEnviar} noValidate>
          {rascunhoStatus && (
            <p className="rascunho-status" role="status">
              <Check aria-hidden="true" />
              {rascunhoStatus}
            </p>
          )}

          <div ref={resumoErroRef} tabIndex={-1} className="resumo-validacao" aria-live="assertive">
            {(erroGeral || Object.values(erros).some(Boolean) || fotoErro) && (
              <div className="alerta alerta--erro" role="alert">
                <AlertCircle aria-hidden="true" />
                <div>
                  <strong>
                    {erroGeral?.message
                      ? 'Não foi possível enviar.'
                      : 'Revise os campos destacados.'}
                  </strong>
                  {erroGeral?.message && <p>{erroGeral.message}</p>}
                  {erroGeral?.codigo === 'limite_excedido' && (
                    <p>Aguarde um minuto antes de enviar outra solicitação.</p>
                  )}
                  {fotoErro && <p>{fotoErro}</p>}
                </div>
              </div>
            )}
          </div>

          <fieldset
            className={`campo campo--servicos${erros.tipo ? ' campo--erro' : ''}`}
            aria-describedby={erros.tipo ? 'erro-tipo ajuda-servicos' : 'ajuda-servicos'}
          >
            <legend>Serviço</legend>
            <div className="campo-busca campo-busca--form">
              <Search className="campo-busca__icone" aria-hidden="true" />
              <label className="sr-only" htmlFor="busca-servico-form">
                Buscar serviço
              </label>
              <input
                id="busca-servico-form"
                type="search"
                placeholder="Busque pelo nome ou assunto"
                value={buscaServico}
                onChange={(evento) => setBuscaServico(evento.target.value)}
                aria-controls="lista-servicos"
                aria-describedby="ajuda-servicos"
              />
            </div>
            <p className="campo__ajuda" id="ajuda-servicos">
              {servicos.length} serviços disponíveis. A busca não altera o serviço escolhido.
            </p>
            <div className="escolha-servicos" id="lista-servicos">
              {servicosFiltrados.map((servico) => {
                const { Icone, tom } = visualServico(servico.id)
                const selecionado = formulario.tipo === servico.id
                return (
                  <label
                    key={servico.id}
                    className={`escolha-servico tom-${tom}${selecionado ? ' is-selecionado' : ''}`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={servico.id}
                      checked={selecionado}
                      onChange={() => selecionarServico(servico.id)}
                      className="sr-only"
                    />
                    <span className="escolha-servico__icone">
                      <Icone aria-hidden="true" />
                    </span>
                    <span className="escolha-servico__rotulo">{servico.titulo}</span>
                    <span className="escolha-servico__categoria">{servico.categoria}</span>
                    <span className="escolha-servico__prazo">
                      <Clock3 aria-hidden="true" />
                      {servico.prazoDias} dias
                    </span>
                  </label>
                )
              })}
            </div>
            {servicosFiltrados.length === 0 && (
              <p className="campo__ajuda" role="status">
                Nenhum serviço encontrado. Tente outro termo.
              </p>
            )}
            {erros.tipo && (
              <p className="campo__erro" id="erro-tipo">
                {erros.tipo}
              </p>
            )}
          </fieldset>

          <div className={`campo${erros.descricao ? ' campo--erro' : ''}`}>
            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              rows={4}
              maxLength={LIMITES.descricaoMax}
              value={formulario.descricao}
              onChange={(evento) => alterar('descricao', evento.target.value)}
              placeholder="Ex.: poste apagado na Rua das Palmeiras, 120."
              aria-invalid={Boolean(erros.descricao)}
              aria-describedby={erros.descricao ? 'erro-descricao ajuda-descricao' : 'ajuda-descricao'}
            />
            <div className="campo__rodape">
              <p className="campo__ajuda" id="ajuda-descricao">
                Descreva o problema sem incluir dados de terceiros.
              </p>
              <span className="campo__contador" aria-hidden="true">
                {formulario.descricao.length}/{LIMITES.descricaoMax}
              </span>
            </div>
            {erros.descricao && (
              <p className="campo__erro" id="erro-descricao">
                {erros.descricao}
              </p>
            )}
          </div>

          <div className="campo">
            <label htmlFor="cep">
              CEP <span className="campo__opcional">(opcional, para preencher o endereço)</span>
            </label>
            <div className="campo__controle campo__controle--cep">
              <input
                id="cep"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={9}
                value={formulario.cep}
                onChange={(evento) => {
                  alterar('cep', formatarCep(evento.target.value))
                  setMensagemCep('')
                }}
                aria-describedby="ajuda-cep"
                placeholder="00000-000"
              />
              <button
                type="button"
                className="botao botao--secundario botao--pequeno"
                onClick={buscarCep}
                disabled={buscandoCep}
              >
                {buscandoCep ? <LoaderCircle className="girando" aria-hidden="true" /> : null}
                {buscandoCep ? 'Buscando' : 'Buscar CEP'}
              </button>
            </div>
            <p className="campo__ajuda" id="ajuda-cep">
              Consulta online opcional. Se estiver offline, preencha o endereço manualmente.
            </p>
            {mensagemCep && (
              <p className="campo__ajuda campo__ajuda--status" role="status" aria-live="polite">
                {mensagemCep}
              </p>
            )}
          </div>

          <div className={`campo${erros.endereco ? ' campo--erro' : ''}`}>
            <label htmlFor="endereco">Endereço</label>
            <div className="campo__controle">
              <MapPin aria-hidden="true" />
              <input
                ref={enderecoRef}
                id="endereco"
                type="text"
                maxLength={LIMITES.enderecoMax}
                value={formulario.endereco}
                onChange={(evento) => alterar('endereco', evento.target.value)}
                placeholder="Rua, número, bairro e ponto de referência"
                aria-invalid={Boolean(erros.endereco)}
                aria-describedby={erros.endereco ? 'erro-endereco ajuda-endereco' : 'ajuda-endereco'}
              />
            </div>
            <p className="campo__ajuda" id="ajuda-endereco">
              Inclua o número ou um ponto de referência para facilitar a localização.
            </p>
            {erros.endereco && (
              <p className="campo__erro" id="erro-endereco">
                {erros.endereco}
              </p>
            )}
          </div>

          <fieldset className="campo">
            <legend>
              Localização <span className="campo__opcional">(opcional)</span>
            </legend>
            {formulario.localizacao ? (
              <div className="localizacao-anexada">
                <span className="localizacao-anexada__icone">
                  <LocateFixed aria-hidden="true" />
                </span>
                <div>
                  <strong>Localização anexada</strong>
                  <p>
                    {formulario.localizacao.latitude.toFixed(5)},{' '}
                    {formulario.localizacao.longitude.toFixed(5)}
                    {formulario.localizacao.precisao
                      ? ` · precisão de ${formulario.localizacao.precisao} m`
                      : ''}
                  </p>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${formulario.localizacao.latitude}&mlon=${formulario.localizacao.longitude}#map=18/${formulario.localizacao.latitude}/${formulario.localizacao.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver no mapa (online)
                  </a>
                </div>
                <button
                  type="button"
                  className="botao botao--secundario botao--icone"
                  onClick={() => {
                    alterar('localizacao', null)
                    setMensagemLocalizacao('Localização removida.')
                  }}
                  aria-label="Remover localização"
                  title="Remover localização"
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="botao botao--secundario localizacao-botao"
                onClick={capturarLocalizacao}
                disabled={localizando}
              >
                {localizando ? (
                  <LoaderCircle className="girando" aria-hidden="true" />
                ) : (
                  <LocateFixed aria-hidden="true" />
                )}
                {localizando ? 'Obtendo localização' : 'Usar minha localização'}
              </button>
            )}
            <p className="campo__ajuda">
              A localização é opcional; o endereço continua sendo a referência principal.
            </p>
            {mensagemLocalizacao && (
              <p className="campo__ajuda campo__ajuda--status" role="status" aria-live="polite">
                {mensagemLocalizacao}
              </p>
            )}
          </fieldset>

          {semelhantes.length > 0 && (
            <div className="alerta alerta--info duplicidade" role="status">
              <Info aria-hidden="true" />
              <div>
                <strong>Já existe um pedido parecido</strong>
                <p>Se for o mesmo problema, acompanhe o protocolo existente.</p>
                <ul>
                  {semelhantes.map((item) => (
                    <li key={item.protocolo}>
                      <Link to={`/acompanhar?protocolo=${item.protocolo}`}>
                        {item.protocolo}
                      </Link>
                      <StatusBadge status={item.status} />
                      <span>
                        {Number.isFinite(item.distanciaMetros)
                          ? `A cerca de ${item.distanciaMetros} m`
                          : 'Pedido existente'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {consultandoSemelhantes && semelhantes.length === 0 && (
            <p className="campo__ajuda" role="status">
              Verificando pedidos parecidos…
            </p>
          )}

          <fieldset className="campo">
            <legend>
              Foto <span className="campo__opcional">(opcional)</span>
            </legend>
            {formulario.foto ? (
              <div className="foto-anexada">
                <img src={formulario.foto} alt="Prévia da foto anexada ao pedido" />
                <div className="foto-anexada__acoes">
                  <span className="foto-anexada__ok">
                    <ImagePlus aria-hidden="true" />
                    Foto anexada
                  </span>
                  <button
                    type="button"
                    className="botao botao--secundario botao--pequeno"
                    onClick={() => {
                      alterar('foto', null)
                      setMensagemFoto('')
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <label className="foto-input" htmlFor="foto">
                <Camera aria-hidden="true" />
                <span>{processandoFoto ? 'Preparando foto…' : 'Escolher ou tirar foto'}</span>
                <span className="foto-input__ajuda">JPEG, PNG ou WebP · até 8 MB</span>
                <input
                  ref={fotoInputRef}
                  id="foto"
                  type="file"
                  accept="image/*"
                  onChange={escolherFoto}
                  disabled={processandoFoto}
                  aria-describedby="ajuda-foto"
                />
              </label>
            )}
            <p className="campo__ajuda" id="ajuda-foto">
              A foto ajuda a equipe a localizar o problema. Ela é reduzida e tem os metadados removidos
              antes do envio.
            </p>
            {mensagemFoto && (
              <p className="campo__ajuda campo__ajuda--status" role="status" aria-live="polite">
                <Check aria-hidden="true" />
                {mensagemFoto}
              </p>
            )}
          </fieldset>

          <div className={`campo${erros.contato ? ' campo--erro' : ''}`}>
            <label htmlFor="contato">
              Contato <span className="campo__opcional">(opcional)</span>
            </label>
            <div className="campo__controle">
              <Phone aria-hidden="true" />
              <input
                id="contato"
                type="text"
                maxLength={LIMITES.contatoMax}
                value={formulario.contato}
                onChange={(evento) => alterar('contato', evento.target.value)}
                placeholder="Telefone ou e-mail"
                aria-invalid={Boolean(erros.contato)}
                aria-describedby={erros.contato ? 'erro-contato' : undefined}
              />
            </div>
            {erros.contato && (
              <p className="campo__erro" id="erro-contato">
                {erros.contato}
              </p>
            )}
          </div>

          {!online && (
            <p className="alerta alerta--info">
              <WifiOff aria-hidden="true" />
              <span>
                Sem conexão: o pedido será guardado no aparelho e enviado quando a internet voltar.
              </span>
            </p>
          )}

          <div className="formulario__acoes">
            <Link className="botao botao--secundario" to="/">
              Cancelar
            </Link>
            <button type="submit" className="botao botao--primario" disabled={enviando}>
              {enviando ? (
                <>
                  <LoaderCircle className="girando" aria-hidden="true" />
                  Enviando
                </>
              ) : online ? (
                <>
                  <Send aria-hidden="true" />
                  Enviar solicitação
                </>
              ) : (
                <>
                  <UploadCloud aria-hidden="true" />
                  Salvar no aparelho
                </>
              )}
            </button>
          </div>

          <p className="formulario__nota">
            <ShieldCheck aria-hidden="true" />
            A foto e os dados são usados apenas neste atendimento.
          </p>
        </form>
      )}
    </div>
  )
}
