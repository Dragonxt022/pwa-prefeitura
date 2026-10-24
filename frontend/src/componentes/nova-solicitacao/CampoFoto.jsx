import { Camera, Check, ImagePlus, Trash2 } from 'lucide-react'

export default function CampoFoto({
  foto,
  processando,
  mensagem,
  inputRef,
  aoEscolher,
  aoRemover,
}) {
  return (
    <fieldset className="campo">
      <legend>
        Foto <span className="campo__opcional">(opcional)</span>
      </legend>
      {foto ? (
        <div className="foto-anexada">
          <img src={foto} alt="Prévia da foto anexada ao pedido" />
          <div className="foto-anexada__acoes">
            <span className="foto-anexada__ok">
              <ImagePlus aria-hidden="true" />
              Foto anexada
            </span>
            <button
              type="button"
              className="botao botao--secundario botao--pequeno"
              onClick={aoRemover}
            >
              <Trash2 aria-hidden="true" />
              Remover
            </button>
          </div>
        </div>
      ) : (
        <label className="foto-input" htmlFor="foto">
          <Camera aria-hidden="true" />
          <span>{processando ? 'Preparando foto…' : 'Escolher ou tirar foto'}</span>
          <span className="foto-input__ajuda">JPEG, PNG ou WebP · até 8 MB</span>
          <input
            ref={inputRef}
            id="foto"
            type="file"
            accept="image/*"
            onChange={aoEscolher}
            disabled={processando}
            aria-describedby="ajuda-foto"
          />
        </label>
      )}
      <p className="campo__ajuda" id="ajuda-foto">
        A foto ajuda a equipe a localizar o problema. Ela é reduzida e tem os metadados removidos
        antes do envio.
      </p>
      {mensagem && (
        <p className="campo__ajuda campo__ajuda--status" role="status" aria-live="polite">
          <Check aria-hidden="true" />
          {mensagem}
        </p>
      )}
    </fieldset>
  )
}
