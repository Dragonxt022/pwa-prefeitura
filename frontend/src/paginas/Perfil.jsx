import {
  Bell,
  CalendarDays,
  ClipboardList,
  Contrast,
  Fingerprint,
  Mail,
  MapPin,
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
import ErrorState from '../componentes/ErrorState'
import { SkeletonBloco } from '../componentes/Loading'
import { Badge } from '../componentes/StatusBadge'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { useRecurso } from '../hooks/useRecurso'
import {
  lerPreferenciasAcessibilidade,
  salvarPreferenciasAcessibilidade,
} from '../utils/acessibilidade'
import { obterPerfil } from '../servicos/api'
import { contarNotificacoesNaoLidas, limparDadosLocais } from '../servicos/consultas'
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

export default function Perfil() {
  const { dados: perfil, carregando, erro, recarregar } = useRecurso(obterPerfil, [])
  const { standalone, ios, suportaNotificacao } = usePwaInstall()
  const [permissao, setPermissao] = useState(lerPermissao)
  const [mensagem, setMensagem] = useState('')
  const [preferencias, setPreferencias] = useState(lerPreferenciasAcessibilidade)
  const [naoLidas, setNaoLidas] = useState(contarNotificacoesNaoLidas)

  useEffect(() => {
    const atualizar = () => setNaoLidas(contarNotificacoesNaoLidas())
    window.addEventListener('prefeitura:notificacoes', atualizar)
    window.addEventListener('prefeitura:fila', atualizar)
    return () => {
      window.removeEventListener('prefeitura:notificacoes', atualizar)
      window.removeEventListener('prefeitura:fila', atualizar)
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
          <h1>{perfil?.nome ?? 'Seu perfil'}</h1>
        </div>
      </header>

      {erro ? (
        <ErrorState erro={erro} aoTentarNovamente={recarregar} />
      ) : carregando ? (
        <SkeletonBloco linhas={5} />
      ) : (
        <div className="pilha">
          <section className="cartao" aria-labelledby="titulo-dados">
            <h2 id="titulo-dados" className="sr-only">
              Dados do cidadão
            </h2>
            <div className="grade-dados">
              <Dado Icone={Fingerprint} rotulo="Documento" valor={perfil.documentoMascarado} />
              <Dado Icone={Mail} rotulo="E-mail" valor={perfil.email} largo />
              <Dado Icone={Phone} rotulo="Telefone" valor={perfil.telefone} />
              <Dado Icone={MapPin} rotulo="Bairro" valor={perfil.bairro} />
              <Dado Icone={CalendarDays} rotulo="Desde" valor={formatarData(perfil.desde)} />
            </div>
          </section>

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
              <h2 id="titulo-privacidade">Dados no aparelho</h2>
              <p>Protocolos, rascunhos e fila de envio offline.</p>
            </div>
            <button type="button" className="botao botao--secundario botao--pequeno" onClick={limpar}>
              <Trash2 aria-hidden="true" />
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
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
