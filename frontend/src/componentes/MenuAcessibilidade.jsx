import { Accessibility, Contrast, Moon, Sun, X, ZoomIn } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  lerPreferenciasAcessibilidade,
  salvarPreferenciasAcessibilidade,
} from '../utils/acessibilidade'

function prefereTemaEscuro() {
  return Boolean(
    typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches,
  )
}

export default function MenuAcessibilidade() {
  const [aberto, setAberto] = useState(false)
  const [preferencias, setPreferencias] = useState(lerPreferenciasAcessibilidade)
  const containerRef = useRef(null)
  const botaoRef = useRef(null)
  const primeiroItemRef = useRef(null)

  const temaEscuro =
    preferencias.tema === 'escuro' ||
    (preferencias.tema === 'auto' && prefereTemaEscuro())

  useEffect(() => {
    const aoAtualizar = (evento) => {
      setPreferencias(evento.detail ?? lerPreferenciasAcessibilidade())
    }
    window.addEventListener('prefeitura:acessibilidade', aoAtualizar)
    return () => window.removeEventListener('prefeitura:acessibilidade', aoAtualizar)
  }, [])

  useEffect(() => {
    if (!aberto) return undefined

    function aoTeclar(evento) {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        setAberto(false)
        window.requestAnimationFrame(() => botaoRef.current?.focus())
      }
    }

    function aoClicarFora(evento) {
      if (!containerRef.current?.contains(evento.target)) setAberto(false)
    }

    document.addEventListener('keydown', aoTeclar)
    document.addEventListener('mousedown', aoClicarFora)
    window.requestAnimationFrame(() => primeiroItemRef.current?.focus())

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.removeEventListener('mousedown', aoClicarFora)
    }
  }, [aberto])

  function atualizar(parcial) {
    setPreferencias(salvarPreferenciasAcessibilidade({ ...preferencias, ...parcial }))
  }

  function alternarTema() {
    atualizar({ tema: temaEscuro ? 'claro' : 'escuro' })
  }

  function fechar() {
    setAberto(false)
    window.requestAnimationFrame(() => botaoRef.current?.focus())
  }

  return (
    <div className="menu-acessibilidade" ref={containerRef}>
      {aberto && (
        <div
          className="menu-acessibilidade__painel"
          id="menu-acessibilidade"
          role="dialog"
          aria-label="Opções de acessibilidade"
        >
          <header className="menu-acessibilidade__topo">
            <div>
              <strong>Acessibilidade</strong>
              <small>Ajuste a leitura em um toque.</small>
            </div>
            <button
              type="button"
              className="menu-acessibilidade__fechar"
              onClick={fechar}
              aria-label="Fechar menu de acessibilidade"
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <button
            ref={primeiroItemRef}
            type="button"
            className="menu-acessibilidade__item"
            onClick={alternarTema}
            aria-pressed={temaEscuro}
          >
            <span className="menu-acessibilidade__icone">
              {temaEscuro ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </span>
            <span className="menu-acessibilidade__texto">
              <strong>{temaEscuro ? 'Modo claro' : 'Modo escuro'}</strong>
              <small>{temaEscuro ? 'Toque para clarear a tela' : 'Toque para escurecer a tela'}</small>
            </span>
            <span className="menu-acessibilidade__estado">{temaEscuro ? 'Ativo' : 'Inativo'}</span>
          </button>

          <button
            type="button"
            className="menu-acessibilidade__item"
            onClick={() =>
              atualizar({ fonte: preferencias.fonte === 'grande' ? 'normal' : 'grande' })
            }
            aria-pressed={preferencias.fonte === 'grande'}
          >
            <span className="menu-acessibilidade__icone">
              <ZoomIn aria-hidden="true" />
            </span>
            <span className="menu-acessibilidade__texto">
              <strong>Texto ampliado</strong>
              <small>Aumenta o tamanho da letra em todo o app</small>
            </span>
            <span className="menu-acessibilidade__estado">
              {preferencias.fonte === 'grande' ? 'Ativo' : 'Inativo'}
            </span>
          </button>

          <button
            type="button"
            className="menu-acessibilidade__item"
            onClick={() => atualizar({ contraste: !preferencias.contraste })}
            aria-pressed={preferencias.contraste}
          >
            <span className="menu-acessibilidade__icone">
              <Contrast aria-hidden="true" />
            </span>
            <span className="menu-acessibilidade__texto">
              <strong>Alto contraste</strong>
              <small>Reforça bordas, textos e áreas de foco</small>
            </span>
            <span className="menu-acessibilidade__estado">
              {preferencias.contraste ? 'Ativo' : 'Inativo'}
            </span>
          </button>

          <Link className="menu-acessibilidade__link" to="/perfil" onClick={fechar}>
            Ver todas as opções no perfil
          </Link>
        </div>
      )}

      <button
        ref={botaoRef}
        type="button"
        className="menu-acessibilidade__botao"
        onClick={() => setAberto((atual) => !atual)}
        aria-expanded={aberto}
        aria-controls={aberto ? 'menu-acessibilidade' : undefined}
        aria-label={aberto ? 'Fechar menu de acessibilidade' : 'Abrir menu de acessibilidade'}
        title="Acessibilidade"
      >
        <Accessibility aria-hidden="true" />
      </button>
    </div>
  )
}
