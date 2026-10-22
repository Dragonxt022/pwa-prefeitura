import { Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { IlustracaoBusca } from '../components/Ilustracoes'

export default function NaoEncontrada() {
  return (
    <div className="pagina pagina--estreita">
      <div className="cartao estado-vazio">
        <IlustracaoBusca className="estado-vazio__arte" />
        <p className="selo">Erro 404</p>
        <h1>Página não encontrada</h1>
        <p>O endereço acessado não existe.</p>
        <Link className="botao botao--primario" to="/">
          <Home aria-hidden="true" />
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
