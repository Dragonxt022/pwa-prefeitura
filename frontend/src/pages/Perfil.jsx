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
      setMensagem(
        resposta === 'granted'
          ? 'Permissão concedida. O envio de push será habilitado em uma fase futura do piloto.'
          : 'Permissão não concedida. Você pode reativar nas configurações do sistema.',
      )
    } catch {
      setMensagem('Não foi possível solicitar a permissão neste navegador.')
    }
  }

  function limpar() {
    if (!window.confirm('Remover protocolos e preferências salvos neste dispositivo?')) return
    limparDadosLocais()
    setMensagem('Dados locais removidos deste dispositivo.')
  }

  const rotuloNotificacao =
    permissao === 'granted'
      ? 'Ativas'
      : permissao === 'denied'
        ? 'Bloqueadas'
        : standalone
          ? 'Disponíveis'
          : 'Requer instalação'

  return (
    <div className="pagina pagina--estreita">
      <header className="cabecalho-pagina">
        <p className="cabecalho-pagina__sobre">Perfil</p>
        <h1>Seus dados e preferências</h1>
        <p className="texto-suave">Informações fictícias usadas apenas para validar o fluxo do piloto.</p>
      </header>

      {erro ? (
        <ErrorState erro={erro} aoTentarNovamente={recarregar} />
      ) : carregando ? (
        <SkeletonBloco linhas={5} />
      ) : (
        <div className="pilha">
          <section className="cartao" aria-labelledby="titulo-dados">
            <div className="cartao__cabecalho">
              <h2 id="titulo-dados">Dados do cidadão</h2>
              <Badge tom="info">Demonstração</Badge>
            </div>
            <dl className="info-lista">
              <div>
                <dt>Nome</dt>
                <dd>{perfil.nome}</dd>
              </div>
              <div>
                <dt>Documento</dt>
                <dd>{perfil.documentoMascarado}</dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>{perfil.email}</dd>
              </div>
              <div>
                <dt>Telefone</dt>
                <dd>{perfil.telefone}</dd>
              </div>
              <div>
                <dt>Bairro</dt>
                <dd>{perfil.bairro}</dd>
              </div>
              <div>
                <dt>Cadastro desde</dt>
                <dd>{formatarData(perfil.desde)}</dd>
              </div>
            </dl>
            <p className="texto-suave">
              Edição de dados e autenticação (gov.br) estão fora do escopo deste piloto.
            </p>
          </section>

          <section className="cartao" aria-labelledby="titulo-notificacoes">
            <div className="cartao__cabecalho">
              <h2 id="titulo-notificacoes">Notificações</h2>
              <Badge tom={permissao === 'granted' ? 'sucesso' : 'neutro'}>{rotuloNotificacao}</Badge>
            </div>

            <p>
              Receba atualizações quando o status de uma solicitação mudar. O envio real de push
              ainda não faz parte deste piloto: aqui registramos apenas a permissão do dispositivo.
            </p>

            {!standalone && (
              <p className="alerta alerta--info">
                {ios
                  ? 'No iPhone, as notificações só funcionam depois de adicionar o app à Tela de Início e abri-lo pelo ícone.'
                  : 'Instale o app (ícone de instalação na barra de endereço) para habilitar notificações.'}
              </p>
            )}

            {permissao === 'denied' && (
              <p className="alerta alerta--erro">
                A permissão foi bloqueada no navegador. Libere nas configurações do site e recarregue.
              </p>
            )}

            <button
              type="button"
              className="botao botao--primario"
              onClick={ativarNotificacoes}
              disabled={!podeAtivar}
            >
              {permissao === 'granted'
                ? 'Notificações ativas'
                : podeAtivar
                  ? 'Ativar notificações'
                  : 'Disponível após instalar'}
            </button>

            {mensagem && (
              <p className="texto-suave" role="status">
                {mensagem}
              </p>
            )}
          </section>

          <section className="cartao" aria-labelledby="titulo-privacidade">
            <h2 id="titulo-privacidade">Privacidade e dados locais</h2>
            <p>
              Este protótipo guarda apenas os últimos protocolos consultados e sua preferência de
              notificação, no armazenamento local do navegador. Nenhum dado é enviado para serviços
              de terceiros.
            </p>
            <button type="button" className="botao botao--secundario" onClick={limpar}>
              Limpar dados deste dispositivo
            </button>
          </section>

          <section className="cartao" aria-labelledby="titulo-sobre">
            <h2 id="titulo-sobre">Sobre o aplicativo</h2>
            <dl className="info-lista info-lista--compacta">
              <div>
                <dt>Versão</dt>
                <dd>0.1.0 (piloto)</dd>
              </div>
              <div>
                <dt>Modo de execução</dt>
                <dd>{import.meta.env.MODE === 'production' ? 'Build de produção' : 'Desenvolvimento'}</dd>
              </div>
              <div>
                <dt>Instalado</dt>
                <dd>{standalone ? 'Sim (modo standalone)' : 'Não (rodando no navegador)'}</dd>
              </div>
              <div>
                <dt>Plataforma</dt>
                <dd>{ios ? 'iOS' : 'Outra'}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  )
}
