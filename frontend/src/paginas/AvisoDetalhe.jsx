import { ArrowLeft, ArrowRight, CalendarDays, LoaderCircle, Megaphone } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import ErrorState from '../componentes/ErrorState'
import { Badge } from '../componentes/StatusBadge'
import { useRecurso } from '../hooks/useRecurso'
import { obterAviso } from '../servicos/api'
import { formatarData, infoPrioridade } from '../utils/format'
import { visualAviso } from '../utils/visual'

function paragrafosDoAviso(aviso) {
  const texto = aviso.conteudo || aviso.resumo || ''
  return texto
    .split(/\n{2,}/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean)
}

export default function AvisoDetalhe() {
  const { id } = useParams()
  const { dados: aviso, carregando, erro, recarregar } = useRecurso(
    () => obterAviso(id),
    [id],
  )

  return (
    <div className="pagina pagina--aviso">
      <Link className="voltar-link" to="/">
        <ArrowLeft aria-hidden="true" />
        Início
      </Link>

      {carregando ? (
        <div className="cartao aviso-detalhe aviso-detalhe--estado" role="status">
          <LoaderCircle className="girando" aria-hidden="true" />
          <p>Carregando aviso…</p>
        </div>
      ) : erro ? (
        erro.status === 404 ? (
          <div className="cartao aviso-detalhe aviso-detalhe--estado">
            <span className="estado-vazio__icone" aria-hidden="true">
              <Megaphone />
            </span>
            <h1>Aviso não encontrado</h1>
            <p className="texto-suave">
              Este aviso pode ter sido removido ou ainda não foi publicado.
            </p>
            <Link className="botao botao--primario" to="/">
              <ArrowLeft aria-hidden="true" />
              Voltar para a Home
            </Link>
          </div>
        ) : (
          <ErrorState
            erro={erro}
            aoTentarNovamente={recarregar}
            titulo="Não foi possível carregar o aviso"
          />
        )
      ) : (
        <AvisoCompleto aviso={aviso} />
      )}
    </div>
  )
}

function AvisoCompleto({ aviso }) {
  const { Icone, tom } = visualAviso(aviso)
  const prioridade = infoPrioridade(aviso.prioridade)
  const paragrafos = paragrafosDoAviso(aviso)

  return (
    <article className={`cartao aviso-detalhe tom-${tom}`}>
      <header className="aviso-detalhe__cabecalho">
        <span className="aviso-detalhe__icone">
          <Icone aria-hidden="true" />
        </span>
        <div className="aviso-detalhe__titulo">
          <div className="aviso-detalhe__meta">
            <Badge tom={prioridade.tom}>{prioridade.rotulo}</Badge>
            <span>{aviso.categoria}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={aviso.publicadoEm}>
              <CalendarDays aria-hidden="true" />
              {formatarData(aviso.publicadoEm)}
            </time>
          </div>
          <h1>{aviso.titulo}</h1>
          <p className="aviso-detalhe__resumo">{aviso.resumo}</p>
        </div>
      </header>

      <div className="aviso-detalhe__conteudo">
        {paragrafos.map((paragrafo, indice) => (
          <p key={`${aviso.id}-paragrafo-${indice}`}>{paragrafo}</p>
        ))}
      </div>

      <footer className="aviso-detalhe__rodape">
        <Link className="botao botao--secundario botao--pequeno" to="/">
          Voltar para a Home
          <ArrowRight aria-hidden="true" />
        </Link>
      </footer>
    </article>
  )
}
