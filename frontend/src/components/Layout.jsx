import { Home, Plus, Search, UserRound, WifiOff } from 'lucide-react'
import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import logoColorido from '../assets/logo-icone-colorido.png'
import logoBranco from '../assets/logo-icone-branco.png'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

const ITENS = [
  { para: '/', rotulo: 'Início', Icone: Home, fim: true },
  { para: '/nova-solicitacao', rotulo: 'Solicitar', Icone: Plus },
  { para: '/acompanhar', rotulo: 'Acompanhar', Icone: Search },
  { para: '/perfil', rotulo: 'Perfil', Icone: UserRound },
]

export default function Layout() {
  const online = useOnlineStatus()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="app">
      <a className="pular-para-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>

      <header className="cabecalho">
        <div className="cabecalho__interno">
          <NavLink to="/" className="marca" aria-label="Prefeitura Digital, página inicial">
            <span className="marca__simbolo" aria-hidden="true">
              <picture>
                <source srcSet={logoBranco} media="(prefers-color-scheme: dark)" />
                <img src={logoColorido} alt="" />
              </picture>
            </span>
            <span className="marca__nome">Prefeitura Digital</span>
            <span className="marca__selo">demo</span>
          </NavLink>

          <nav className="nav-desktop" aria-label="Navegação principal">
            {ITENS.map(({ para, rotulo, Icone, fim }) => (
              <NavLink
                key={para}
                to={para}
                end={fim}
                className={({ isActive }) => `nav-desktop__link${isActive ? ' is-ativo' : ''}`}
              >
                <Icone className="nav-desktop__icone" aria-hidden="true" />
                <span>{rotulo}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {!online && (
        <div className="faixa-offline" role="status">
          <WifiOff aria-hidden="true" />
          <span>Sem conexão — usando dados salvos.</span>
        </div>
      )}

      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="rodape">
        <span className="rodape__ponto" aria-hidden="true" />
        Demonstração com dados fictícios · v0.1.0
      </footer>

      <nav className="nav-mobile" aria-label="Navegação principal">
        {ITENS.map(({ para, rotulo, Icone, fim }) => (
          <NavLink
            key={para}
            to={para}
            end={fim}
            className={({ isActive }) => `nav-mobile__link${isActive ? ' is-ativo' : ''}`}
          >
            <span className="nav-mobile__icone">
              <Icone aria-hidden="true" />
            </span>
            <span>{rotulo}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
