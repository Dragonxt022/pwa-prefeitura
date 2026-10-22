import { useEffect, useState } from 'react'

const consultaStandalone = () => window.matchMedia('(display-mode: standalone)').matches

function detectarIOS() {
  const ua = navigator.userAgent || ''
  const ipadComTouch = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /iphone|ipad|ipod/i.test(ua) || ipadComTouch
}

/**
 * Estado de instalação do PWA, usado para decidir quando faz sentido
 * oferecer notificações (no iOS, só funciona no app instalado).
 */
export function usePwaInstall() {
  const [instalado, setInstalado] = useState(() => ({
    standalone: consultaStandalone(),
    ios: detectarIOS(),
    suportaNotificacao: typeof window !== 'undefined' && 'Notification' in window,
  }))

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    const aoMudar = (evento) => setInstalado((atual) => ({ ...atual, standalone: evento.matches }))
    media.addEventListener('change', aoMudar)
    return () => media.removeEventListener('change', aoMudar)
  }, [])

  return instalado
}
