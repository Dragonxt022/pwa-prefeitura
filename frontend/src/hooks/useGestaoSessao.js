import { useCallback, useEffect, useState } from 'react'
import { loginGestao, logoutGestao, obterSessaoGestao } from '../servicos/api'

export function useGestaoSessao() {
  const [sessao, setSessao] = useState(null)
  const [verificandoSessao, setVerificandoSessao] = useState(true)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [lembrar, setLembrar] = useState(true)
  const [entrando, setEntrando] = useState(false)
  const [erroLogin, setErroLogin] = useState('')

  useEffect(() => {
    let ativo = true
    obterSessaoGestao()
      .then((resposta) => {
        if (ativo) setSessao(resposta)
      })
      .catch((falha) => {
        if (!ativo) return
        if (falha.status !== 401) {
          setErroLogin(
            falha.offline
              ? 'Sem conexão para validar a sessão. Volte online para acessar a gestão.'
              : 'Não foi possível validar a sessão agora. Tente novamente.',
          )
        }
      })
      .finally(() => {
        if (ativo) setVerificandoSessao(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  const entrar = useCallback(
    async (evento) => {
      evento.preventDefault()
      setEntrando(true)
      setErroLogin('')
      try {
        const resposta = await loginGestao({ email, senha, lembrar })
        setSessao(resposta)
        setSenha('')
        return resposta
      } catch (falha) {
        setErroLogin(falha.message)
        return null
      } finally {
        setEntrando(false)
      }
    },
    [email, lembrar, senha],
  )

  const sair = useCallback(async () => {
    try {
      await logoutGestao()
    } catch {
      // O cookie pode ser limpo pelo servidor quando a conexão voltar.
    }
    setSessao(null)
    setSenha('')
    setErroLogin('')
  }, [])

  const expirar = useCallback((mensagem = 'Sessão expirada. Entre novamente.') => {
    setSessao(null)
    setSenha('')
    setErroLogin(mensagem)
  }, [])

  return {
    sessao,
    usuario: sessao?.usuario ?? null,
    triagemAutomatica: Boolean(sessao?.triagemAutomatica),
    verificandoSessao,
    email,
    setEmail,
    senha,
    setSenha,
    lembrar,
    setLembrar,
    entrando,
    erroLogin,
    entrar,
    sair,
    expirar,
  }
}
