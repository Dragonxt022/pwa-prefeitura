import { Link } from 'react-router-dom'

export default function NaoEncontrada() {
  return (
    <div className="pagina pagina--estreita">
      <div className="cartao estado-vazio">
        <p className="selo">Erro 404</p>
        <h1>Página não encontrada</h1>
        <p>O endereço acessado não existe neste aplicativo.</p>
        <Link className="botao botao--primario" to="/">
          Voltar para o início
        </Link>
      </div>
    </div>
  )
}
