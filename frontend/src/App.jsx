import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Acompanhar from './pages/Acompanhar'
import Gestao from './pages/Gestao'
import Home from './pages/Home'
import NaoEncontrada from './pages/NaoEncontrada'
import NovaSolicitacao from './pages/NovaSolicitacao'
import Perfil from './pages/Perfil'
import Servicos from './pages/Servicos'

export default function App() {
  return (
    <Routes>
      <Route path="gestao" element={<Gestao />} />
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
