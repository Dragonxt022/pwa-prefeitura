import { MapPin } from 'lucide-react'

export default function RevisaoSolicitacao({ formulario, servico }) {
  return (
    <section className="revisao-solicitacao" aria-labelledby="titulo-revisao">
      <h2 id="titulo-revisao">Revise antes de enviar</h2>
      <p className="texto-suave">
        Confira as informações. Se precisar mudar algo, use as etapas acima ou o botão
        Voltar.
      </p>

      <dl>
        <div>
          <dt>Serviço</dt>
          <dd>{servico?.titulo ?? 'Não selecionado'}</dd>
        </div>
        <div>
          <dt>Descrição</dt>
          <dd className="revisao-solicitacao__texto">{formulario.descricao}</dd>
        </div>
        <div>
          <dt>Endereço</dt>
          <dd>
            <MapPin aria-hidden="true" />
            {formulario.endereco}
          </dd>
        </div>
        {formulario.localizacao && (
          <div>
            <dt>Localização aproximada</dt>
            <dd>
              {formulario.localizacao.latitude.toFixed(5)},{' '}
              {formulario.localizacao.longitude.toFixed(5)}
            </dd>
          </div>
        )}
        {formulario.contato && (
          <div>
            <dt>Contato</dt>
            <dd>{formulario.contato}</dd>
          </div>
        )}
        {formulario.foto && (
          <div className="revisao-solicitacao__foto">
            <dt>Foto anexada</dt>
            <dd>
              <img src={formulario.foto} alt="Prévia da foto que será enviada" />
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}
