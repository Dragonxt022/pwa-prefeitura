import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Acompanhar from './pages/Acompanhar'
import Home from './pages/Home'
import NaoEncontrada from './pages/NaoEncontrada'
import NovaSolicitacao from './pages/NovaSolicitacao'
import Perfil from './pages/Perfil'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="nova-solicitacao" element={<NovaSolicitacao />} />
        <Route path="acompanhar" element={<Acompanhar />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  )
}
