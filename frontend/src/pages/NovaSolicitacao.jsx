import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  LoaderCircle,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import { IlustracaoSucesso } from '../components/Ilustracoes'
import { SkeletonBloco } from '../components/Loading'
import { useRecurso } from '../hooks/useRecurso'
import { criarSolicitacao, listarServicos } from '../lib/api'
import { registrarConsulta } from '../lib/consultas'
import { formatarDataHora } from '../lib/format'
import { visualServico } from '../lib/visual'

const LIMITES = { descricaoMin: 10, descricaoMax: 1200, enderecoMin: 5, enderecoMax: 200 }

const FORMULARIO_VAZIO = { tipo: '', descricao: '', endereco: '', contato: '' }

export default function NovaSolicitacao() {
  const [params] = useSearchParams()
  const tipoDaUrl = params.get('tipo') ?? ''

  const { dados: servicos, carregando, erro: erroServicos, recarregar } = useRecurso(listarServicos, [])
  const [formulario, setFormulario] = useState({ ...FORMULARIO_VAZIO, tipo: tipoDaUrl })
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [protocolo, setProtocolo] = useState(null)
  const [copiado, setCopiado] = useState(false)

  const resumoErroRef = useRef(null)

  function alterar(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
    setErros((atuais) => {
      if (!(campo in atuais)) return atuais
      const { [campo]: _removido, ...resto } = atuais
      return resto
    })
    setErroGeral(null)
  }

  function validar() {
    const proximos = {}
    const descricao = formulario.descricao.trim()
    const endereco = formulario.endereco.trim()

    if (!formulario.tipo) proximos.tipo = 'Escolha um serviço.'
    if (descricao.length < LIMITES.descricaoMin) {
      proximos.descricao = `Mínimo de ${LIMITES.descricaoMin} caracteres.`
    } else if (descricao.length > LIMITES.descricaoMax) {
      proximos.descricao = `Máximo de ${LIMITES.descricaoMax} caracteres.`
    }
    if (endereco.length < LIMITES.enderecoMin) {
      proximos.endereco = 'Informe o endereço com um ponto de referência.'
    } else if (endereco.length > LIMITES.enderecoMax) {
      proximos.endereco = `Máximo de ${LIMITES.enderecoMax} caracteres.`
    }

    setErros(proximos)
    return Object.keys(proximos).length === 0
  }

  async function aoEnviar(evento) {
    evento.preventDefault()
    setErroGeral(null)

    if (!validar()) {
      requestAnimationFrame(() => resumoErroRef.current?.focus())
      return
    }

    setEnviando(true)
    try {
      const criada = await criarSolicitacao({
        tipo: formulario.tipo,
        descricao: formulario.descricao,
        endereco: formulario.endereco,
        contato: formulario.contato,
      })
      registrarConsulta(criada.protocolo)
      setProtocolo(criada)
    } catch (erro) {
      setErroGeral(erro)
      if (erro.campos) setErros(erro.campos)
      requestAnimationFrame(() => resumoErroRef.current?.focus())
    } finally {
      setEnviando(false)
    }
  }

  async function copiarProtocolo() {
    try {
      await navigator.clipboard.writeText(protocolo.protocolo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }

  function novaSolicitacao() {
    setFormulario({ ...FORMULARIO_VAZIO })
    setProtocolo(null)
    setErros({})
    setErroGeral(null)
    setCopiado(false)
  }

  if (protocolo) {
    const servico = visualServico(protocolo.tipo)
    const IconeServico = servico.Icone

    return (
      <div className="pagina pagina--estreita">
        <div className="cartao cartao--confirmacao">
          <IlustracaoSucesso className="confirmacao__arte" />
          <span className="selo selo--sucesso">
            <Check aria-hidden="true" />
            Protocolo criado
          </span>
          <h1>Pronto!</h1>
          <p className="texto-suave">Guarde o número para acompanhar.</p>

          <div className="protocolo-caixa">
            <code>{protocolo.protocolo}</code>
            <button
              type="button"
              className="botao botao--secundario botao--icone"
              onClick={copiarProtocolo}
              aria-label={copiado ? 'Protocolo copiado' : 'Copiar protocolo'}
              title={copiado ? 'Protocolo copiado' : 'Copiar protocolo'}
            >
              {copiado ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            </button>
          </div>
          <span className="protocolo-caixa__status" role="status">
            {copiado ? 'Copiado' : ''}
          </span>

          <ul className="lista-dados">
            <li className="lista-dados__item">
              <span className={`lista-dados__icone tom-${servico.tom}`}>
                <IconeServico aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Serviço</span>
                <strong className="lista-dados__valor">{protocolo.tipoTitulo}</strong>
              </span>
            </li>
            <li className="lista-dados__item">
              <span className="lista-dados__icone tom-azul">
                <MapPin aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Endereço</span>
                <strong className="lista-dados__valor">{protocolo.endereco}</strong>
              </span>
            </li>
            <li className="lista-dados__item">
              <span className="lista-dados__icone tom-azul">
                <CalendarDays aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Registrado em</span>
                <strong className="lista-dados__valor">{formatarDataHora(protocolo.criadoEm)}</strong>
              </span>
            </li>
          </ul>

          <div className="acoes acoes--centro">
            <Link className="botao botao--primario" to={`/acompanhar?protocolo=${protocolo.protocolo}`}>
              Acompanhar
              <ArrowRight aria-hidden="true" />
            </Link>
            <button type="button" className="botao botao--secundario" onClick={novaSolicitacao}>
              Nova solicitação
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pagina pagina--estreita">
      <header className="cabecalho-pagina">
        <p className="cabecalho-pagina__sobre">Nova solicitação</p>
        <h1>O que aconteceu?</h1>
        <p className="texto-suave">Escolha o serviço e informe o local.</p>
      </header>

      {erroServicos ? (
        <ErrorState erro={erroServicos} aoTentarNovamente={recarregar} />
      ) : carregando ? (
        <SkeletonBloco linhas={5} />
      ) : (
        <form className="cartao formulario" onSubmit={aoEnviar} noValidate>
          <div ref={resumoErroRef} tabIndex={-1} className="resumo-validacao" aria-live="assertive">
            {(erroGeral || Object.values(erros).some(Boolean)) && (
              <div className="alerta alerta--erro" role="alert">
                <AlertCircle aria-hidden="true" />
                <div>
                  <strong>
                    {Object.values(erros).some(Boolean)
                      ? 'Revise os campos destacados.'
                      : 'Não foi possível enviar.'}
                  </strong>
                  {erroGeral?.message && <p>{erroGeral.message}</p>}
                  {erroGeral?.codigo === 'limite_excedido' && (
                    <p>Aguarde um minuto antes de enviar outra solicitação.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <fieldset
            className={`campo campo--servicos${erros.tipo ? ' campo--erro' : ''}`}
            aria-describedby={erros.tipo ? 'erro-tipo' : undefined}
          >
            <legend>Serviço</legend>
            <div className="escolha-servicos">
              {servicos.map((servico) => {
                const { rotulo, Icone, tom } = visualServico(servico.id)
                const selecionado = formulario.tipo === servico.id
                return (
                  <label
                    key={servico.id}
                    className={`escolha-servico tom-${tom}${selecionado ? ' is-selecionado' : ''}`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={servico.id}
                      checked={selecionado}
                      onChange={(evento) => alterar('tipo', evento.target.value)}
                      className="sr-only"
                    />
                    <span className="escolha-servico__icone">
                      <Icone aria-hidden="true" />
                    </span>
                    <span className="escolha-servico__rotulo">{rotulo}</span>
                    <span className="escolha-servico__prazo">
                      <Clock3 aria-hidden="true" />
                      {servico.prazoDias} dias
                    </span>
                  </label>
                )
              })}
            </div>
            {erros.tipo && (
              <p className="campo__erro" id="erro-tipo">
                {erros.tipo}
              </p>
            )}
          </fieldset>

          <div className={`campo${erros.descricao ? ' campo--erro' : ''}`}>
            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              rows={4}
              maxLength={LIMITES.descricaoMax}
              value={formulario.descricao}
              onChange={(evento) => alterar('descricao', evento.target.value)}
              placeholder="Ex.: poste apagado na Rua das Palmeiras, 120."
              aria-invalid={Boolean(erros.descricao)}
              aria-describedby={erros.descricao ? 'erro-descricao' : 'ajuda-descricao'}
            />
            <div className="campo__rodape">
              <p className="campo__ajuda" id="ajuda-descricao">
                Sem dados de terceiros.
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

          <div className={`campo${erros.endereco ? ' campo--erro' : ''}`}>
            <label htmlFor="endereco">Endereço</label>
            <div className="campo__controle">
              <MapPin aria-hidden="true" />
              <input
                id="endereco"
                type="text"
                maxLength={LIMITES.enderecoMax}
                value={formulario.endereco}
                onChange={(evento) => alterar('endereco', evento.target.value)}
                placeholder="Rua, número e bairro"
                aria-invalid={Boolean(erros.endereco)}
                aria-describedby={erros.endereco ? 'erro-endereco' : undefined}
              />
            </div>
            {erros.endereco && (
              <p className="campo__erro" id="erro-endereco">
                {erros.endereco}
              </p>
            )}
          </div>

          <div className="campo">
            <label htmlFor="contato">
              Contato <span className="campo__opcional">(opcional)</span>
            </label>
            <div className="campo__controle">
              <Phone aria-hidden="true" />
              <input
                id="contato"
                type="text"
                maxLength={120}
                value={formulario.contato}
                onChange={(evento) => alterar('contato', evento.target.value)}
                placeholder="Telefone ou e-mail"
              />
            </div>
          </div>

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
              ) : (
                <>
                  <Send aria-hidden="true" />
                  Enviar
                </>
              )}
            </button>
          </div>

          <p className="formulario__nota">
            <ShieldCheck aria-hidden="true" />
            Dados usados apenas neste atendimento.
          </p>
        </form>
      )}
    </div>
  )
}
