import {
  ArrowLeft,
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Printer,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Star,
  TriangleAlert,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import logoColorido from '../assets/logo-icone-colorido.png'
import { Badge, StatusBadge } from '../components/StatusBadge'
import { useConfiguracoes } from '../context/Configuracoes.jsx'
import { useI18n } from '../i18n/index.jsx'
import {
  atualizarStatusGestao,
  atualizarUsuarioGestao,
  criarUsuarioGestao,
  listarGestao,
  listarServicos,
  listarSetoresGestao,
  listarUsuariosGestao,
  loginGestao,
  logoutGestao,
  obterSessaoGestao,
  transferirGestao,
} from '../lib/api'
import { formatarDataHora, infoStatus } from '../lib/format'
import { infoPrazo } from '../lib/prazos'

const STATUS_OPCOES = ['recebida', 'em_analise', 'em_execucao', 'concluida', 'indeferida']
const PRIORIDADES = [
  { valor: 'normal', rotulo: 'Normal' },
  { valor: 'alta', rotulo: 'Alta' },
  { valor: 'baixa', rotulo: 'Baixa' },
]
const PAPEIS_UI = {
  admin: 'Administrador geral',
  triagem: 'Triagem / Protocolo',
  setor: 'Setor',
}
const FILTROS_INICIAIS = { status: '', tipo: '', busca: '', setor: '' }
const FORM_USUARIO_INICIAL = { nome: '', email: '', senha: '', papel: 'setor', setorId: '' }

function urlDoMapa(localizacao) {
  return `https://www.openstreetmap.org/?mlat=${localizacao.latitude}&mlon=${localizacao.longitude}#map=18/${localizacao.latitude}/${localizacao.longitude}`
}

function Estatistica({ rotulo, valor, tom = 'azul', alerta = false }) {
  return (
    <div className={`gestao-stat tom-${tom}${alerta ? ' gestao-stat--alerta' : ''}`}>
      <span className="gestao-stat__rotulo">{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  )
}

function Estrelas({ nota }) {
  return (
    <span className="avaliacao__resumo" aria-label={`Nota ${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((valor) => (
        <Star
          key={valor}
          aria-hidden="true"
          fill={valor <= nota ? 'currentColor' : 'none'}
          className={valor <= nota ? 'is-preenchida' : undefined}
        />
      ))}
    </span>
  )
}

function descreverFiltros(filtros, servicos, setores) {
  const partes = []
  if (filtros.busca) partes.push(`Busca: ${filtros.busca}`)
  if (filtros.status) partes.push(`Status: ${infoStatus(filtros.status).rotulo}`)
  if (filtros.tipo) {
    partes.push(`Serviço: ${servicos.find((servico) => servico.id === filtros.tipo)?.titulo ?? filtros.tipo}`)
  }
  if (filtros.setor) {
    partes.push(`Setor: ${setores.find((setor) => setor.id === filtros.setor)?.nome ?? filtros.setor}`)
  }
  return partes.length > 0 ? partes.join(' · ') : 'Todos os registros da fila'
}

export default function Gestao() {
  const [sessao, setSessao] = useState(null)
  const [verificandoSessao, setVerificandoSessao] = useState(true)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [lembrar, setLembrar] = useState(true)
  const [entrando, setEntrando] = useState(false)
  const [erroLogin, setErroLogin] = useState('')
  const [erro, setErro] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [dados, setDados] = useState({ dados: [], total: 0, estatisticas: null })
  const [servicos, setServicos] = useState([])
  const [setores, setSetores] = useState([])
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS)
  const [selecionada, setSelecionada] = useState(null)
  const [formStatus, setFormStatus] = useState({ status: '', prioridade: 'normal', observacao: '' })
  const [salvandoStatus, setSalvandoStatus] = useState(false)
  const [selecionados, setSelecionados] = useState([])
  const [impressao, setImpressao] = useState(null)
  const [transferindo, setTransferindo] = useState(null)
  const [formTransferencia, setFormTransferencia] = useState({
    setorDestinoId: '',
    tipoDestino: '',
    motivo: '',
    recalcularSla: false,
  })
  const [salvandoTransferencia, setSalvandoTransferencia] = useState(false)
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false)
  const [formUsuario, setFormUsuario] = useState(FORM_USUARIO_INICIAL)
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)
  const detalheRef = useRef(null)
  const { identidade } = useConfiguracoes()
  const { t } = useI18n()

  const usuario = sessao?.usuario ?? null
  const nomeApp = identidade.nome || 'Prefeitura Digital'
  const logoMarca = identidade.logo || logoColorido
  const podeVerTodos = usuario?.papel === 'admin' || usuario?.papel === 'triagem'
  const podeGerenciarUsuarios = usuario?.papel === 'admin'

  // Remove dados privilegiados da memória ao encerrar/expirar a sessão, para
  // que um login seguinte no mesmo navegador não veja resíduos da conta anterior.
  const limparEstadoSessao = useCallback(() => {
    setDados({ dados: [], total: 0, estatisticas: null })
    setFiltros(FILTROS_INICIAIS)
    setSelecionada(null)
    setSelecionados([])
    setImpressao(null)
    setTransferindo(null)
    setMostrarUsuarios(false)
    setUsuarios([])
    setFormStatus({ status: '', prioridade: 'normal', observacao: '' })
    setFormTransferencia({ setorDestinoId: '', tipoDestino: '', motivo: '', recalcularSla: false })
    setFormUsuario(FORM_USUARIO_INICIAL)
    setErro(null)
    setMensagem('')
  }, [])

  const carregar = useCallback(async (filtrosAtuais) => {
    setCarregando(true)
    setErro(null)
    try {
      const resposta = await listarGestao(filtrosAtuais)
      setDados({
        dados: resposta.dados ?? [],
        total: resposta.total ?? 0,
        estatisticas: resposta.estatisticas ?? null,
      })
    } catch (falha) {
      if (falha.status === 401) {
        setSessao(null)
        limparEstadoSessao()
        setErroLogin('Sessão expirada. Entre novamente.')
      } else {
        setErro(falha)
      }
    } finally {
      setCarregando(false)
    }
  }, [limparEstadoSessao])

  useEffect(() => {
    let ativo = true
    obterSessaoGestao()
      .then((resposta) => {
        if (ativo) setSessao(resposta)
      })
      .catch((falha) => {
        if (!ativo) return
        if (falha.status !== 401) {
          setErroLogin(
            falha.offline
              ? 'Sem conexão para validar a sessão. Volte online para acessar a gestão.'
              : 'Não foi possível validar a sessão agora. Tente novamente.',
          )
        }
      })
      .finally(() => {
        if (ativo) setVerificandoSessao(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    listarServicos().then(setServicos).catch(() => setServicos([]))
  }, [])

  useEffect(() => {
    if (!sessao?.usuario) return undefined
    let ativo = true
    listarSetoresGestao()
      .then((lista) => {
        if (ativo) setSetores(lista)
      })
      .catch(() => {
        if (ativo) setSetores([])
      })
    return () => {
      ativo = false
    }
  }, [sessao])

  useEffect(() => {
    if (!usuario) return undefined
    const timer = window.setTimeout(() => carregar(filtros), 300)
    return () => window.clearTimeout(timer)
  }, [carregar, filtros, usuario])

  useEffect(() => {
    if (selecionada) requestAnimationFrame(() => detalheRef.current?.focus())
  }, [selecionada])

  useEffect(() => {
    if (!impressao) return undefined
    const timer = window.setTimeout(() => {
      window.print()
    }, 120)
    return () => window.clearTimeout(timer)
  }, [impressao])

  useEffect(() => {
    if (!transferindo) return undefined
    const fecharComEsc = (evento) => {
      if (evento.key === 'Escape') setTransferindo(null)
    }
    window.addEventListener('keydown', fecharComEsc)
    return () => window.removeEventListener('keydown', fecharComEsc)
  }, [transferindo])

  const estatisticas = dados.estatisticas ?? {
    total: 0,
    abertas: 0,
    atrasadas: 0,
    concluidas: 0,
    avaliacoes: 0,
    mediaAvaliacao: null,
  }

  const servicosPorId = useMemo(
    () => Object.fromEntries(servicos.map((servico) => [servico.id, servico])),
    [servicos],
  )

  const setoresParaTransferencia = useMemo(
    () => setores.filter((setor) => setor.ativo !== false),
    [setores],
  )

  const todosVisiveisSelecionados =
    dados.dados.length > 0 &&
    dados.dados.every((item) => selecionados.includes(item.protocolo))

  async function entrar(evento) {
    evento.preventDefault()
    setEntrando(true)
    setErroLogin('')
    try {
      const resposta = await loginGestao({ email, senha, lembrar })
      limparEstadoSessao()
      setSessao(resposta)
      setSenha('')
    } catch (falha) {
      setErroLogin(falha.message)
    } finally {
      setEntrando(false)
    }
  }

  async function sair() {
    try {
      await logoutGestao()
    } catch {
      // O cookie pode ser limpo pelo servidor quando a conexão voltar.
    }
    setSessao(null)
    limparEstadoSessao()
    setSenha('')
    setErroLogin('')
  }

  function abrirDetalhe(item) {
    setSelecionada(item)
    setFormStatus({
      status: item.status,
      prioridade: item.prioridade ?? 'normal',
      observacao: '',
    })
    setMensagem('')
    setErro(null)
  }

  async function salvarAtualizacao(evento) {
    evento.preventDefault()
    if (!selecionada) return
    setSalvandoStatus(true)
    setMensagem('')
    setErro(null)
    try {
      const solicitacao = await atualizarStatusGestao(selecionada.protocolo, formStatus)
      setSelecionada(solicitacao)
      setFormStatus({
        status: solicitacao.status,
        prioridade: solicitacao.prioridade ?? 'normal',
        observacao: '',
      })
      setMensagem('Status atualizado. O cidadão verá a mudança ao abrir o app.')
      await carregar(filtros)
    } catch (falha) {
      setErro(falha)
    } finally {
      setSalvandoStatus(false)
    }
  }

  function atualizarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }))
    setSelecionados([])
  }

  function limparFiltros() {
    setFiltros(FILTROS_INICIAIS)
    setSelecionados([])
  }

  function alternarSelecionado(protocolo) {
    setSelecionados((atual) =>
      atual.includes(protocolo)
        ? atual.filter((item) => item !== protocolo)
        : [...atual, protocolo],
    )
  }

  function alternarTodosVisiveis() {
    if (todosVisiveisSelecionados) {
      setSelecionados((atual) =>
        atual.filter((protocolo) => !dados.dados.some((item) => item.protocolo === protocolo)),
      )
    } else {
      setSelecionados((atual) => [
        ...new Set([...atual, ...dados.dados.map((item) => item.protocolo)]),
      ])
    }
  }

  function imprimir(itens, rotulo) {
    if (itens.length === 0) {
      setErro(new Error('Selecione ao menos uma solicitação para imprimir.'))
      return
    }
    setErro(null)
    setImpressao({
      itens,
      rotulo,
      criadoEm: new Date().toISOString(),
      filtros: descreverFiltros(filtros, servicos, setores),
    })
  }

  function abrirTransferencia(item) {
    setTransferindo(item)
    setFormTransferencia({
      setorDestinoId: '',
      tipoDestino: item.tipo,
      motivo: '',
      recalcularSla: false,
    })
    setErro(null)
    setMensagem('')
  }

  function alterarTipoTransferencia(tipo) {
    const setorSugerido = setores.find(
      (setor) => !setor.central && setor.servicos?.includes(tipo),
    )
    setFormTransferencia((atual) => ({
      ...atual,
      tipoDestino: tipo,
      setorDestinoId: setorSugerido?.id ?? atual.setorDestinoId,
    }))
  }

  async function salvarTransferencia(evento) {
    evento.preventDefault()
    if (!transferindo) return
    setSalvandoTransferencia(true)
    setErro(null)
    setMensagem('')
    try {
      const solicitacao = await transferirGestao(transferindo.protocolo, formTransferencia)
      setMensagem(
        `Solicitação transferida para ${solicitacao.setorNome}. O histórico registrou a mudança.`,
      )
      setTransferindo(null)
      if (usuario?.papel === 'setor' && solicitacao.setorId !== usuario.setorId) {
        setSelecionada(null)
      } else {
        setSelecionada(solicitacao)
      }
      await carregar(filtros)
    } catch (falha) {
      setErro(falha)
    } finally {
      setSalvandoTransferencia(false)
    }
  }

  async function carregarUsuarios() {
    setCarregandoUsuarios(true)
    setErro(null)
    try {
      const [listaUsuarios, listaSetores] = await Promise.all([
        listarUsuariosGestao(),
        listarSetoresGestao(),
      ])
      setUsuarios(listaUsuarios)
      setSetores(listaSetores)
      setFormUsuario((atual) => ({
        ...atual,
        setorId:
          atual.setorId ||
          listaSetores.find((setor) => !setor.central)?.id ||
          '',
      }))
    } catch (falha) {
      setErro(falha)
    } finally {
      setCarregandoUsuarios(false)
    }
  }

  function abrirUsuarios() {
    setMostrarUsuarios(true)
    carregarUsuarios()
  }

  async function criarUsuario(evento) {
    evento.preventDefault()
    setSalvandoUsuario(true)
    setErro(null)
    setMensagem('')
    try {
      await criarUsuarioGestao({
        nome: formUsuario.nome,
        email: formUsuario.email,
        senha: formUsuario.senha,
        papel: formUsuario.papel,
        setorId: formUsuario.papel === 'setor' ? formUsuario.setorId : undefined,
      })
      setFormUsuario((atual) => ({
        ...FORM_USUARIO_INICIAL,
        setorId: setores.find((setor) => !setor.central)?.id ?? atual.setorId,
      }))
      setMensagem('Usuário criado. Ele já pode entrar com o e-mail e a senha cadastrados.')
      await carregarUsuarios()
    } catch (falha) {
      setErro(falha)
    } finally {
      setSalvandoUsuario(false)
    }
  }

  async function alternarUsuario(usuarioAtual) {
    setErro(null)
    try {
      await atualizarUsuarioGestao(usuarioAtual.id, { ativo: !usuarioAtual.ativo })
      await carregarUsuarios()
      setMensagem(
        usuarioAtual.ativo
          ? 'Usuário desativado. A sessão dele deixará de ser aceita nas próximas requisições.'
          : 'Usuário reativado.',
      )
    } catch (falha) {
      setErro(falha)
    }
  }

  if (!usuario) {
    return (
      <div className="gestao gestao--login">
        <a className="pular-para-conteudo" href="#gestao-conteudo">
          Pular para o conteúdo
        </a>
        <header className="gestao-login__marca">
          <img src={logoMarca} alt="" />
          <span>{nomeApp}</span>
          <span className="marca__selo">demo</span>
        </header>

        <main id="gestao-conteudo" className="gestao-login__cartao cartao" tabIndex={-1}>
          <span className="icone-tile tom-azul">
            <ShieldCheck aria-hidden="true" />
          </span>
          <p className="cabecalho-pagina__sobre">Acesso restrito</p>
          <h1>Painel de gestão</h1>
          <p className="texto-suave">
            Entre com seu e-mail funcional. A sessão fica salva por 30 dias quando você marca
            “manter conectado”.
          </p>

          <form className="gestao-login__form" onSubmit={entrar}>
            <div className="campo">
              <label htmlFor="email-gestao">E-mail</label>
              <div className="campo__controle">
                <Mail aria-hidden="true" />
                <input
                  id="email-gestao"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  placeholder="nome@prefeitura.gov.br"
                  required
                />
              </div>
            </div>
            <div className="campo">
              <label htmlFor="senha-gestao">Senha</label>
              <div className="campo__controle">
                <LockKeyhole aria-hidden="true" />
                <input
                  id="senha-gestao"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(evento) => setSenha(evento.target.value)}
                  aria-invalid={Boolean(erroLogin)}
                  aria-describedby={erroLogin ? 'erro-login' : 'dica-login'}
                  placeholder="Sua senha de acesso"
                  required
                />
              </div>
            </div>

            <label className="checkbox checkbox--linha">
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(evento) => setLembrar(evento.target.checked)}
              />
              <span>Manter conectado neste dispositivo</span>
            </label>

            {erroLogin && (
              <p className="alerta alerta--erro" id="erro-login" role="alert">
                <TriangleAlert aria-hidden="true" />
                <span>{erroLogin}</span>
              </p>
            )}

            <button type="submit" className="botao botao--primario" disabled={entrando || verificandoSessao}>
              {entrando || verificandoSessao ? (
                <LoaderCircle className="girando" aria-hidden="true" />
              ) : (
                <ShieldCheck aria-hidden="true" />
              )}
              {entrando ? 'Entrando…' : verificandoSessao ? 'Verificando sessão…' : 'Entrar no painel'}
            </button>

            <p className="campo__ajuda gestao-login__demo" id="dica-login">
              Demonstração: <code>admin@prefeitura.demo</code> ou{' '}
              <code>triagem@prefeitura.demo</code>; senha <code>prefeitura-demo</code>. Os setores
              usam endereços como <code>obras@prefeitura.demo</code>.
            </p>
          </form>

          <Link className="gestao-login__voltar" to="/">
            <ArrowLeft aria-hidden="true" />
            Voltar ao aplicativo
          </Link>
        </main>
      </div>
    )
  }

  const itensSelecionados = dados.dados.filter((item) => selecionados.includes(item.protocolo))

  return (
    <div className="gestao">
      <a className="pular-para-conteudo" href="#gestao-conteudo">
        Pular para o conteúdo
      </a>
      <header className="gestao-topo">
        <Link className="gestao-topo__marca" to="/">
          <img src={logoMarca} alt="" />
          <span>
            <strong>{nomeApp}</strong>
            <small>Painel de gestão</small>
          </span>
        </Link>
        <div className="gestao-topo__usuario">
          <span className="gestao-topo__pessoa">
            <strong>{usuario.nome}</strong>
            <small>
              {PAPEIS_UI[usuario.papel] ?? usuario.papel}
              {usuario.setor?.nome ? ` · ${usuario.setor.nome}` : ''}
            </small>
          </span>
          <div className="gestao-topo__acoes">
            {podeGerenciarUsuarios && (
              <button
                type="button"
                className="botao botao--secundario botao--pequeno"
                onClick={mostrarUsuarios ? () => setMostrarUsuarios(false) : abrirUsuarios}
              >
                <Users aria-hidden="true" />
                {mostrarUsuarios ? 'Fechar usuários' : 'Usuários'}
              </button>
            )}
            {podeGerenciarUsuarios && (
              <Link className="botao botao--secundario botao--pequeno" to="/gestao/configuracoes">
                <Settings2 aria-hidden="true" />
                {t('admin.configuracoes')}
              </Link>
            )}
            <Link className="botao botao--secundario botao--pequeno" to="/">
              <ArrowLeft aria-hidden="true" />
              Ver app
            </Link>
            <button
              type="button"
              className="botao botao--secundario botao--pequeno"
              onClick={() => carregar(filtros)}
              disabled={carregando}
            >
              <RefreshCw className={carregando ? 'girando' : undefined} aria-hidden="true" />
              Atualizar
            </button>
            <button type="button" className="botao botao--secundario botao--pequeno" onClick={sair}>
              <LogOut aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main id="gestao-conteudo" className="gestao-conteudo" tabIndex={-1}>
        <div className="gestao-titulo">
          <div>
            <p className="cabecalho-pagina__sobre">Operação</p>
            <h1>Solicitações</h1>
            <p className="texto-suave">
              {podeVerTodos
                ? 'Fila central e setores em um só lugar.'
                : `Fila do setor ${usuario.setor?.nome ?? 'atribuído'}. Você vê apenas as solicitações encaminhadas para sua equipe.`}
            </p>
          </div>
          <div className="gestao-titulo__selos">
            <span className="gestao-titulo__selo">
              <ShieldCheck aria-hidden="true" />
              Acesso protegido
            </span>
            <Badge tom={sessao?.triagemAutomatica ? 'info' : 'neutro'}>
              {sessao?.triagemAutomatica ? 'Triagem automática ativa' : 'Triagem manual'}
            </Badge>
          </div>
        </div>

        <div className="gestao-stats" aria-label="Resumo da fila">
          <Estatistica rotulo="Abertas" valor={estatisticas.abertas} tom="azul" />
          <Estatistica
            rotulo="Atrasadas"
            valor={estatisticas.atrasadas}
            tom="coral"
            alerta={estatisticas.atrasadas > 0}
          />
          <Estatistica rotulo="Concluídas" valor={estatisticas.concluidas} tom="verde" />
          <Estatistica
            rotulo="Avaliação média"
            valor={estatisticas.mediaAvaliacao ? estatisticas.mediaAvaliacao.toFixed(1) : '—'}
            tom="ambar"
          />
        </div>

        {mostrarUsuarios && podeGerenciarUsuarios && (
          <section className="gestao-usuarios cartao" aria-labelledby="titulo-usuarios">
            <div className="secao__cabecalho">
              <div>
                <h2 id="titulo-usuarios">Usuários e setores</h2>
                <p className="texto-suave">
                  Cada usuário de setor acessa somente a fila da própria secretaria.
                </p>
              </div>
              <button
                type="button"
                className="botao botao--secundario botao--icone"
                onClick={() => setMostrarUsuarios(false)}
                aria-label="Fechar usuários"
                title="Fechar usuários"
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <form className="gestao-usuarios__form" onSubmit={criarUsuario}>
              <div className="campo">
                <label htmlFor="usuario-nome">Nome</label>
                <input
                  id="usuario-nome"
                  value={formUsuario.nome}
                  onChange={(evento) =>
                    setFormUsuario((atual) => ({ ...atual, nome: evento.target.value }))
                  }
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="usuario-email">E-mail</label>
                <input
                  id="usuario-email"
                  type="email"
                  value={formUsuario.email}
                  onChange={(evento) =>
                    setFormUsuario((atual) => ({ ...atual, email: evento.target.value }))
                  }
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="usuario-senha">Senha inicial</label>
                <input
                  id="usuario-senha"
                  type="password"
                  minLength={8}
                  value={formUsuario.senha}
                  onChange={(evento) =>
                    setFormUsuario((atual) => ({ ...atual, senha: evento.target.value }))
                  }
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="usuario-papel">Papel</label>
                <select
                  id="usuario-papel"
                  value={formUsuario.papel}
                  onChange={(evento) => {
                    const papel = evento.target.value
                    setFormUsuario((atual) => ({
                      ...atual,
                      papel,
                      setorId:
                        papel === 'setor'
                          ? atual.setorId || setores.find((setor) => !setor.central)?.id || ''
                          : '',
                    }))
                  }}
                >
                  <option value="setor">Setor</option>
                  <option value="triagem">Triagem / Protocolo</option>
                  <option value="admin">Administrador geral</option>
                </select>
              </div>
              {formUsuario.papel === 'setor' && (
                <div className="campo">
                  <label htmlFor="usuario-setor">Setor</label>
                  <select
                    id="usuario-setor"
                    value={formUsuario.setorId}
                    onChange={(evento) =>
                      setFormUsuario((atual) => ({ ...atual, setorId: evento.target.value }))
                    }
                    required
                  >
                    <option value="">Escolha o setor</option>
                    {setores
                      .filter((setor) => !setor.central)
                      .map((setor) => (
                        <option key={setor.id} value={setor.id}>
                          {setor.nome}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <button type="submit" className="botao botao--primario" disabled={salvandoUsuario}>
                {salvandoUsuario ? (
                  <LoaderCircle className="girando" aria-hidden="true" />
                ) : (
                  <UserPlus aria-hidden="true" />
                )}
                {salvandoUsuario ? 'Criando…' : 'Criar usuário'}
              </button>
            </form>

            {carregandoUsuarios ? (
              <p className="carregando" role="status">
                <span className="spinner" aria-hidden="true" />
                Carregando usuários…
              </p>
            ) : (
              <ul className="gestao-usuarios__lista">
                {usuarios.map((usuarioListado) => (
                  <li key={usuarioListado.id} className="gestao-usuario-item">
                    <div>
                      <strong>{usuarioListado.nome}</strong>
                      <span>
                        {usuarioListado.email} · {PAPEIS_UI[usuarioListado.papel]}
                        {usuarioListado.setor?.nome ? ` · ${usuarioListado.setor.nome}` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="botao botao--secundario botao--pequeno"
                      onClick={() => alternarUsuario(usuarioListado)}
                    >
                      {usuarioListado.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="gestao-filtros" aria-label="Filtrar solicitações">
          <div className="campo-busca">
            <Search className="campo-busca__icone" aria-hidden="true" />
            <label className="sr-only" htmlFor="busca-gestao">
              Buscar protocolo, endereço ou descrição
            </label>
            <input
              id="busca-gestao"
              type="search"
              placeholder="Buscar protocolo, setor ou endereço"
              value={filtros.busca}
              onChange={(evento) => atualizarFiltro('busca', evento.target.value)}
            />
          </div>
          <label className="sr-only" htmlFor="filtro-status">
            Filtrar por status
          </label>
          <select
            id="filtro-status"
            value={filtros.status}
            onChange={(evento) => atualizarFiltro('status', evento.target.value)}
          >
            <option value="">Todos os status</option>
            {STATUS_OPCOES.map((status) => (
              <option key={status} value={status}>
                {infoStatus(status).rotulo}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="filtro-tipo">
            Filtrar por serviço
          </label>
          <select
            id="filtro-tipo"
            value={filtros.tipo}
            onChange={(evento) => atualizarFiltro('tipo', evento.target.value)}
          >
            <option value="">Todos os serviços</option>
            {servicos.map((servico) => (
              <option key={servico.id} value={servico.id}>
                {servico.titulo}
              </option>
            ))}
          </select>
          {podeVerTodos && (
            <>
              <label className="sr-only" htmlFor="filtro-setor">
                Filtrar por setor
              </label>
              <select
                id="filtro-setor"
                value={filtros.setor}
                onChange={(evento) => atualizarFiltro('setor', evento.target.value)}
              >
                <option value="">Todos os setores</option>
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </>
          )}
          <button type="button" className="botao botao--secundario botao--pequeno" onClick={limparFiltros}>
            Limpar
          </button>
        </section>

        <div className="gestao-acoes" aria-label="Impressão">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={todosVisiveisSelecionados}
              onChange={alternarTodosVisiveis}
              disabled={dados.dados.length === 0}
            />
            <span>Selecionar todos da lista</span>
          </label>
          <button
            type="button"
            className="botao botao--secundario botao--pequeno"
            onClick={() => imprimir(itensSelecionados, 'Solicitações selecionadas')}
            disabled={itensSelecionados.length === 0}
          >
            <Printer aria-hidden="true" />
            Imprimir selecionados ({itensSelecionados.length})
          </button>
          <button
            type="button"
            className="botao botao--secundario botao--pequeno"
            onClick={() => imprimir(dados.dados, 'Resultado do filtro')}
            disabled={dados.dados.length === 0}
          >
            <Printer aria-hidden="true" />
            Imprimir filtro ({dados.dados.length})
          </button>
        </div>

        {erro && (
          <p className="alerta alerta--erro" role="alert">
            <TriangleAlert aria-hidden="true" />
            <span>{erro.message}</span>
          </p>
        )}
        {mensagem && (
          <p className="alerta alerta--sucesso" role="status">
            <Check aria-hidden="true" />
            <span>{mensagem}</span>
          </p>
        )}

        <div className={`gestao-grid${selecionada ? ' tem-detalhe' : ''}`}>
          <section className="gestao-lista" aria-labelledby="titulo-fila">
            <div className="secao__cabecalho">
              <h2 id="titulo-fila">Fila de atendimento</h2>
              <span className="secao__contagem">{dados.total}</span>
            </div>

            {carregando && dados.dados.length === 0 ? (
              <p className="carregando" role="status">
                <span className="spinner" aria-hidden="true" />
                Carregando solicitações…
              </p>
            ) : dados.dados.length === 0 ? (
              <div className="cartao estado-vazio estado-vazio--compacto">
                <BarChart3 aria-hidden="true" />
                <h2>Nenhuma solicitação encontrada</h2>
                <p>Ajuste os filtros ou aguarde novas entradas.</p>
              </div>
            ) : (
              <ul className="gestao-itens">
                {dados.dados.map((item) => {
                  const prazo = infoPrazo(item)
                  const servico = servicosPorId[item.tipo]
                  return (
                    <li key={item.protocolo}>
                      <article
                        className={`gestao-item${item.slaVencido ? ' is-atrasado' : ''}${
                          selecionada?.protocolo === item.protocolo ? ' is-selecionado' : ''
                        }`}
                      >
                        <label className="gestao-item__selecao">
                          <input
                            type="checkbox"
                            checked={selecionados.includes(item.protocolo)}
                            onChange={() => alternarSelecionado(item.protocolo)}
                            aria-label={`Selecionar ${item.protocolo} para impressão`}
                          />
                        </label>
                        <div className="gestao-item__principal">
                          <div className="gestao-item__linha">
                            <code>{item.protocolo}</code>
                            <StatusBadge status={item.status} />
                            {item.transferida && (
                              <Badge tom="info">
                                <Send aria-hidden="true" />
                                Transferida
                              </Badge>
                            )}
                            {item.prioridade === 'alta' && <Badge tom="erro">Prioridade alta</Badge>}
                          </div>
                          <h3>{servico?.titulo ?? item.tipoTitulo ?? 'Serviço'}</h3>
                          <p>
                            <MapPin aria-hidden="true" />
                            {item.endereco}
                          </p>
                          <span className="gestao-item__meta">
                            <span className="gestao-item__setor">
                              <Building2 aria-hidden="true" />
                              {item.setorNome}
                            </span>
                            {' · '}
                            Aberto em {formatarDataHora(item.criadoEm)}
                            {prazo && (
                              <span className={prazo.vencido ? 'texto-atrasado' : undefined}>
                                {' '}
                                · {prazo.rotulo}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="gestao-item__lado">
                          {item.avaliacao?.nota && (
                            <span className="gestao-item__nota">
                              <Star aria-hidden="true" fill="currentColor" />
                              {item.avaliacao.nota}
                            </span>
                          )}
                          <button
                            type="button"
                            className="botao botao--secundario botao--pequeno"
                            onClick={() => abrirDetalhe(item)}
                          >
                            Abrir
                            <ChevronRight aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {selecionada && (
            <aside className="gestao-detalhe" aria-labelledby="titulo-detalhe">
              <div className="gestao-detalhe__topo">
                <div>
                  <p className="cabecalho-pagina__sobre">Solicitação</p>
                  <h2 id="titulo-detalhe" ref={detalheRef} tabIndex={-1}>
                    {selecionada.protocolo}
                  </h2>
                </div>
                <button
                  type="button"
                  className="botao botao--secundario botao--icone"
                  onClick={() => setSelecionada(null)}
                  aria-label="Fechar detalhe"
                  title="Fechar detalhe"
                >
                  <X aria-hidden="true" />
                </button>
              </div>

              <div className="gestao-detalhe__status">
                <StatusBadge status={selecionada.status} />
                {selecionada.transferida && (
                  <Badge tom="info">
                    <Send aria-hidden="true" />
                    Transferida
                  </Badge>
                )}
                {selecionada.slaVencido && (
                  <Badge tom="erro">
                    <Clock3 aria-hidden="true" />
                    Fora do prazo
                  </Badge>
                )}
                {selecionada.avaliacao?.nota && <Estrelas nota={selecionada.avaliacao.nota} />}
              </div>

              <dl className="gestao-detalhe__dados">
                <div>
                  <dt>Serviço</dt>
                  <dd>{selecionada.tipoTitulo}</dd>
                </div>
                <div>
                  <dt>Setor responsável</dt>
                  <dd>{selecionada.setorNome}</dd>
                </div>
                <div>
                  <dt>Endereço</dt>
                  <dd>{selecionada.endereco}</dd>
                </div>
                <div>
                  <dt>Aberto em</dt>
                  <dd>{formatarDataHora(selecionada.criadoEm)}</dd>
                </div>
                <div>
                  <dt>Prazo</dt>
                  <dd>{infoPrazo(selecionada)?.data ?? '—'}</dd>
                </div>
                {selecionada.contato && (
                  <div>
                    <dt>Contato informado</dt>
                    <dd>{selecionada.contato}</dd>
                  </div>
                )}
                {selecionada.localizacao && (
                  <div>
                    <dt>Localização</dt>
                    <dd>
                      <a href={urlDoMapa(selecionada.localizacao)} target="_blank" rel="noreferrer">
                        Abrir no mapa (online)
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              {selecionada.triagem && (
                <div className="gestao-triagem">
                  <div>
                    <strong>Sugestão de triagem</strong>
                    <span>
                      {selecionada.triagem.setorNome ?? selecionada.triagem.setorId} ·{' '}
                      {Math.round((selecionada.triagem.confianca ?? 0) * 100)}% de confiança
                    </span>
                  </div>
                  <Badge tom={selecionada.triagem.automatica ? 'info' : 'neutro'}>
                    {selecionada.triagem.automatica ? 'Aplicada automaticamente' : 'Sugestão manual'}
                  </Badge>
                  {selecionada.triagem.justificativa && (
                    <p>{selecionada.triagem.justificativa}</p>
                  )}
                </div>
              )}

              <section className="gestao-detalhe__descricao" aria-labelledby="titulo-descricao">
                <h3 id="titulo-descricao">Descrição</h3>
                <p>{selecionada.descricao}</p>
              </section>

              {selecionada.foto && (
                <figure className="gestao-detalhe__foto">
                  <img src={selecionada.foto} alt="Foto enviada pelo cidadão" />
                  <figcaption>Foto anexada pelo cidadão.</figcaption>
                </figure>
              )}

              <div className="gestao-detalhe__acoes">
                <button
                  type="button"
                  className="botao botao--secundario botao--pequeno"
                  onClick={() => abrirTransferencia(selecionada)}
                >
                  <Send aria-hidden="true" />
                  Transferir / reclassificar
                </button>
              </div>

              <section className="gestao-detalhe__historico" aria-labelledby="titulo-historico-gestao">
                <h3 id="titulo-historico-gestao">Histórico</h3>
                <ol className="linha-tempo">
                  {selecionada.historico.map((evento, indice) => (
                    <li
                      key={`${evento.status}-${evento.em}-${indice}`}
                      className={indice === selecionada.historico.length - 1 ? 'is-atual' : undefined}
                    >
                      <span className="linha-tempo__ponto">
                        {evento.tipo === 'transferencia' ? (
                          <Send aria-hidden="true" />
                        ) : (
                          <Clock3 aria-hidden="true" />
                        )}
                      </span>
                      <div className="linha-tempo__conteudo">
                        <strong>
                          {evento.tipo === 'transferencia'
                            ? 'Transferência'
                            : infoStatus(evento.status).rotulo}
                        </strong>
                        <time dateTime={evento.em}>{formatarDataHora(evento.em)}</time>
                        {evento.observacao && <p>{evento.observacao}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <form className="gestao-status" onSubmit={salvarAtualizacao}>
                <h3>Atualizar atendimento</h3>
                <div className="gestao-status__linha">
                  <div className="campo">
                    <label htmlFor="status-gestao">Status</label>
                    <select
                      id="status-gestao"
                      value={formStatus.status}
                      onChange={(evento) =>
                        setFormStatus((atual) => ({ ...atual, status: evento.target.value }))
                      }
                    >
                      {STATUS_OPCOES.map((status) => (
                        <option key={status} value={status}>
                          {infoStatus(status).rotulo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="campo">
                    <label htmlFor="prioridade-gestao">Prioridade</label>
                    <select
                      id="prioridade-gestao"
                      value={formStatus.prioridade}
                      onChange={(evento) =>
                        setFormStatus((atual) => ({ ...atual, prioridade: evento.target.value }))
                      }
                    >
                      {PRIORIDADES.map((prioridade) => (
                        <option key={prioridade.valor} value={prioridade.valor}>
                          {prioridade.rotulo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="campo">
                  <label htmlFor="observacao-gestao">
                    Observação para o histórico <span className="campo__opcional">(opcional)</span>
                  </label>
                  <textarea
                    id="observacao-gestao"
                    rows={3}
                    maxLength={500}
                    value={formStatus.observacao}
                    onChange={(evento) =>
                      setFormStatus((atual) => ({ ...atual, observacao: evento.target.value }))
                    }
                    placeholder="Ex.: equipe designada para vistoria na quinta-feira."
                  />
                </div>
                <button type="submit" className="botao botao--primario" disabled={salvandoStatus}>
                  {salvandoStatus ? (
                    <LoaderCircle className="girando" aria-hidden="true" />
                  ) : (
                    <Check aria-hidden="true" />
                  )}
                  {salvandoStatus ? 'Salvando…' : 'Salvar atualização'}
                </button>
              </form>
            </aside>
          )}
        </div>
      </main>

      {transferindo && (
        <div className="modal-fundo" role="presentation">
          <section
            className="modal cartao"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-transferencia"
          >
            <div className="modal__topo">
              <div>
                <p className="cabecalho-pagina__sobre">Encaminhamento</p>
                <h2 id="titulo-transferencia">Transferir solicitação</h2>
                <p className="texto-suave">{transferindo.protocolo}</p>
              </div>
              <button
                type="button"
                className="botao botao--secundario botao--icone"
                onClick={() => setTransferindo(null)}
                aria-label="Fechar transferência"
                title="Fechar transferência"
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <form className="modal__form" onSubmit={salvarTransferencia}>
              <div className="campo">
                <label htmlFor="transferencia-setor">Setor de destino</label>
                <select
                  id="transferencia-setor"
                  value={formTransferencia.setorDestinoId}
                  onChange={(evento) =>
                    setFormTransferencia((atual) => ({
                      ...atual,
                      setorDestinoId: evento.target.value,
                    }))
                  }
                  required
                  autoFocus
                >
                  <option value="">Escolha o setor</option>
                  {setoresParaTransferencia.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label htmlFor="transferencia-tipo">
                  Serviço / categoria <span className="campo__opcional">(reclassificar se necessário)</span>
                </label>
                <select
                  id="transferencia-tipo"
                  value={formTransferencia.tipoDestino}
                  onChange={(evento) => alterarTipoTransferencia(evento.target.value)}
                >
                  {servicos.map((servico) => (
                    <option key={servico.id} value={servico.id}>
                      {servico.titulo}
                    </option>
                  ))}
                </select>
                <p className="campo__ajuda">
                  O prazo original é preservado. Marque a opção abaixo somente se a reclassificação
                  exigir um novo prazo legal.
                </p>
              </div>

              <div className="campo">
                <label htmlFor="transferencia-motivo">Motivo da transferência</label>
                <textarea
                  id="transferencia-motivo"
                  rows={3}
                  maxLength={500}
                  value={formTransferencia.motivo}
                  onChange={(evento) =>
                    setFormTransferencia((atual) => ({ ...atual, motivo: evento.target.value }))
                  }
                  placeholder="Explique por que o pedido está sendo encaminhado."
                  required
                />
              </div>

              <label className="checkbox checkbox--linha">
                <input
                  type="checkbox"
                  checked={formTransferencia.recalcularSla}
                  onChange={(evento) =>
                    setFormTransferencia((atual) => ({
                      ...atual,
                      recalcularSla: evento.target.checked,
                    }))
                  }
                />
                <span>Recalcular o SLA pelo novo serviço (ação excepcional)</span>
              </label>

              {erro && (
                <p className="alerta alerta--erro" role="alert">
                  <TriangleAlert aria-hidden="true" />
                  <span>{erro.message}</span>
                </p>
              )}

              <div className="modal__acoes">
                <button
                  type="button"
                  className="botao botao--secundario"
                  onClick={() => setTransferindo(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="botao botao--primario" disabled={salvandoTransferencia}>
                  {salvandoTransferencia ? (
                    <LoaderCircle className="girando" aria-hidden="true" />
                  ) : (
                    <Send aria-hidden="true" />
                  )}
                  {salvandoTransferencia ? 'Transferindo…' : 'Confirmar transferência'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {impressao && (
        <section className="area-impressao" aria-label={`Impressão: ${impressao.rotulo}`}>
          <header className="impressao__cabecalho">
            <div>
              <strong>{nomeApp}</strong>
              <span>Painel de gestão · {impressao.rotulo}</span>
            </div>
            <span>{formatarDataHora(impressao.criadoEm)}</span>
          </header>
          <p className="impressao__filtros">
            <strong>Filtros:</strong> {impressao.filtros}
          </p>
          <table className="impressao__tabela">
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Serviço</th>
                <th>Setor</th>
                <th>Endereço</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Aberto em</th>
                <th>Prazo</th>
              </tr>
            </thead>
            <tbody>
              {impressao.itens.map((item) => (
                <tr key={item.protocolo}>
                  <td>{item.protocolo}</td>
                  <td>{item.tipoTitulo}</td>
                  <td>{item.setorNome}</td>
                  <td>{item.endereco}</td>
                  <td>{infoStatus(item.status).rotulo}</td>
                  <td>{item.prioridade}</td>
                  <td>{formatarDataHora(item.criadoEm)}</td>
                  <td>{infoPrazo(item)?.data ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer className="impressao__rodape">
            <span>Total: {impressao.itens.length}</span>
            <span>Documento gerado pelo painel de gestão.</span>
          </footer>
        </section>
      )}
    </div>
  )
}
