import { component$, useStore, $, QwikMouseEvent } from '@builder.io/qwik';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose$: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = component$<ModalProps>(({ isOpen, onClose$, title, size = 'md', children }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const handleBackdropClick = $((e: QwikMouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      onClose$();
    }
  });

  return (
    <div 
      class="modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick$={handleBackdropClick}
    >
      <div class={clsx('bg-white rounded-xl shadow-2xl w-full', sizeClasses[size])}>
        <div class="flex items-center justify-between p-6 border-b">
          <h3 class="text-lg font-semibold">{title}</h3>
          <button 
            onClick$={onClose$}
            class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div class="p-6">
          {children}
        </div>
      </div>
    </div>
  );
});
