import {
  Bell,
  CalendarDays,
  ClipboardList,
  Contrast,
  Download,
  Fingerprint,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Smartphone,
  SlidersHorizontal,
  Trash2,
  UserRound,
  ZoomIn,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PerfilAcesso from '../componentes/perfil/PerfilAcesso'
import PerfilFormulario from '../componentes/perfil/PerfilFormulario'
import { SkeletonBloco } from '../componentes/Loading'
import { Badge } from '../componentes/StatusBadge'
import { useCidadao } from '../contexto/useCidadao'
import { usePwaInstall } from '../hooks/usePwaInstall'
import {
  lerPreferenciasAcessibilidade,
  salvarPreferenciasAcessibilidade,
} from '../utils/acessibilidade'
import {
  baixarDadosCidadao,
} from '../servicos/api'
import { contarNotificacoesNaoLidas, limparDadosLocais } from '../servicos/consultas'
import { enderecoCompleto, formatarTelefone } from '../utils/cidadao'
import { formatarData } from '../utils/format'

function lerPermissao() {
  return typeof Notification === 'undefined' ? 'indisponivel' : Notification.permission
}

function Dado({ Icone, rotulo, valor, largo = false }) {
  return (
    <div className={`dado${largo ? ' dado--largo' : ''}`}>
      <span className="dado__icone">
        <Icone aria-hidden="true" />
      </span>
      <span className="dado__texto">
        <span className="dado__rotulo">{rotulo}</span>
        <strong className="dado__valor">{valor}</strong>
      </span>
    </div>
  )
}

function dadosDoCidadao(cidadao) {
  return {
    nome: cidadao.nome,
    email: cidadao.email,
    telefone: formatarTelefone(cidadao.telefone),
    cep: cidadao.cep,
    logradouro: cidadao.logradouro,
    numero: cidadao.numero,
    complemento: cidadao.complemento ?? '',
    bairro: cidadao.bairro,
    cidade: cidadao.cidade,
    uf: cidadao.uf,
  }
}

export default function Perfil() {
  const {
    cidadao,
    carregando: carregandoConta,
    erro: erroConta,
    atualizar,
    sair,
    excluir,
  } = useCidadao()
  const { standalone, ios, suportaNotificacao } = usePwaInstall()
  const [permissao, setPermissao] = useState(lerPermissao)
  const [mensagem, setMensagem] = useState('')
  const [mensagemConta, setMensagemConta] = useState('')
  const [preferencias, setPreferencias] = useState(lerPreferenciasAcessibilidade)
  const [naoLidas, setNaoLidas] = useState(contarNotificacoesNaoLidas)
  const [editando, setEditando] = useState(false)
  const [errosEdicao, setErrosEdicao] = useState({})
  const [erroEdicao, setErroEdicao] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [senhaExclusao, setSenhaExclusao] = useState('')
  const [erroExclusao, setErroExclusao] = useState(null)
  const [processandoExclusao, setProcessandoExclusao] = useState(false)

  useEffect(() => {
    const atualizarNaoLidas = () => setNaoLidas(contarNotificacoesNaoLidas())
    window.addEventListener('prefeitura:notificacoes', atualizarNaoLidas)
    window.addEventListener('prefeitura:fila', atualizarNaoLidas)
    return () => {
      window.removeEventListener('prefeitura:notificacoes', atualizarNaoLidas)
      window.removeEventListener('prefeitura:fila', atualizarNaoLidas)
    }
  }, [])

  const podeAtivar = suportaNotificacao && permissao !== 'granted' && permissao !== 'denied'

  async function ativarNotificacoes() {
    if (!podeAtivar) return
    try {
      const resposta = await Notification.requestPermission()
      setPermissao(resposta)
      setMensagem(resposta === 'granted' ? 'Permissão concedida.' : 'Permissão não concedida.')
    } catch {
      setMensagem('Não foi possível pedir permissão neste navegador.')
    }
  }

  function alterarPreferencias(parcial) {
    const novas = salvarPreferenciasAcessibilidade({ ...preferencias, ...parcial })
    setPreferencias(novas)
  }

  function limpar() {
    if (!window.confirm('Remover protocolos, rascunhos e fila salvos neste dispositivo?')) return
    limparDadosLocais()
    setMensagem('Dados locais removidos.')
    setNaoLidas(0)
    window.dispatchEvent(new CustomEvent('prefeitura:notificacoes'))
    window.dispatchEvent(new CustomEvent('prefeitura:fila'))
  }

  async function salvarPerfil(dados) {
    setSalvando(true)
    setErroEdicao(null)
    setErrosEdicao({})
    try {
      await atualizar(dados)
      setEditando(false)
      setMensagemConta('Cadastro atualizado.')
    } catch (erro) {
      setErrosEdicao(erro?.campos ?? {})
      setErroEdicao(erro?.message || 'Não foi possível salvar o cadastro.')
    } finally {
      setSalvando(false)
    }
  }

  async function sairDaConta() {
    await sair()
    setEditando(false)
    setExcluindo(false)
    setMensagemConta('Você saiu da conta.')
  }

  async function exportarDados() {
    try {
      const blob = await baixarDadosCidadao()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'meus-dados-prefeitura.json'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setMensagemConta('Download dos seus dados iniciado.')
    } catch {
      setMensagemConta('Não foi possível exportar seus dados agora.')
    }
  }

  async function confirmarExclusao(evento) {
    evento.preventDefault()
    setErroExclusao(null)
    setProcessandoExclusao(true)
    try {
      await excluir({ senha: senhaExclusao })
      setExcluindo(false)
      setSenhaExclusao('')
      setMensagemConta('Conta excluída e dados pessoais removidos.')
    } catch (erro) {
      setErroExclusao(erro?.message || 'Não foi possível excluir a conta.')
    } finally {
      setProcessandoExclusao(false)
    }
  }

  const rotuloNotificacao =
    permissao === 'granted'
      ? 'Ativas'
      : permissao === 'denied'
        ? 'Bloqueadas'
        : !suportaNotificacao
          ? 'Indisponível'
          : 'Disponíveis'

  return (
    <div className="pagina pagina--estreita">
      <header className="perfil-topo">
        <span className="avatar">
          <UserRound aria-hidden="true" />
        </span>
        <div className="perfil-topo__texto">
          <p className="perfil-topo__sobre">Perfil</p>
          <h1>{cidadao?.nome ?? 'Seu perfil'}</h1>
        </div>
        {cidadao && (
          <button type="button" className="botao botao--secundario botao--pequeno" onClick={sairDaConta}>
            <LogOut aria-hidden="true" />
            Sair
          </button>
        )}
      </header>

      {carregandoConta ? (
        <SkeletonBloco linhas={5} />
      ) : (
        <div className="pilha">
          {mensagemConta && (
            <p className="alerta alerta--sucesso" role="status">{mensagemConta}</p>
          )}

          {erroConta && !cidadao && (
            <p className="alerta alerta--info">
              Não foi possível consultar sua conta agora. Você ainda pode usar o app; tente novamente
              ao recuperar a conexão.
            </p>
          )}

          {!cidadao ? (
            <PerfilAcesso />
          ) : editando ? (
            <section className="cartao" aria-labelledby="titulo-editar">
              <div className="cartao__cabecalho">
                <h2 id="titulo-editar">Editar cadastro</h2>
              </div>
              <PerfilFormulario
                modo="edicao"
                inicial={dadosDoCidadao(cidadao)}
                errosServidor={errosEdicao}
                erroGeral={erroEdicao}
                enviando={salvando}
                aoEnviar={salvarPerfil}
                aoCancelar={() => {
                  setEditando(false)
                  setErroEdicao(null)
                  setErrosEdicao({})
                }}
              />
            </section>
          ) : (
            <section className="cartao" aria-labelledby="titulo-dados">
              <div className="cartao__cabecalho">
                <h2 id="titulo-dados">Dados do cidadão</h2>
                <button
                  type="button"
                  className="botao botao--secundario botao--pequeno"
                  onClick={() => {
                    setEditando(true)
                    setMensagemConta('')
                  }}
                >
                  <Pencil aria-hidden="true" />
                  Editar
                </button>
              </div>
              <div className="grade-dados">
                <Dado Icone={Mail} rotulo="E-mail" valor={cidadao.email} largo />
                <Dado Icone={Phone} rotulo="Telefone" valor={formatarTelefone(cidadao.telefone)} />
                <Dado Icone={MapPin} rotulo="Endereço" valor={enderecoCompleto(cidadao)} largo />
                <Dado Icone={CalendarDays} rotulo="Desde" valor={formatarData(cidadao.criadoEm)} />
                <Dado Icone={Fingerprint} rotulo="Conta" valor="Cidadão" />
              </div>
              <div className="perfil-dados__acoes">
                <button type="button" className="botao botao--secundario botao--pequeno" onClick={exportarDados}>
                  <Download aria-hidden="true" />
                  Baixar meus dados
                </button>
                <button
                  type="button"
                  className="botao botao--secundario botao--pequeno"
                  onClick={() => setExcluindo(true)}
                >
                  <Trash2 aria-hidden="true" />
                  Excluir conta
                </button>
              </div>

              {excluindo && (
                <form className="perfil-exclusao" onSubmit={confirmarExclusao}>
                  <p className="alerta alerta--erro">
                    A exclusão apaga seu nome, e-mail, telefone e endereço e encerra todas as sessões.
                    Solicitações já registradas permanecem no histórico do atendimento público.
                  </p>
                  <div className="campo">
                    <label htmlFor="excluir-senha">Confirme sua senha</label>
                    <input
                      id="excluir-senha"
                      type="password"
                      autoComplete="current-password"
                      value={senhaExclusao}
                      onChange={(evento) => setSenhaExclusao(evento.target.value)}
                      required
                    />
                  </div>
                  {erroExclusao && <p className="campo__erro" role="alert">{erroExclusao}</p>}
                  <div className="formulario__acoes">
                    <button
                      type="button"
                      className="botao botao--secundario"
                      onClick={() => {
                        setExcluindo(false)
                        setErroExclusao(null)
                        setSenhaExclusao('')
                      }}
                      disabled={processandoExclusao}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="botao botao--perigo" disabled={processandoExclusao}>
                      {processandoExclusao ? 'Excluindo...' : 'Excluir definitivamente'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          <section className="cartao cartao--acessibilidade" aria-labelledby="titulo-acessibilidade">
            <div className="preferencia__topo">
              <span className="icone-tile tom-roxo">
                <SlidersHorizontal aria-hidden="true" />
              </span>
              <div className="preferencia__texto">
                <h2 id="titulo-acessibilidade">Acessibilidade</h2>
                <p>Ajuste a leitura para o seu jeito.</p>
              </div>
            </div>

            <div className="acessibilidade__grupo">
              <span className="acessibilidade__rotulo">
                <ZoomIn aria-hidden="true" />
                Tamanho do texto
              </span>
              <div className="segmento" role="group" aria-label="Tamanho do texto">
                <button
                  type="button"
                  className={preferencias.fonte === 'normal' ? 'is-ativo' : undefined}
                  aria-pressed={preferencias.fonte === 'normal'}
                  onClick={() => alterarPreferencias({ fonte: 'normal' })}
                >
                  Padrão
                </button>
                <button
                  type="button"
                  className={preferencias.fonte === 'grande' ? 'is-ativo' : undefined}
                  aria-pressed={preferencias.fonte === 'grande'}
                  onClick={() => alterarPreferencias({ fonte: 'grande' })}
                >
                  Ampliado
                </button>
              </div>
            </div>

            <label className="alternador">
              <input
                type="checkbox"
                checked={preferencias.contraste}
                onChange={(evento) => alterarPreferencias({ contraste: evento.target.checked })}
              />
              <span className="alternador__trilho" aria-hidden="true">
                <span />
              </span>
              <span className="alternador__texto">
                <strong>
                  <Contrast aria-hidden="true" />
                  Alto contraste
                </strong>
                <small>Reforça bordas, textos e áreas de foco.</small>
              </span>
            </label>

            <p className="texto-suave acessibilidade__nota">
              As preferências ficam salvas neste aparelho e valem para todas as telas.
            </p>
          </section>

          <section className="cartao cartao--preferencia" aria-labelledby="titulo-notificacoes">
            <div className="preferencia__topo">
              <span className="icone-tile tom-azul">
                <Bell aria-hidden="true" />
              </span>
              <div className="preferencia__texto">
                <h2 id="titulo-notificacoes">Notificações</h2>
                <p>Mudanças de status dos seus protocolos.</p>
              </div>
              <Badge tom={permissao === 'granted' ? 'sucesso' : 'neutro'}>{rotuloNotificacao}</Badge>
            </div>

            {!standalone && (
              <p className="alerta alerta--info">
                <Smartphone aria-hidden="true" />
                <span>
                  No celular, instale o app para receber avisos do sistema. No navegador, os avisos
                  aparecem enquanto o app estiver aberto.
                </span>
              </p>
            )}

            {!suportaNotificacao && (
              <p className="alerta alerta--info">
                <Smartphone aria-hidden="true" />
                <span>Indisponível neste navegador. Os avisos continuam em “Meus pedidos”.</span>
              </p>
            )}

            {permissao === 'denied' && (
              <p className="alerta alerta--erro">
                Permissão bloqueada. Libere nas configurações do site.
              </p>
            )}

            <div className="preferencia__acoes">
              {podeAtivar && (
                <button type="button" className="botao botao--primario" onClick={ativarNotificacoes}>
                  Ativar notificações
                </button>
              )}
              <Link className="botao botao--secundario" to="/acompanhar">
                <ClipboardList aria-hidden="true" />
                Meus pedidos
                {naoLidas > 0 && <span className="contador-aviso">{naoLidas}</span>}
              </Link>
            </div>

            {mensagem && (
              <p className="texto-suave" role="status">
                {mensagem}
              </p>
            )}
          </section>

          <section className="cartao cartao--linha" aria-labelledby="titulo-privacidade">
            <span className="icone-tile tom-verde">
              <ShieldCheck aria-hidden="true" />
            </span>
            <div className="cartao__corpo">
              <h2 id="titulo-privacidade">Privacidade e LGPD</h2>
              <p>Veja como tratamos seus dados e exerça seus direitos.</p>
            </div>
            <Link className="botao botao--secundario botao--pequeno" to="/privacidade">
              Aviso
            </Link>
          </section>

          <section className="cartao cartao--linha" aria-labelledby="titulo-aparelho">
            <span className="icone-tile tom-verde">
              <Trash2 aria-hidden="true" />
            </span>
            <div className="cartao__corpo">
              <h2 id="titulo-aparelho">Dados no aparelho</h2>
              <p>Protocolos, rascunhos e fila de envio offline.</p>
            </div>
            <button type="button" className="botao botao--secundario botao--pequeno" onClick={limpar}>
              Limpar
            </button>
          </section>

          <section className="cartao" aria-labelledby="titulo-sobre">
            <div className="cartao__cabecalho">
              <h2 id="titulo-sobre">Sobre</h2>
              <span className="secao__contagem">v0.1.0</span>
            </div>
            <ul className="lista-dados lista-dados--grade">
              <li className="lista-dados__item">
                <span className="lista-dados__texto">
                  <span className="lista-dados__rotulo">Modo</span>
                  <strong className="lista-dados__valor">
                    {import.meta.env.MODE === 'production' ? 'Produção' : 'Desenvolvimento'}
                  </strong>
                </span>
              </li>
              <li className="lista-dados__item">
                <span className="lista-dados__texto">
                  <span className="lista-dados__rotulo">Instalado</span>
                  <strong className="lista-dados__valor">{standalone ? 'Sim' : 'Navegador'}</strong>
                </span>
              </li>
              <li className="lista-dados__item">
                <span className="lista-dados__texto">
                  <span className="lista-dados__rotulo">Plataforma</span>
                  <strong className="lista-dados__valor">{ios ? 'iOS' : 'Outra'}</strong>
                </span>
              </li>
            </ul>
            <div className="sobre-links">
              <Link to="/servicos">Catálogo de serviços</Link>
              <Link to="/gestao">Área de gestão</Link>
              <Link to="/privacidade">Aviso de Privacidade</Link>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
