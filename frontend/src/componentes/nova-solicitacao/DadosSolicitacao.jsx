import { LoaderCircle, MapPin } from 'lucide-react'
import { LIMITES } from '../../utils/solicitacao'

export default function DadosSolicitacao({ formulario, erros, cep, aoAlterar, aoAlterarCep }) {
  const { buscando, mensagem, buscar, enderecoRef } = cep

  return (
    <>
      <div className={`campo${erros.descricao ? ' campo--erro' : ''}`}>
        <label htmlFor="descricao">Descrição</label>
        <textarea
          id="descricao"
          rows={4}
          maxLength={LIMITES.descricaoMax}
          value={formulario.descricao}
          onChange={(evento) => aoAlterar('descricao', evento.target.value)}
          placeholder="Ex.: poste apagado na Rua das Palmeiras, 120."
          aria-invalid={Boolean(erros.descricao)}
          aria-describedby={
            erros.descricao ? 'erro-descricao ajuda-descricao' : 'ajuda-descricao'
          }
        />
        <div className="campo__rodape">
          <p className="campo__ajuda" id="ajuda-descricao">
            Descreva o problema sem incluir dados de terceiros.
          </p>
          <span className="campo__contador" aria-hidden="true">
            {formulario.descricao.length}/{LIMITES.descricaoMax}
          </span>
        </div>
        {erros.descricao && (
          <p className="campo__erro" id="erro-descricao">
            {erros.descricao}
          </p>
        )}
      </div>

      <div className="campo">
        <label htmlFor="cep">
          CEP <span className="campo__opcional">(opcional, para preencher o endereço)</span>
        </label>
        <div className="campo__controle campo__controle--cep">
          <input
            id="cep"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={9}
            value={formulario.cep}
            onChange={(evento) => aoAlterarCep(evento.target.value)}
            aria-describedby="ajuda-cep"
            placeholder="00000-000"
          />
          <button
            type="button"
            className="botao botao--secundario botao--pequeno"
            onClick={buscar}
            disabled={buscando}
          >
            {buscando ? <LoaderCircle className="girando" aria-hidden="true" /> : null}
            {buscando ? 'Buscando' : 'Buscar CEP'}
          </button>
        </div>
        <p className="campo__ajuda" id="ajuda-cep">
          Consulta online opcional. Se estiver offline, preencha o endereço manualmente.
        </p>
        {mensagem && (
          <p className="campo__ajuda campo__ajuda--status" role="status" aria-live="polite">
            {mensagem}
          </p>
        )}
      </div>

      <div className={`campo${erros.endereco ? ' campo--erro' : ''}`}>
        <label htmlFor="endereco">Endereço</label>
        <div className="campo__controle">
          <MapPin aria-hidden="true" />
          <input
            ref={enderecoRef}
            id="endereco"
            type="text"
            maxLength={LIMITES.enderecoMax}
            value={formulario.endereco}
            onChange={(evento) => aoAlterar('endereco', evento.target.value)}
            placeholder="Rua, número, bairro e ponto de referência"
            aria-invalid={Boolean(erros.endereco)}
            aria-describedby={erros.endereco ? 'erro-endereco ajuda-endereco' : 'ajuda-endereco'}
          />
        </div>
        <p className="campo__ajuda" id="ajuda-endereco">
          Inclua o número ou um ponto de referência para facilitar a localização.
        </p>
        {erros.endereco && (
          <p className="campo__erro" id="erro-endereco">
            {erros.endereco}
          </p>
        )}
      </div>
    </>
  )
}
