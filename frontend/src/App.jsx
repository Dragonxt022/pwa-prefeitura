import { Route, Routes } from 'react-router-dom'
import Layout from './componentes/Layout'
import Acompanhar from './paginas/Acompanhar'
import Gestao from './paginas/Gestao'
import GestaoConfiguracoes from './paginas/GestaoConfiguracoes'
import Home from './paginas/Home'
import NaoEncontrada from './paginas/NaoEncontrada'
import NovaSolicitacao from './paginas/NovaSolicitacao'
import Perfil from './paginas/Perfil'
import Servicos from './paginas/Servicos'

export default function App() {
  return (
    <Routes>
      <Route path="gestao" element={<Gestao />} />
      <Route path="gestao/configuracoes" element={<GestaoConfiguracoes />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="servicos" element={<Servicos />} />
        <Route path="nova-solicitacao" element={<NovaSolicitacao />} />
        <Route path="acompanhar" element={<Acompanhar />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  )
}
