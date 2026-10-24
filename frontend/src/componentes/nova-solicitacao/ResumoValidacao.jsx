import { AlertCircle } from 'lucide-react'

export default function ResumoValidacao({ erroGeral, erros, fotoErro, resumoErroRef }) {
  return (
    <div ref={resumoErroRef} tabIndex={-1} className="resumo-validacao" aria-live="assertive">
      {(erroGeral || Object.values(erros).some(Boolean) || fotoErro) && (
        <div className="alerta alerta--erro" role="alert">
          <AlertCircle aria-hidden="true" />
          <div>
            <strong>
              {erroGeral?.message ? 'Não foi possível enviar.' : 'Revise os campos destacados.'}
            </strong>
            {erroGeral?.message && <p>{erroGeral.message}</p>}
            {erroGeral?.codigo === 'limite_excedido' && (
              <p>Aguarde um minuto antes de enviar outra solicitação.</p>
            )}
            {fotoErro && <p>{fotoErro}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
