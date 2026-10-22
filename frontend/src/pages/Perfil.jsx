import {
  Bell,
  CalendarDays,
  Fingerprint,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import ErrorState from '../components/ErrorState'
import { SkeletonBloco } from '../components/Loading'
import { Badge } from '../components/StatusBadge'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { useRecurso } from '../hooks/useRecurso'
import { obterPerfil } from '../lib/api'
import { limparDadosLocais } from '../lib/consultas'
import { formatarData } from '../lib/format'

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

  const podeAtivar = standalone && suportaNotificacao && permissao !== 'granted' && permissao !== 'denied'

  async function ativarNotificacoes() {
    if (!podeAtivar) return
    try {
      const resposta = await Notification.requestPermission()
      setPermissao(resposta)
      setMensagem(resposta === 'granted' ? 'Permissão concedida.' : 'Permissão não concedida.')
    } catch {
      setMensagem('Não foi possível pedir permissão.')
    }
  }

  function limpar() {
    if (!window.confirm('Remover protocolos e preferências salvos neste dispositivo?')) return
    limparDadosLocais()
    setMensagem('Dados locais removidos.')
  }

  const rotuloNotificacao =
    permissao === 'granted'
      ? 'Ativas'
      : permissao === 'denied'
        ? 'Bloqueadas'
        : !standalone
          ? 'Requer app'
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

          <section className="cartao cartao--preferencia" aria-labelledby="titulo-notificacoes">
            <div className="preferencia__topo">
              <span className="icone-tile tom-azul">
                <Bell aria-hidden="true" />
              </span>
              <div className="preferencia__texto">
                <h2 id="titulo-notificacoes">Notificações</h2>
                <p>Atualizações dos seus protocolos.</p>
              </div>
              <Badge tom={permissao === 'granted' ? 'sucesso' : 'neutro'}>{rotuloNotificacao}</Badge>
            </div>

            {!standalone && (
              <p className="alerta alerta--info">
                <Smartphone aria-hidden="true" />
                <span>
                  {ios
                    ? 'Adicione à Tela de Início para ativar.'
                    : 'Instale o app para ativar.'}
                </span>
              </p>
            )}

            {standalone && !suportaNotificacao && (
              <p className="alerta alerta--info">
                <Smartphone aria-hidden="true" />
                <span>Indisponível neste navegador.</span>
              </p>
            )}

            {permissao === 'denied' && (
              <p className="alerta alerta--erro">
                Permissão bloqueada. Libere nas configurações do site.
              </p>
            )}

            {podeAtivar && (
              <button type="button" className="botao botao--primario" onClick={ativarNotificacoes}>
                Ativar
              </button>
            )}

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
              <p>Protocolos recentes e preferência de notificação.</p>
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
          </section>
        </div>
      )}
    </div>
  )
}
