import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  subMessage,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative flex items-center justify-center mb-4">
        <div className="absolute w-12 h-12 rounded-full border-2 border-blue-500/20 animate-ping" />
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin relative" />
      </div>
      <p className="text-sm font-medium text-slate-200">{message}</p>
      {subMessage && <p className="text-xs text-slate-400 mt-1 max-w-sm">{subMessage}</p>}
    </div>
  );
};
