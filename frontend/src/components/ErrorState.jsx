import { CircleAlert, RotateCw } from 'lucide-react'

export default function ErrorState({ erro, aoTentarNovamente, titulo }) {
  const offline = erro?.offline || erro?.codigo === 'offline'

  return (
    <div className="estado-erro" role="alert">
      <span className="estado-erro__icone" aria-hidden="true">
        <CircleAlert />
      </span>
      <h2>{titulo ?? (offline ? 'Sem conexão' : 'Não foi possível carregar')}</h2>
      <p>{erro?.message ?? 'Tente novamente em instantes.'}</p>
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
