import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  LoaderCircle,
  Phone,
  Send,
  ShieldCheck,
  UploadCloud,
  WifiOff,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LIMITES } from '../../utils/solicitacao'
import CampoFoto from './CampoFoto'
import CampoLocalizacao from './CampoLocalizacao'
import ContaSolicitacao from './ContaSolicitacao'
import DadosSolicitacao from './DadosSolicitacao'
import PassosSolicitacao from './PassosSolicitacao'
import PedidosSemelhantes from './PedidosSemelhantes'
import RevisaoSolicitacao from './RevisaoSolicitacao'
import ResumoValidacao from './ResumoValidacao'
import SelecaoServico from './SelecaoServico'

const TOTAL_ETAPAS = 5

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
  cidadao,
  filaAviso,
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
  const [etapa, setEtapa] = useState(1)
  const servico = servicos.find((item) => item.id === formulario.tipo)

  const descricaoOk = formulario.descricao.trim().length >= LIMITES.descricaoMin
  const enderecoOk = formulario.endereco.trim().length >= LIMITES.enderecoMin
  const podeContinuar =
    etapa === 1
      ? Boolean(formulario.tipo)
      : etapa === 3
        ? descricaoOk && enderecoOk
        : true

  async function enviar(evento) {
    if (etapa < TOTAL_ETAPAS) {
      evento.preventDefault()
      if (podeContinuar) setEtapa((atual) => atual + 1)
      return
    }

    const resultado = await aoEnviar(evento)
    if (resultado?.ok) return
    const campos = resultado?.campos ?? {}
    if (campos.tipo) setEtapa(1)
    else if (campos.descricao || campos.endereco) setEtapa(3)
    else if (campos.contato || campos.foto) setEtapa(4)
  }

  function voltar() {
    setEtapa((atual) => Math.max(1, atual - 1))
  }

  function avancar() {
    if (podeContinuar) setEtapa((atual) => Math.min(TOTAL_ETAPAS, atual + 1))
  }

  function selecionarEtapa(numero) {
    if (numero < etapa) setEtapa(numero)
  }

  const acoesRodape = (
    <div className="formulario__acoes formulario__acoes--passos">
      {etapa === 1 ? (
        <Link className="botao botao--secundario" to="/">
          Cancelar
        </Link>
      ) : (
        <button type="button" className="botao botao--secundario" onClick={voltar}>
          <ArrowLeft aria-hidden="true" />
          Voltar
        </button>
      )}

      {etapa === 2 ? (
        <button
          key="conta"
          type="button"
          className="botao botao--primario"
          onClick={avancar}
        >
          {cidadao ? 'Continuar' : 'Pular por enquanto'}
          <ArrowRight aria-hidden="true" />
        </button>
      ) : etapa < TOTAL_ETAPAS ? (
        <button
          key="continuar"
          type="button"
          className="botao botao--primario"
          onClick={avancar}
          disabled={!podeContinuar}
        >
          Continuar
          <ArrowRight aria-hidden="true" />
        </button>
      ) : (
        <button
          key="enviar"
          type="submit"
          className="botao botao--primario"
          disabled={enviando}
        >
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
      )}
    </div>
  )

  const notaRodape = (
    <p className="formulario__nota">
      <ShieldCheck aria-hidden="true" />
      A foto e os dados são usados apenas neste atendimento.
    </p>
  )

  return (
    <div className="cartao formulario">
      <PassosSolicitacao etapa={etapa} aoSelecionar={selecionarEtapa} />

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

      {etapa === 2 ? (
        <>
          <div className="passo-conteudo">
            <p className="passo-conteudo__ajuda">
              Entrar ou criar conta é opcional. Com a conta, seu telefone e endereço são
              preenchidos automaticamente e o pedido fica disponível em “Meus pedidos”.
            </p>
            <ContaSolicitacao cidadao={cidadao} />
            {!cidadao && (
              <p className="passo-conteudo__dica" role="status">
                Prefere não entrar agora? Use “Pular por enquanto”. O protocolo e o código de
                acesso serão exibidos ao final.
              </p>
            )}
          </div>
          {acoesRodape}
          {notaRodape}
        </>
      ) : (
        <form onSubmit={enviar} noValidate>
          {etapa === 1 && (
            <div className="passo-conteudo">
              <p className="passo-conteudo__ajuda">
                Escolha o serviço que mais se parece com o problema. Você pode usar a busca se
                não encontrar de imediato.
              </p>
              <SelecaoServico
                servicos={servicos}
                servicosFiltrados={servicosFiltrados}
                buscaServico={buscaServico}
                aoBuscarServico={aoBuscarServico}
                tipoSelecionado={formulario.tipo}
                erroTipo={erros.tipo}
                aoSelecionarServico={aoSelecionarServico}
              />
              {!podeContinuar && (
                <p className="passo-conteudo__dica" role="status">
                  Selecione um serviço para continuar.
                </p>
              )}
            </div>
          )}

          {etapa === 3 && (
            <div className="passo-conteudo">
              <p className="passo-conteudo__ajuda">
                Conte onde o problema acontece. O CEP ajuda a completar o endereço, mas é
                opcional.
              </p>
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
              <PedidosSemelhantes
                semelhantes={semelhantes}
                consultando={consultandoSemelhantes}
              />
              {!podeContinuar && (
                <p className="passo-conteudo__dica" role="status">
                  Informe uma descrição com pelo menos {LIMITES.descricaoMin} caracteres e o
                  endereço com pelo menos {LIMITES.enderecoMin} caracteres.
                </p>
              )}
            </div>
          )}

          {etapa === 4 && (
            <div className="passo-conteudo">
              <p className="passo-conteudo__ajuda">
                A foto é opcional, mas ajuda a equipe. Informe um contato apenas se quiser
                receber retorno por telefone ou e-mail.
              </p>
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
                <p className="campo__ajuda">
                  {cidadao ? (
                    <>
                      Contato e endereço preenchidos a partir do seu cadastro.{' '}
                      <Link to="/perfil">Editar perfil</Link>
                    </>
                  ) : (
                    <>
                      <Link to="/perfil">Entre na sua conta</Link> para preencher contato e
                      endereço automaticamente.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {etapa === 5 && (
            <div className="passo-conteudo">
              <RevisaoSolicitacao formulario={formulario} servico={servico} />
              {filaAviso && (
                <p className="alerta alerta--info" role="status">
                  <Clock3 aria-hidden="true" />
                  <span>{filaAviso}</span>
                </p>
              )}
              {!online && (
                <p className="alerta alerta--info">
                  <WifiOff aria-hidden="true" />
                  <span>
                    Sem conexão: o pedido será guardado no aparelho e enviado quando a internet
                    voltar.
                  </span>
                </p>
              )}
            </div>
          )}

          {acoesRodape}
          {notaRodape}
        </form>
      )}
    </div>
  )
}
