import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { atualizarStatusGestao, listarGestao, listarServicos, listarSetoresGestao } from '../servicos/api'
import { FILTROS_INICIAIS } from '../utils/gestao'

const DADOS_INICIAIS = { dados: [], total: 0, estatisticas: null }
const FORM_STATUS_INICIAL = { status: '', prioridade: 'normal', observacao: '' }

export function useGestaoFila({ usuario, aoSessaoExpirada }) {
  const [erro, setErro] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [dados, setDados] = useState(DADOS_INICIAIS)
  const [servicos, setServicos] = useState([])
  const [setores, setSetores] = useState([])
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS)
  const [selecionada, setSelecionada] = useState(null)
  const [formStatus, setFormStatus] = useState(FORM_STATUS_INICIAL)
  const [salvandoStatus, setSalvandoStatus] = useState(false)
  const [selecionados, setSelecionados] = useState([])
  const detalheRef = useRef(null)

  const podeVerTodos = usuario?.papel === 'admin' || usuario?.papel === 'triagem'
  const podeGerenciarUsuarios = usuario?.papel === 'admin'

  const limpar = useCallback(() => {
    setDados(DADOS_INICIAIS)
    setFiltros(FILTROS_INICIAIS)
    setSelecionada(null)
    setSelecionados([])
    setFormStatus(FORM_STATUS_INICIAL)
    setErro(null)
    setMensagem('')
  }, [])

  const carregar = useCallback(
    async (filtrosAtuais) => {
      setCarregando(true)
      setErro(null)
      try {
        const resposta = await listarGestao(filtrosAtuais)
        setDados({
          dados: resposta.dados ?? [],
          total: resposta.total ?? 0,
          estatisticas: resposta.estatisticas ?? null,
        })
      } catch (falha) {
        if (falha.status === 401) {
          limpar()
          aoSessaoExpirada('Sessão expirada. Entre novamente.')
        } else {
          setErro(falha)
        }
      } finally {
        setCarregando(false)
      }
    },
    [aoSessaoExpirada, limpar],
  )

  useEffect(() => {
    let ativo = true
    listarServicos()
      .then((lista) => {
        if (ativo) setServicos(lista)
      })
      .catch(() => {
        if (ativo) setServicos([])
      })
    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    if (!usuario) return undefined
    let ativo = true
    listarSetoresGestao()
      .then((lista) => {
        if (ativo) setSetores(lista)
      })
      .catch(() => {
        if (ativo) setSetores([])
      })
    return () => {
      ativo = false
    }
  }, [usuario])

  useEffect(() => {
    if (!usuario) return undefined
    const timer = window.setTimeout(() => carregar(filtros), 300)
    return () => window.clearTimeout(timer)
  }, [carregar, filtros, usuario])

  useEffect(() => {
    if (selecionada) requestAnimationFrame(() => detalheRef.current?.focus())
  }, [selecionada])

  const estatisticas = dados.estatisticas ?? {
    total: 0,
    abertas: 0,
    atrasadas: 0,
    concluidas: 0,
    avaliacoes: 0,
    mediaAvaliacao: null,
  }

  const servicosPorId = useMemo(
    () => Object.fromEntries(servicos.map((servico) => [servico.id, servico])),
    [servicos],
  )

  const todosVisiveisSelecionados =
    dados.dados.length > 0 &&
    dados.dados.every((item) => selecionados.includes(item.protocolo))

  const itensSelecionados = dados.dados.filter((item) => selecionados.includes(item.protocolo))

  function abrirDetalhe(item) {
    setSelecionada(item)
    setFormStatus({
      status: item.status,
      prioridade: item.prioridade ?? 'normal',
      observacao: '',
    })
    setMensagem('')
    setErro(null)
  }

  function fecharDetalhe() {
    setSelecionada(null)
  }

  async function salvarAtualizacao(evento) {
    evento.preventDefault()
    if (!selecionada) return
    setSalvandoStatus(true)
    setMensagem('')
    setErro(null)
    try {
      const solicitacao = await atualizarStatusGestao(selecionada.protocolo, formStatus)
      setSelecionada(solicitacao)
      setFormStatus({
        status: solicitacao.status,
        prioridade: solicitacao.prioridade ?? 'normal',
        observacao: '',
      })
      setMensagem('Status atualizado. O cidadão verá a mudança ao abrir o app.')
      await carregar(filtros)
    } catch (falha) {
      setErro(falha)
    } finally {
      setSalvandoStatus(false)
    }
  }

  function atualizarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }))
    setSelecionados([])
  }

  function limparFiltros() {
    setFiltros(FILTROS_INICIAIS)
    setSelecionados([])
  }

  function alternarSelecionado(protocolo) {
    setSelecionados((atual) =>
      atual.includes(protocolo)
        ? atual.filter((item) => item !== protocolo)
        : [...atual, protocolo],
    )
  }

  function alternarTodosVisiveis() {
    if (todosVisiveisSelecionados) {
      setSelecionados((atual) =>
        atual.filter((protocolo) => !dados.dados.some((item) => item.protocolo === protocolo)),
      )
    } else {
      setSelecionados((atual) => [
        ...new Set([...atual, ...dados.dados.map((item) => item.protocolo)]),
      ])
    }
  }

  function atualizarFormStatus(campo, valor) {
    setFormStatus((atual) => ({ ...atual, [campo]: valor }))
  }

  return {
    erro,
    mensagem,
    definirErro: setErro,
    definirMensagem: setMensagem,
    carregando,
    dados,
    servicos,
    setores,
    setSetores,
    filtros,
    selecionada,
    definirSelecionada: setSelecionada,
    formStatus,
    salvandoStatus,
    selecionados,
    detalheRef,
    podeVerTodos,
    podeGerenciarUsuarios,
    estatisticas,
    servicosPorId,
    todosVisiveisSelecionados,
    itensSelecionados,
    limpar,
    carregar,
    abrirDetalhe,
    fecharDetalhe,
    salvarAtualizacao,
    atualizarFiltro,
    limparFiltros,
    alternarSelecionado,
    alternarTodosVisiveis,
    atualizarFormStatus,
  }
}
