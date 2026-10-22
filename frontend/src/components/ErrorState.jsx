import { IconeAlerta } from './Icones'

export default function ErrorState({ erro, aoTentarNovamente, titulo }) {
  const offline = erro?.offline || erro?.codigo === 'offline'

  return (
    <div className="estado-erro" role="alert">
      <IconeAlerta className="estado-erro__icone" />
      <h2>{titulo ?? (offline ? 'Sem conexão' : 'Não foi possível carregar')}</h2>
      <p>{erro?.message ?? 'Tente novamente em instantes.'}</p>
      {offline && (
        <p className="texto-suave">
          Se esta tela já foi aberta antes, os dados podem estar no cache do aplicativo.
        </p>
      )}
      {aoTentarNovamente && (
        <button type="button" className="botao botao--secundario" onClick={aoTentarNovamente}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}
