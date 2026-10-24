import { useRef, useState } from 'react'
import { consultarCep } from '../servicos/cep'

export function useCep({ cep, endereco, online, limiteEndereco, aoAlterarEndereco }) {
  const [buscando, setBuscando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const enderecoRef = useRef(null)

  async function buscar() {
    const digitos = cep.replace(/\D/g, '')
    if (digitos.length !== 8) {
      setMensagem('Informe um CEP com 8 dígitos.')
      return
    }
    if (!online) {
      setMensagem('Sem conexão. Preencha o endereço manualmente.')
      return
    }

    setBuscando(true)
    setMensagem('')
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 7000)

    try {
      const dados = await consultarCep(digitos, { signal: controller.signal })
      if (dados.erro) {
        setMensagem('CEP não encontrado. Confira os números.')
        return
      }

      const numeroAtual = endereco.match(/,\s*(\d+[A-Za-z]?)/)?.[1]
      const logradouro = [dados.logradouro, numeroAtual].filter(Boolean).join(', ')
      const resultado = [logradouro, dados.bairro, dados.localidade]
        .filter(Boolean)
        .join(' - ')
        .slice(0, limiteEndereco)

      if (resultado) {
        aoAlterarEndereco(resultado)
        setMensagem(
          `Endereço localizado em ${dados.localidade}/${dados.uf}. Complete com o número e o complemento.`,
        )
        requestAnimationFrame(() => enderecoRef.current?.focus())
      } else {
        setMensagem('O CEP não trouxe um logradouro. Preencha o endereço manualmente.')
      }
    } catch (erro) {
      setMensagem(
        erro?.name === 'AbortError'
          ? 'A consulta demorou. Preencha o endereço manualmente.'
          : 'Não foi possível consultar o CEP. Preencha o endereço manualmente.',
      )
    } finally {
      window.clearTimeout(timer)
      setBuscando(false)
    }
  }

  function limpar() {
    setMensagem('')
  }

  return { buscando, mensagem, buscar, limpar, enderecoRef }
}
