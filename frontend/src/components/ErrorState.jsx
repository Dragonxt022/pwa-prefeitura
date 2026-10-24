import { CircleAlert, RotateCw } from 'lucide-react'
import { CODIGOS_ERRO, mensagemAmigavel, tituloDoErro } from '../lib/erros'

export default function ErrorState({ erro, aoTentarNovamente, titulo }) {
  const offline = erro?.offline || erro?.codigo === CODIGOS_ERRO.OFFLINE

  return (
    <div className="estado-erro" role="alert">
      <span className="estado-erro__icone" aria-hidden="true">
        <CircleAlert />
      </span>
      <h2>{titulo ?? tituloDoErro(erro, 'Não foi possível carregar')}</h2>
      <p>{mensagemAmigavel(erro, 'Tente novamente em instantes.')}</p>
      {offline && <p className="texto-suave">Se esta tela já abriu antes, os dados podem estar salvos.</p>}
      {aoTentarNovamente && (
        <button type="button" className="botao botao--secundario" onClick={aoTentarNovamente}>
          <RotateCw aria-hidden="true" />
          Tentar novamente
        </button>
      )}
    </div>
  )
}
