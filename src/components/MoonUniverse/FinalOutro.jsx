import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import './FinalOutro.css'

const FinalOutro = forwardRef(function FinalOutro(
  {
    onRestart,
    messageRef,
    ctaRef,
    restartRef,
    ctaInteractive = false,
    restartInteractive = false,
    'aria-hidden': ariaHidden = true,
  },
  ref,
) {
  const blockCta = (event) => {
    if (ctaInteractive) return
    event.preventDefault()
    event.stopPropagation()
  }

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

      <div
        ref={ctaRef}
        className={`final-outro__actions${ctaInteractive ? ' is-interactive' : ''}`}
        aria-hidden={!ctaInteractive}
      >
        <Link
          className="final-outro__btn final-outro__btn--primary"
          to="/servicios/contacto?accion=llamada"
          tabIndex={ctaInteractive ? 0 : -1}
          aria-disabled={!ctaInteractive}
          onClick={blockCta}
        >
          Agendar una llamada
        </Link>
        <Link
          className="final-outro__btn final-outro__btn--ghost"
          to="/servicios/contacto?accion=presupuesto"
          tabIndex={ctaInteractive ? 0 : -1}
          aria-disabled={!ctaInteractive}
          onClick={blockCta}
        >
          Solicitar presupuesto
        </Link>
      </div>

      <button
        ref={restartRef}
        type="button"
        className={`final-outro__restart${restartInteractive ? ' is-interactive' : ''}`}
        onClick={onRestart}
        aria-label="Reiniciar viaje lunar"
        aria-hidden={!restartInteractive}
        tabIndex={restartInteractive ? 0 : -1}
        disabled={!restartInteractive}
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
