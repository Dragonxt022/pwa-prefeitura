import { useCallback, useState } from 'react'
import {
  atualizarUsuarioGestao,
  criarUsuarioGestao,
  listarSetoresGestao,
  listarUsuariosGestao,
} from '../servicos/api'
import { FORM_USUARIO_INICIAL } from '../utils/gestao'

export function useGestaoUsuarios({ setores, setSetores, definirErro, definirMensagem }) {
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false)
  const [formUsuario, setFormUsuario] = useState(FORM_USUARIO_INICIAL)
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)

  const limpar = useCallback(() => {
    setMostrarUsuarios(false)
    setUsuarios([])
    setCarregandoUsuarios(false)
    setFormUsuario(FORM_USUARIO_INICIAL)
    setSalvandoUsuario(false)
  }, [])

  const carregarUsuarios = useCallback(async () => {
    setCarregandoUsuarios(true)
    definirErro(null)
    try {
      const [listaUsuarios, listaSetores] = await Promise.all([
        listarUsuariosGestao(),
        listarSetoresGestao(),
      ])
      setUsuarios(listaUsuarios)
      setSetores(listaSetores)
      setFormUsuario((atual) => ({
        ...atual,
        setorId:
          atual.setorId ||
          listaSetores.find((setor) => !setor.central)?.id ||
          '',
      }))
    } catch (falha) {
      definirErro(falha)
    } finally {
      setCarregandoUsuarios(false)
    }
  }, [definirErro, setSetores])

  const abrir = useCallback(() => {
    setMostrarUsuarios(true)
    void carregarUsuarios()
  }, [carregarUsuarios])

  const fechar = useCallback(() => {
    setMostrarUsuarios(false)
  }, [])

  function atualizarCampo(campo, valor) {
    setFormUsuario((atual) => ({ ...atual, [campo]: valor }))
  }

  function alterarPapel(papel) {
    setFormUsuario((atual) => ({
      ...atual,
      papel,
      setorId:
        papel === 'setor'
          ? atual.setorId || setores.find((setor) => !setor.central)?.id || ''
          : '',
    }))
  }

  async function criarUsuario(evento) {
    evento.preventDefault()
    setSalvandoUsuario(true)
    definirErro(null)
    definirMensagem('')
    try {
      await criarUsuarioGestao({
        nome: formUsuario.nome,
        email: formUsuario.email,
        senha: formUsuario.senha,
        papel: formUsuario.papel,
        setorId: formUsuario.papel === 'setor' ? formUsuario.setorId : undefined,
      })
      setFormUsuario((atual) => ({
        ...FORM_USUARIO_INICIAL,
        setorId: setores.find((setor) => !setor.central)?.id ?? atual.setorId,
      }))
      definirMensagem('Usuário criado. Ele já pode entrar com o e-mail e a senha cadastrados.')
      await carregarUsuarios()
    } catch (falha) {
      definirErro(falha)
    } finally {
      setSalvandoUsuario(false)
    }
  }

  async function alternarUsuario(usuarioAtual) {
    definirErro(null)
    try {
      await atualizarUsuarioGestao(usuarioAtual.id, { ativo: !usuarioAtual.ativo })
      await carregarUsuarios()
      definirMensagem(
        usuarioAtual.ativo
          ? 'Usuário desativado. A sessão dele deixará de ser aceita nas próximas requisições.'
          : 'Usuário reativado.',
      )
    } catch (falha) {
      definirErro(falha)
    }
  }

  return {
    mostrarUsuarios,
    usuarios,
    carregandoUsuarios,
    formUsuario,
    salvandoUsuario,
    limpar,
    abrir,
    fechar,
    atualizarCampo,
    alterarPapel,
    criarUsuario,
    alternarUsuario,
  }
}
