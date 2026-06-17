import type { Extension } from '@/types/game';

interface ExtensionCardProps {
  extension: Extension;
  onClick: () => void;
  isDisabled: boolean;
}

export function ExtensionCard({ extension, onClick, isDisabled }: ExtensionCardProps) {
  const isBusy = extension.status === 'busy';

  return (
    <button
      onClick={onClick}
      disabled={isDisabled || isBusy}
      className={`relative p-3 rounded-lg transition-all duration-200 border-2 ${
        isBusy 
          ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
          : isDisabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
            : 'border-green-300 bg-green-50 hover:border-green-500 hover:bg-green-100 cursor-pointer'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-lg text-gray-800">{extension.number}</div>
          <div className="text-sm text-gray-600">{extension.name}</div>
          <div className="text-xs text-gray-400">{extension.department}</div>
        </div>
        <div className={`w-3 h-3 rounded-full ${isBusy ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
      </div>

      {isBusy && extension.currentCall && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs flex items-center gap-1">
            <span className="text-gray-500">通话中:</span>
            <span className="text-gray-700">{extension.currentCall.caller.avatar} {extension.currentCall.caller.name}</span>
          </div>
        </div>
      )}
    </button>
  );
}
