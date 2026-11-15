import { Check } from 'lucide-react'

const ETAPAS = ['Serviço', 'Local', 'Detalhes', 'Revisão']

export default function PassosSolicitacao({ etapa, aoSelecionar }) {
  return (
    <nav className="passos-solicitacao" aria-label="Etapas da nova solicitação">
      <ol>
        {ETAPAS.map((rotulo, indice) => {
          const numero = indice + 1
          const concluida = numero < etapa
          const atual = numero === etapa
          return (
            <li key={rotulo}>
              <button
                type="button"
                className={`passo${concluida ? ' is-concluido' : ''}${atual ? ' is-atual' : ''}`}
                onClick={() => aoSelecionar(numero)}
                disabled={numero > etapa}
                aria-current={atual ? 'step' : undefined}
              >
                <span className="passo__numero" aria-hidden="true">
                  {concluida ? <Check /> : numero}
                </span>
                <span className="passo__rotulo">{rotulo}</span>
              </button>
            </li>
          )
        })}
      </ol>
      <p className="passos-solicitacao__contador" aria-live="polite">
        Etapa {etapa} de {ETAPAS.length}
      </p>
    </nav>
  )
}
