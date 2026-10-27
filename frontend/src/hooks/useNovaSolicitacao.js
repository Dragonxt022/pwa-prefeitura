import { useEffect, useMemo, useRef, useState } from 'react'
import { gerarCodigoAcesso } from '../../../shared/codigo-acesso.js'
import { criarSolicitacao, listarServicos } from '../servicos/api'
import { listarPedidos, registrarConsulta, registrarPedido } from '../servicos/consultas'
import { enfileirar, listarFila, ultimoEnvio } from '../servicos/fila'
import { carregarRascunho, limparRascunho, salvarRascunho } from '../servicos/rascunho'
import {
  FORMULARIO_VAZIO,
  LIMITES,
  formatarCep,
  normalizar,
  novoClientId,
  temConteudo,
  validarFormulario,
} from '../utils/solicitacao'
import { useCep } from './useCep'
import { useFotoSolicitacao } from './useFotoSolicitacao'
import { useLocalizacaoSolicitacao } from './useLocalizacaoSolicitacao'
import { useOnlineStatus } from './useOnlineStatus'
import { useRecurso } from './useRecurso'
import { useSolicitacaoSemelhante } from './useSolicitacaoSemelhante'

export function useNovaSolicitacao({ tipoInicial = '' } = {}) {
  const online = useOnlineStatus()
  const rascunhoInicial = useMemo(() => carregarRascunho(), [])
  const { dados: servicos, carregando, erro: erroServicos, recarregar } = useRecurso(listarServicos, [])

  const [formulario, setFormulario] = useState(() => {
    const salvo = rascunhoInicial?.formulario ?? {}
    return {
      ...FORMULARIO_VAZIO,
      ...salvo,
      tipo: tipoInicial || salvo.tipo || '',
    }
  })
  const [buscaServico, setBuscaServico] = useState('')
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [protocolo, setProtocolo] = useState(null)
  const [pendente, setPendente] = useState(null)
  const [pendenteEm, setPendenteEm] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [codigoCopiado, setCodigoCopiado] = useState(false)
  const [rascunhoStatus, setRascunhoStatus] = useState(
    rascunhoInicial?.formulario && temConteudo(rascunhoInicial.formulario)
      ? 'Rascunho restaurado. Continue de onde parou.'
      : '',
  )

  const resumoErroRef = useRef(null)
  const formularioInicialRef = useRef(formulario)

  const cep = useCep({
    cep: formulario.cep,
    endereco: formulario.endereco,
    online,
    limiteEndereco: LIMITES.enderecoMax,
    aoAlterarEndereco: (valor) => alterar('endereco', valor),
  })
  const foto = useFotoSolicitacao({
    aoAlterarFoto: (valor) => alterar('foto', valor),
  })
  const localizacao = useLocalizacaoSolicitacao({
    aoAlterarLocalizacao: (valor) => alterar('localizacao', valor),
  })
  const semelhanca = useSolicitacaoSemelhante({
    tipo: formulario.tipo,
    endereco: formulario.endereco,
    localizacao: formulario.localizacao,
  })

  const servicosFiltrados = useMemo(() => {
    const termo = normalizar(buscaServico).trim()
    if (!termo) return servicos ?? []
    return (servicos ?? []).filter((servico) =>
      normalizar(`${servico.titulo} ${servico.descricao} ${servico.categoria}`).includes(termo),
    )
  }, [buscaServico, servicos])

  const servicoSelecionado = useMemo(
    () => (servicos ?? []).find((servico) => servico.id === formulario.tipo),
    [formulario.tipo, servicos],
  )

  useEffect(() => {
    // Um rascunho recém-restaurado já está salvo; preserve o aviso até haver edição.
    if (formulario === formularioInicialRef.current) return undefined
    if (protocolo || pendente || !temConteudo(formulario)) return undefined

    const timer = window.setTimeout(() => {
      const salvo = salvarRascunho(formulario)
      setRascunhoStatus(salvo ? 'Rascunho salvo neste aparelho.' : 'Não foi possível salvar o rascunho.')
    }, 700)

    return () => window.clearTimeout(timer)
  }, [formulario, protocolo, pendente])

  useEffect(() => {
    if (!pendente || !pendenteEm) return undefined

    const verificarEnvio = () => {
      const aindaNaFila = listarFila().some((item) => item.clientId === pendente.clientId)
      if (aindaNaFila) return

      const envio = ultimoEnvio()
      if (!envio?.protocolo || !envio.em || envio.em < pendenteEm) return
      const pedido = listarPedidos().find((item) => item.protocolo === envio.protocolo)
      if (!pedido) return

      setPendente(null)
      setPendenteEm(null)
      setProtocolo(pedido)
    }

    window.addEventListener('prefeitura:fila', verificarEnvio)
    return () => window.removeEventListener('prefeitura:fila', verificarEnvio)
  }, [pendente, pendenteEm])

  function alterar(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
    setErros((atuais) => {
      if (!(campo in atuais)) return atuais
      const { [campo]: _removido, ...resto } = atuais
      return resto
    })
    setErroGeral(null)
  }

  function alterarCep(valor) {
    alterar('cep', formatarCep(valor))
    cep.limpar()
  }

  function selecionarServico(id) {
    alterar('tipo', id)
    setBuscaServico('')
  }

  function validar() {
    const proximos = validarFormulario(formulario)
    setErros(proximos)
    return Object.keys(proximos).length === 0
  }

  function salvarNaFila(payload) {
    enfileirar(payload)
    const persistiu = listarFila().some((item) => item.clientId === payload.clientId)
    if (!persistiu) {
      setErroGeral(
        new Error(
          'Não há espaço no aparelho para guardar este pedido. Tente sem a foto ou libere armazenamento.',
        ),
      )
      return false
    }

    limparRascunho()
    setRascunhoStatus('')
    setPendente(payload)
    setPendenteEm(new Date().toISOString())
    return true
  }

  function concluir(criada, codigoAcesso) {
    registrarConsulta(criada.protocolo)
    registrarPedido(criada, codigoAcesso)
    limparRascunho()
    setRascunhoStatus('')
    setProtocolo({ ...criada, codigoAcesso })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErroGeral(null)
    foto.limparErro()

    if (!validar()) {
      requestAnimationFrame(() => resumoErroRef.current?.focus())
      return
    }

    const payload = {
      tipo: formulario.tipo,
      descricao: formulario.descricao,
      endereco: formulario.endereco,
      contato: formulario.contato,
      foto: formulario.foto,
      localizacao: formulario.localizacao,
      clientId: novoClientId(),
      // Gerado uma única vez por tentativa e preservado na fila offline.
      codigoAcesso: gerarCodigoAcesso(),
    }

    setEnviando(true)
    if (!online) {
      salvarNaFila(payload)
      setEnviando(false)
      return
    }

    try {
      const criada = await criarSolicitacao(payload)
      concluir(criada, payload.codigoAcesso)
    } catch (erro) {
      if (erro.offline) {
        salvarNaFila(payload)
      } else {
        setErroGeral(erro)
        if (erro.campos) {
          setErros(erro.campos)
          if (erro.campos.foto) foto.definirErro(erro.campos.foto)
        }
        requestAnimationFrame(() => resumoErroRef.current?.focus())
      }
    } finally {
      setEnviando(false)
    }
  }

  async function copiarProtocolo() {
    try {
      await navigator.clipboard.writeText(protocolo.protocolo)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }

  async function copiarCodigo() {
    if (!protocolo?.codigoAcesso) return
    try {
      await navigator.clipboard.writeText(protocolo.codigoAcesso)
      setCodigoCopiado(true)
      window.setTimeout(() => setCodigoCopiado(false), 2500)
    } catch {
      setCodigoCopiado(false)
    }
  }

  function novaSolicitacao() {
    limparRascunho()
    setFormulario({ ...FORMULARIO_VAZIO })
    setProtocolo(null)
    setPendente(null)
    setPendenteEm(null)
    setErros({})
    setErroGeral(null)
    cep.limpar()
    foto.limpar()
    localizacao.limpar()
    semelhanca.limpar()
    setCopiado(false)
    setCodigoCopiado(false)
    setRascunhoStatus('')
    setBuscaServico('')
  }

  return {
    online,
    servicos,
    carregando,
    erroServicos,
    recarregar,
    formulario,
    buscaServico,
    servicosFiltrados,
    servicoSelecionado,
    erros,
    erroGeral,
    cep,
    foto,
    localizacao,
    semelhantes: semelhanca.semelhantes,
    consultandoSemelhantes: semelhanca.consultando,
    enviando,
    protocolo,
    pendente,
    copiado,
    codigoCopiado,
    rascunhoStatus,
    resumoErroRef,
    alterar,
    alterarCep,
    selecionarServico,
    enviar,
    copiarProtocolo,
    copiarCodigo,
    novaSolicitacao,
    definirBuscaServico: setBuscaServico,
  }
}
