import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { LOGO_URL } from '../constants';

const Auth: React.FC = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[var(--c-paper)]">
      <div className="w-full max-w-sm mx-auto bg-[var(--c-surface)] rounded-2xl p-8 border-4 border-[var(--c-ink-light)] shadow-[10px_10px_0_#5D4037]">
        <div className="flex flex-col items-center mb-6">
          <img src={LOGO_URL} alt="PictoCat Logo" className="w-24 h-24 mb-4" />
          <h1 className="text-4xl font-black text-[var(--c-ink-light)]">PictoCat</h1>
        </div>
        
        <p className="text-center text-[var(--c-ink-light)]/80 mb-8">
          Un comunicador visual divertido donde coleccionas gatos y juegas para desbloquear más.
        </p>

        <button
          onClick={() => loginWithRedirect()}
          className="w-full btn-cartoon btn-cartoon-primary text-lg"
        >
          Iniciar Sesión / Registrarse
        </button>

        <p className="text-xs text-center text-[var(--c-ink-light)]/50 mt-6">
          Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
        </p>
      </div>
    </div>
  );
};

export default Auth;
