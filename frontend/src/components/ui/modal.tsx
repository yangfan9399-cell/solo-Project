import { component$, Slot } from '@builder.io/qwik';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose$: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = component$<ModalProps>(({ title, isOpen, onClose$, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick$={onClose$} />
        <div class={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]}`}>
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick$={onClose$}
              class="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="px-6 py-4">
            <Slot />
          </div>
        </div>
      </div>
    </div>
  );
});
