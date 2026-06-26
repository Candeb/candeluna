import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import './FinalOutro.css'

const FinalOutro = forwardRef(function FinalOutro(
  { onRestart, messageRef, ctaRef, restartRef, 'aria-hidden': ariaHidden = true },
  ref,
) {
  return (
    <div
      ref={ref}
      className="final-outro"
      aria-hidden={ariaHidden}
    >
      <div ref={messageRef} className="final-outro__message">
        <p className="final-outro__line">Cada proyecto comienza en la oscuridad.</p>
        <p className="final-outro__line final-outro__line--accent">
          Hagamos despegar el próximo.
        </p>
      </div>

      <div ref={ctaRef} className="final-outro__actions">
        <Link
          className="final-outro__btn final-outro__btn--primary"
          to="/servicios/contacto?accion=llamada"
        >
          Agendar una llamada
        </Link>
        <Link
          className="final-outro__btn final-outro__btn--ghost"
          to="/servicios/contacto?accion=presupuesto"
        >
          Solicitar presupuesto
        </Link>
      </div>

      <button
        ref={restartRef}
        type="button"
        className="final-outro__restart"
        onClick={onRestart}
        aria-label="Reiniciar viaje lunar"
      >
        <span className="final-outro__restart-icon" aria-hidden="true">
          ↓
        </span>
        <span>Iniciar una nueva exploración</span>
      </button>
    </div>
  )
})

export default FinalOutro
