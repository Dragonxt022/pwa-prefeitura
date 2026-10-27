import { useSearchParams } from 'react-router-dom'
import ErrorState from '../componentes/ErrorState'
import { SkeletonBloco } from '../componentes/Loading'
import ConfirmacaoProtocolo from '../componentes/nova-solicitacao/ConfirmacaoProtocolo'
import FormularioSolicitacao from '../componentes/nova-solicitacao/FormularioSolicitacao'
import PedidoPendente from '../componentes/nova-solicitacao/PedidoPendente'
import { useNovaSolicitacao } from '../hooks/useNovaSolicitacao'

export default function NovaSolicitacao() {
  const [params] = useSearchParams()
  const tipoDaUrl = params.get('tipo') ?? ''
  const solicitacao = useNovaSolicitacao({ tipoInicial: tipoDaUrl })

  if (solicitacao.protocolo) {
    return (
      <ConfirmacaoProtocolo
        protocolo={solicitacao.protocolo}
        copiado={solicitacao.copiado}
        codigoCopiado={solicitacao.codigoCopiado}
        aoCopiar={solicitacao.copiarProtocolo}
        aoCopiarCodigo={solicitacao.copiarCodigo}
        aoNovaSolicitacao={solicitacao.novaSolicitacao}
      />
    )
  }

  if (solicitacao.pendente) {
    return (
      <PedidoPendente
        pendente={solicitacao.pendente}
        servicoSelecionado={solicitacao.servicoSelecionado}
        aoNovaSolicitacao={solicitacao.novaSolicitacao}
      />
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

      {solicitacao.erroServicos ? (
        <ErrorState erro={solicitacao.erroServicos} aoTentarNovamente={solicitacao.recarregar} />
      ) : solicitacao.carregando ? (
        <SkeletonBloco linhas={5} />
      ) : (
        <FormularioSolicitacao
          online={solicitacao.online}
          enviando={solicitacao.enviando}
          rascunhoStatus={solicitacao.rascunhoStatus}
          servicos={solicitacao.servicos}
          servicosFiltrados={solicitacao.servicosFiltrados}
          buscaServico={solicitacao.buscaServico}
          aoBuscarServico={solicitacao.definirBuscaServico}
          aoSelecionarServico={solicitacao.selecionarServico}
          formulario={solicitacao.formulario}
          erros={solicitacao.erros}
          erroGeral={solicitacao.erroGeral}
          fotoErro={solicitacao.foto.erro}
          cep={solicitacao.cep}
          foto={solicitacao.foto}
          localizacao={solicitacao.localizacao}
          semelhantes={solicitacao.semelhantes}
          consultandoSemelhantes={solicitacao.consultandoSemelhantes}
          resumoErroRef={solicitacao.resumoErroRef}
          aoAlterar={solicitacao.alterar}
          aoAlterarCep={solicitacao.alterarCep}
          aoEnviar={solicitacao.enviar}
        />
      )}
    </div>
  )
}
