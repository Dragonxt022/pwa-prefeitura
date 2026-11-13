import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  atualizarPerfilCidadao,
  cadastrarCidadao,
  excluirContaCidadao,
  loginCidadao,
  logoutCidadao,
  obterSessaoCidadao,
} from '../servicos/api'
import { CidadaoContext } from './contextoCidadao.js'

export function CidadaoProvider({ children }) {
  const [cidadao, setCidadao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const consultar = useCallback(async () => {
    try {
      const sessao = await obterSessaoCidadao()
      setCidadao(sessao?.cidadao ?? null)
      setErro(null)
    } catch (falha) {
      setErro(falha)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    // Busca assíncrona da sessão: o estado só muda depois da resposta.
    // oxlint-disable-next-line react/set-state-in-effect
    consultar()
  }, [consultar])

  const recarregar = useCallback(async () => {
    setCarregando(true)
    await consultar()
  }, [consultar])

  const entrar = useCallback(async (credenciais) => {
    const resposta = await loginCidadao(credenciais)
    setCidadao(resposta.cidadao)
    setErro(null)
    return resposta
  }, [])

  const cadastrar = useCallback(async (dados) => {
    const resposta = await cadastrarCidadao(dados)
    setCidadao(resposta.cidadao)
    setErro(null)
    return resposta
  }, [])

  const atualizar = useCallback(async (dados) => {
    const resposta = await atualizarPerfilCidadao(dados)
    setCidadao(resposta)
    return resposta
  }, [])

  const sair = useCallback(async () => {
    try {
      await logoutCidadao()
    } finally {
      setCidadao(null)
    }
  }, [])

  const excluir = useCallback(async (dados) => {
    await excluirContaCidadao(dados)
    setCidadao(null)
  }, [])

  const valor = useMemo(
    () => ({
      cidadao,
      carregando,
      erro,
      entrar,
      cadastrar,
      atualizar,
      sair,
      excluir,
      recarregar,
    }),
    [cidadao, carregando, erro, entrar, cadastrar, atualizar, sair, excluir, recarregar],
  )

  return <CidadaoContext.Provider value={valor}>{children}</CidadaoContext.Provider>
}
