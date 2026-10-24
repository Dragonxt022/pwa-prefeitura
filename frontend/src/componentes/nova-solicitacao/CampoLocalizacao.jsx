import { LoaderCircle, LocateFixed, X } from 'lucide-react'

export default function CampoLocalizacao({
  localizacao,
  localizando,
  mensagem,
  aoCapturar,
  aoRemover,
}) {
  return (
    <fieldset className="campo">
      <legend>
        Localização <span className="campo__opcional">(opcional)</span>
      </legend>
      {localizacao ? (
        <div className="localizacao-anexada">
          <span className="localizacao-anexada__icone">
            <LocateFixed aria-hidden="true" />
          </span>
          <div>
            <strong>Localização anexada</strong>
            <p>
              {localizacao.latitude.toFixed(5)}, {localizacao.longitude.toFixed(5)}
              {localizacao.precisao ? ` · precisão de ${localizacao.precisao} m` : ''}
            </p>
            <a
              href={`https://www.openstreetmap.org/?mlat=${localizacao.latitude}&mlon=${localizacao.longitude}#map=18/${localizacao.latitude}/${localizacao.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver no mapa (online)
            </a>
          </div>
          <button
            type="button"
            className="botao botao--secundario botao--icone"
            onClick={aoRemover}
            aria-label="Remover localização"
            title="Remover localização"
          >
            <X aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="botao botao--secundario localizacao-botao"
          onClick={aoCapturar}
          disabled={localizando}
        >
          {localizando ? (
            <LoaderCircle className="girando" aria-hidden="true" />
          ) : (
            <LocateFixed aria-hidden="true" />
          )}
          {localizando ? 'Obtendo localização' : 'Usar minha localização'}
        </button>
      )}
      <p className="campo__ajuda">
        A localização é opcional; o endereço continua sendo a referência principal.
      </p>
      {mensagem && (
        <p className="campo__ajuda campo__ajuda--status" role="status" aria-live="polite">
          {mensagem}
        </p>
      )}
    </fieldset>
  )
}
