import { Check, LoaderCircle, Star } from 'lucide-react'
import { useState } from 'react'
import { avaliarSolicitacao } from '../servicos/api'

function Estrelas({ nota, rotulo = true }) {
  return (
    <span className="avaliacao__resumo" aria-label={rotulo ? `Nota ${nota} de 5` : undefined}>
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

export default function Avaliacao({ protocolo, codigoAcesso, avaliacao, aoAvaliar }) {
  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  if (avaliacao?.nota) {
    return (
      <section className="cartao avaliacao" aria-labelledby="titulo-avaliacao">
        <div className="avaliacao__cabecalho">
          <div>
            <h2 id="titulo-avaliacao">Avaliação do atendimento</h2>
            <p>Obrigado por avaliar este serviço.</p>
          </div>
          <span className="selo selo--sucesso">
            <Check aria-hidden="true" />
            Avaliado
          </span>
        </div>
        <Estrelas nota={avaliacao.nota} />
        {avaliacao.comentario && <p className="avaliacao__comentario">“{avaliacao.comentario}”</p>}
      </section>
    )
  }

  async function aoEnviar(evento) {
    evento.preventDefault()
    if (!nota) {
      setErro('Escolha uma nota de 1 a 5.')
      return
    }
    setEnviando(true)
    setErro('')
    try {
      const atualizada = await avaliarSolicitacao(
        protocolo,
        { nota, comentario },
        codigoAcesso,
      )
      setSucesso(true)
      aoAvaliar?.(atualizada)
    } catch (falha) {
      setErro(falha?.message ?? 'Não foi possível enviar a avaliação.')
    } finally {
      setEnviando(false)
    }
  }

  if (sucesso) {
    return (
      <section className="cartao avaliacao" aria-live="polite">
        <span className="selo selo--sucesso">
          <Check aria-hidden="true" />
          Avaliação recebida
        </span>
        <h2>Obrigado pela contribuição</h2>
        <p>Sua opinião ajuda a melhorar o atendimento.</p>
        <Estrelas nota={nota} />
      </section>
    )
  }

  return (
    <form className="cartao avaliacao" onSubmit={aoEnviar}>
      <div className="avaliacao__cabecalho">
        <div>
          <h2>Como foi o atendimento?</h2>
          <p>Sua avaliação ajuda a prefeitura a melhorar.</p>
        </div>
      </div>

      <fieldset className="avaliacao__campo">
        <legend className="sr-only">Nota de 1 a 5</legend>
        <div className="avaliacao__opcoes">
          {[1, 2, 3, 4, 5].map((valor) => (
            <label
              key={valor}
              className={`avaliacao__estrela${nota >= valor ? ' is-ativa' : ''}`}
              title={`${valor} de 5`}
            >
              <input
                type="radio"
                name={`nota-${protocolo}`}
                value={valor}
                checked={nota === valor}
                onChange={() => {
                  setNota(valor)
                  setErro('')
                }}
                className="sr-only"
              />
              <Star aria-hidden="true" fill={nota >= valor ? 'currentColor' : 'none'} />
              <span className="sr-only">{valor} de 5 estrelas</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="avaliacao__campo">
        <label htmlFor={`comentario-${protocolo}`}>
          Comentário <span className="campo__opcional">(opcional)</span>
        </label>
        <textarea
          id={`comentario-${protocolo}`}
          rows={3}
          maxLength={500}
          value={comentario}
          onChange={(evento) => setComentario(evento.target.value)}
          placeholder="O que funcionou bem ou o que pode melhorar?"
        />
      </div>

      {erro && (
        <p className="campo__erro" role="alert">
          {erro}
        </p>
      )}

      <button type="submit" className="botao botao--primario" disabled={enviando}>
        {enviando ? <LoaderCircle className="girando" aria-hidden="true" /> : <Star aria-hidden="true" />}
        {enviando ? 'Enviando avaliação' : 'Enviar avaliação'}
      </button>
    </form>
  )
}
