import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import { SkeletonBloco } from '../components/Loading'
import { useRecurso } from '../hooks/useRecurso'
import { criarSolicitacao, listarServicos } from '../lib/api'
import { formatarDataHora } from '../lib/format'
import { registrarConsulta } from '../lib/consultas'

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

  const servicoSelecionado = servicos?.find((servico) => servico.id === formulario.tipo)

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

    if (!formulario.tipo) proximos.tipo = 'Selecione o tipo de solicitação.'
    if (descricao.length < LIMITES.descricaoMin) {
      proximos.descricao = `Descreva o problema com pelo menos ${LIMITES.descricaoMin} caracteres.`
    } else if (descricao.length > LIMITES.descricaoMax) {
      proximos.descricao = `A descrição deve ter no máximo ${LIMITES.descricaoMax} caracteres.`
    }
    if (endereco.length < LIMITES.enderecoMin) {
      proximos.endereco = 'Informe o endereço com um ponto de referência.'
    } else if (endereco.length > LIMITES.enderecoMax) {
      proximos.endereco = `O endereço deve ter no máximo ${LIMITES.enderecoMax} caracteres.`
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
    return (
      <div className="pagina pagina--estreita">
        <div className="cartao cartao--confirmacao">
          <p className="selo selo--sucesso">Solicitação registrada</p>
          <h1>Guarde o seu protocolo</h1>
          <p>
            Use este número para acompanhar o andamento. Ele também foi salvo neste dispositivo.
          </p>

          <div className="protocolo-caixa">
            <code>{protocolo.protocolo}</code>
            <button type="button" className="botao botao--secundario botao--pequeno" onClick={copiarProtocolo}>
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          <dl className="resumo-dados">
            <div>
              <dt>Serviço</dt>
              <dd>{protocolo.tipoTitulo}</dd>
            </div>
            <div>
              <dt>Endereço</dt>
              <dd>{protocolo.endereco}</dd>
            </div>
            <div>
              <dt>Registrado em</dt>
              <dd>{formatarDataHora(protocolo.criadoEm)}</dd>
            </div>
          </dl>

          <div className="acoes">
            <Link className="botao botao--primario" to={`/acompanhar?protocolo=${protocolo.protocolo}`}>
              Acompanhar agora
            </Link>
            <button type="button" className="botao botao--secundario" onClick={novaSolicitacao}>
              Abrir outra solicitação
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
        <h1>Descreva o problema</h1>
        <p className="texto-suave">
          Quanto mais detalhes, mais rápido a equipe consegue localizar e resolver.
        </p>
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
                <strong>
                  {Object.values(erros).some(Boolean)
                    ? 'Revise os campos destacados.'
                    : 'Não foi possível enviar a solicitação.'}
                </strong>
                {erroGeral?.message && <p>{erroGeral.message}</p>}
                {erroGeral?.codigo === 'limite_excedido' && (
                  <p>Aguarde um minuto antes de enviar outra solicitação.</p>
                )}
              </div>
            )}
          </div>

          <div className={`campo${erros.tipo ? ' campo--erro' : ''}`}>
            <label htmlFor="tipo">Tipo de solicitação</label>
            <select
              id="tipo"
              value={formulario.tipo}
              onChange={(evento) => alterar('tipo', evento.target.value)}
              aria-invalid={Boolean(erros.tipo)}
              aria-describedby={erros.tipo ? 'erro-tipo' : undefined}
            >
              <option value="">Selecione uma opção</option>
              {servicos.map((servico) => (
                <option key={servico.id} value={servico.id}>
                  {servico.titulo}
                </option>
              ))}
            </select>
            {servicoSelecionado && (
              <p className="campo__ajuda">
                {servicoSelecionado.descricao} Prazo estimado: {servicoSelecionado.prazoDias} dias.
              </p>
            )}
            {erros.tipo && <p className="campo__erro" id="erro-tipo">{erros.tipo}</p>}
          </div>

          <div className={`campo${erros.descricao ? ' campo--erro' : ''}`}>
            <label htmlFor="descricao">Descrição do problema</label>
            <textarea
              id="descricao"
              rows={5}
              maxLength={LIMITES.descricaoMax}
              value={formulario.descricao}
              onChange={(evento) => alterar('descricao', evento.target.value)}
              placeholder="Ex.: poste apagado em frente ao número 120, desde a noite de terça-feira."
              aria-invalid={Boolean(erros.descricao)}
              aria-describedby={erros.descricao ? 'erro-descricao' : 'ajuda-descricao'}
            />
            <div className="campo__rodape">
              <p className="campo__ajuda" id="ajuda-descricao">
                Não inclua dados pessoais de terceiros.
              </p>
              <span className="campo__contador" aria-hidden="true">
                {formulario.descricao.length}/{LIMITES.descricaoMax}
              </span>
            </div>
            {erros.descricao && <p className="campo__erro" id="erro-descricao">{erros.descricao}</p>}
          </div>

          <div className={`campo${erros.endereco ? ' campo--erro' : ''}`}>
            <label htmlFor="endereco">Endereço</label>
            <input
              id="endereco"
              type="text"
              maxLength={LIMITES.enderecoMax}
              value={formulario.endereco}
              onChange={(evento) => alterar('endereco', evento.target.value)}
              placeholder="Rua, número e bairro (ou ponto de referência)"
              aria-invalid={Boolean(erros.endereco)}
              aria-describedby={erros.endereco ? 'erro-endereco' : undefined}
            />
            {erros.endereco && <p className="campo__erro" id="erro-endereco">{erros.endereco}</p>}
          </div>

          <div className="campo">
            <label htmlFor="contato">
              Contato para retorno <span className="campo__opcional">(opcional)</span>
            </label>
            <input
              id="contato"
              type="text"
              maxLength={120}
              value={formulario.contato}
              onChange={(evento) => alterar('contato', evento.target.value)}
              placeholder="Telefone ou e-mail"
            />
            <p className="campo__ajuda">
              Usado apenas se a equipe precisar de mais informações sobre o local.
            </p>
          </div>

          <div className="formulario__acoes">
            <Link className="botao botao--secundario" to="/">
              Cancelar
            </Link>
            <button type="submit" className="botao botao--primario" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar solicitação'}
            </button>
          </div>

          <p className="texto-suave formulario__nota">
            Ao enviar, você concorda com o uso destes dados apenas para atendimento desta solicitação
            (LGPD, art. 7º, III).
          </p>
        </form>
      )}
    </div>
  )
}
