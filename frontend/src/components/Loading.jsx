export function SkeletonCartoes({ quantidade = 3 }) {
  return (
    <div className="grade" aria-hidden="true">
      {Array.from({ length: quantidade }).map((_, indice) => (
        <div key={indice} className="cartao esqueleto-cartao">
          <div className="esqueleto esqueleto--linha-curta" />
          <div className="esqueleto esqueleto--linha" />
          <div className="esqueleto esqueleto--linha" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonBloco({ linhas = 4 }) {
  return (
    <div className="cartao" aria-hidden="true">
      {Array.from({ length: linhas }).map((_, indice) => (
        <div
          key={indice}
          className={`esqueleto ${indice === 0 ? 'esqueleto--linha-curta' : 'esqueleto--linha'}`}
        />
      ))}
    </div>
  )
}

export default function Loading({ rotulo = 'Carregando informações' }) {
  return (
    <p className="carregando" role="status">
      <span className="spinner" aria-hidden="true" />
      {rotulo}
    </p>
  )
}
