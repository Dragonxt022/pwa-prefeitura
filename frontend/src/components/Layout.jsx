import { BellRing, Check, Home, Plus, Search, UploadCloud, UserRound, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import logoColorido from '../assets/logo-icone-colorido.png'
import logoBranco from '../assets/logo-icone-branco.png'
import { useAtualizacoes } from '../hooks/useAtualizacoes'
import { useFilaSolicitacoes } from '../hooks/useFilaSolicitacoes'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

const ITENS = [
  { para: '/', rotulo: 'Início', Icone: Home, fim: true },
  { para: '/nova-solicitacao', rotulo: 'Solicitar', Icone: Plus },
  { para: '/acompanhar', rotulo: 'Acompanhar', Icone: Search },
  { para: '/perfil', rotulo: 'Perfil', Icone: UserRound },
]

function rotuloComBadge(rotulo, badge) {
  if (!badge) return undefined
  return `${rotulo}, ${badge} ${badge === 1 ? 'atualização' : 'atualizações'}`
}

export default function Layout() {
  const online = useOnlineStatus()
  const { pathname } = useLocation()
  const { naoLidas } = useAtualizacoes()
  const { pendentes, ultimo } = useFilaSolicitacoes()
  const [envioRecente, setEnvioRecente] = useState(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  useEffect(() => {
    if (!ultimo?.em) return undefined
    const idade = Date.now() - new Date(ultimo.em).getTime()
    if (!Number.isFinite(idade) || idade > 15_000) return undefined

    setEnvioRecente(ultimo)
    const timer = window.setTimeout(() => setEnvioRecente(null), 8000)
    return () => window.clearTimeout(timer)
  }, [ultimo])

  const itens = ITENS.map((item) =>
    item.para === '/acompanhar' ? { ...item, badge: naoLidas } : item,
  )

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
            {itens.map(({ para, rotulo, Icone, fim, badge }) => (
              <NavLink
                key={para}
                to={para}
                end={fim}
                className={({ isActive }) => `nav-desktop__link${isActive ? ' is-ativo' : ''}`}
                aria-label={rotuloComBadge(rotulo, badge)}
              >
                <span className="nav-desktop__icone">
                  <Icone aria-hidden="true" />
                  {badge > 0 && <span className="nav-desktop__badge" aria-hidden="true" />}
                </span>
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

      {pendentes > 0 && (
        <div className="faixa-fila" role="status">
          <UploadCloud aria-hidden="true" />
          <span>
            {pendentes === 1
              ? '1 pedido aguardando conexão para ser enviado.'
              : `${pendentes} pedidos aguardando conexão para serem enviados.`}
          </span>
        </div>
      )}

      {envioRecente && (
        <div className="faixa-envio" role="status">
          <Check aria-hidden="true" />
          <span>Pedido enviado: {envioRecente.protocolo}</span>
          <Link to={`/acompanhar?protocolo=${envioRecente.protocolo}`}>Acompanhar</Link>
        </div>
      )}

      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="rodape">
        <span className="rodape__ponto" aria-hidden="true" />
        <span>Demonstração com dados fictícios · v0.1.0</span>
        <span className="rodape__links">
          <Link to="/servicos">Catálogo</Link>
          <Link to="/gestao">Gestão</Link>
        </span>
        {naoLidas > 0 && (
          <span className="rodape__aviso">
            <BellRing aria-hidden="true" />
            {naoLidas === 1 ? '1 atualização' : `${naoLidas} atualizações`}
          </span>
        )}
      </footer>

      <nav className="nav-mobile" aria-label="Navegação principal">
        {itens.map(({ para, rotulo, Icone, fim, badge }) => (
          <NavLink
            key={para}
            to={para}
            end={fim}
            className={({ isActive }) => `nav-mobile__link${isActive ? ' is-ativo' : ''}`}
            aria-label={rotuloComBadge(rotulo, badge)}
          >
            <span className="nav-mobile__icone">
              <Icone aria-hidden="true" />
              {badge > 0 && (
                <span className="nav-mobile__badge" aria-hidden="true">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </span>
            <span>{rotulo}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
