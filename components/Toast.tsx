import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      const exitTimer = setTimeout(onClose, 400); // Corresponds to animation duration
      return () => clearTimeout(exitTimer);
    }, 3000); // Disappear after 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div 
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-auto max-w-[90vw] ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      style={{ zIndex: 'var(--z-toast)' }}
    >
      <div className="card-cartoon !shadow-hard bg-[var(--c-surface)] text-[var(--c-ink)] font-bold py-3 px-6 text-base text-center cursor-default hover:!transform-none hover:!shadow-hard">
        {message}
      </div>
    </div>
  );
};

export default Toast;