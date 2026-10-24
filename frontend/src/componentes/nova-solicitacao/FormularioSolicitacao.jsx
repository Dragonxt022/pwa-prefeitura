import { Check, LoaderCircle, Phone, Send, ShieldCheck, UploadCloud, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LIMITES } from '../../utils/solicitacao'
import CampoFoto from './CampoFoto'
import CampoLocalizacao from './CampoLocalizacao'
import DadosSolicitacao from './DadosSolicitacao'
import PedidosSemelhantes from './PedidosSemelhantes'
import ResumoValidacao from './ResumoValidacao'
import SelecaoServico from './SelecaoServico'

export default function FormularioSolicitacao({
  online,
  enviando,
  rascunhoStatus,
  servicos,
  servicosFiltrados,
  buscaServico,
  aoBuscarServico,
  aoSelecionarServico,
  formulario,
  erros,
  erroGeral,
  fotoErro,
  cep,
  foto,
  localizacao,
  semelhantes,
  consultandoSemelhantes,
  resumoErroRef,
  aoAlterar,
  aoAlterarCep,
  aoEnviar,
}) {
  return (
    <form className="cartao formulario" onSubmit={aoEnviar} noValidate>
      {rascunhoStatus && (
        <p className="rascunho-status" role="status">
          <Check aria-hidden="true" />
          {rascunhoStatus}
        </p>
      )}

      <ResumoValidacao
        erroGeral={erroGeral}
        erros={erros}
        fotoErro={fotoErro}
        resumoErroRef={resumoErroRef}
      />

      <SelecaoServico
        servicos={servicos}
        servicosFiltrados={servicosFiltrados}
        buscaServico={buscaServico}
        aoBuscarServico={aoBuscarServico}
        tipoSelecionado={formulario.tipo}
        erroTipo={erros.tipo}
        aoSelecionarServico={aoSelecionarServico}
      />

      <DadosSolicitacao
        formulario={formulario}
        erros={erros}
        cep={cep}
        aoAlterar={aoAlterar}
        aoAlterarCep={aoAlterarCep}
      />

      <CampoLocalizacao
        localizacao={formulario.localizacao}
        localizando={localizacao.localizando}
        mensagem={localizacao.mensagem}
        aoCapturar={localizacao.capturar}
        aoRemover={localizacao.remover}
      />

      <PedidosSemelhantes semelhantes={semelhantes} consultando={consultandoSemelhantes} />

      <CampoFoto
        foto={formulario.foto}
        processando={foto.processando}
        mensagem={foto.mensagem}
        inputRef={foto.inputRef}
        aoEscolher={foto.escolher}
        aoRemover={foto.remover}
      />

      <div className={`campo${erros.contato ? ' campo--erro' : ''}`}>
        <label htmlFor="contato">
          Contato <span className="campo__opcional">(opcional)</span>
        </label>
        <div className="campo__controle">
          <Phone aria-hidden="true" />
          <input
            id="contato"
            type="text"
            maxLength={LIMITES.contatoMax}
            value={formulario.contato}
            onChange={(evento) => aoAlterar('contato', evento.target.value)}
            placeholder="Telefone ou e-mail"
            aria-invalid={Boolean(erros.contato)}
            aria-describedby={erros.contato ? 'erro-contato' : undefined}
          />
        </div>
        {erros.contato && (
          <p className="campo__erro" id="erro-contato">
            {erros.contato}
          </p>
        )}
      </div>

      {!online && (
        <p className="alerta alerta--info">
          <WifiOff aria-hidden="true" />
          <span>
            Sem conexão: o pedido será guardado no aparelho e enviado quando a internet voltar.
          </span>
        </p>
      )}

      <div className="formulario__acoes">
        <Link className="botao botao--secundario" to="/">
          Cancelar
        </Link>
        <button type="submit" className="botao botao--primario" disabled={enviando}>
          {enviando ? (
            <>
              <LoaderCircle className="girando" aria-hidden="true" />
              Enviando
            </>
          ) : online ? (
            <>
              <Send aria-hidden="true" />
              Enviar solicitação
            </>
          ) : (
            <>
              <UploadCloud aria-hidden="true" />
              Salvar no aparelho
            </>
          )}
        </button>
      </div>

      <p className="formulario__nota">
        <ShieldCheck aria-hidden="true" />
        A foto e os dados são usados apenas neste atendimento.
      </p>
    </form>
  )
}
