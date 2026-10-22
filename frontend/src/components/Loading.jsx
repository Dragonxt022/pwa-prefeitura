import { Search } from 'lucide-react'

export function SkeletonCartoes({ quantidade = 3 }) {
  return (
    <div className="grade-servicos" aria-hidden="true">
      {Array.from({ length: quantidade }).map((_, indice) => (
        <div key={indice} className="cartao esqueleto-cartao">
          <div className="esqueleto esqueleto--circulo" />
          <div className="esqueleto esqueleto--linha-curta" />
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

export function EstadoVazioBusca({ termo }) {
  return (
    <div className="estado-vazio estado-vazio--compacto">
      <span className="estado-vazio__icone" aria-hidden="true">
        <Search />
      </span>
      <p>Nenhum serviço para “{termo}”.</p>
    </div>
  )
}
