import { useState } from 'react'

export function useLocalizacaoSolicitacao({ aoAlterarLocalizacao }) {
  const [localizando, setLocalizando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  function capturar() {
    if (!navigator.geolocation) {
      setMensagem('Este navegador não oferece localização.')
      return
    }

    setLocalizando(true)
    setMensagem('Obtendo sua localização…')
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const localizacao = {
          latitude: Number(posicao.coords.latitude.toFixed(6)),
          longitude: Number(posicao.coords.longitude.toFixed(6)),
          precisao: Math.round(posicao.coords.accuracy),
        }
        aoAlterarLocalizacao(localizacao)
        setMensagem(`Localização anexada com precisão de aproximadamente ${localizacao.precisao} m.`)
        setLocalizando(false)
      },
      (falha) => {
        setLocalizando(false)
        setMensagem(
          falha.code === falha.PERMISSION_DENIED
            ? 'Permissão de localização não concedida. Você pode informar o endereço.'
            : 'Não foi possível obter a localização. Tente novamente ou siga só com o endereço.',
        )
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    )
  }

  function remover() {
    aoAlterarLocalizacao(null)
    setMensagem('Localização removida.')
  }

  function limpar() {
    setMensagem('')
  }

  return { localizando, mensagem, capturar, remover, limpar }
}
