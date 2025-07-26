// components/ConnectionStatus.jsx
import React from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle2 } from 'lucide-react';

const ConnectionStatus = ({ 
  isConnected, 
  connectionError, 
  reconnectAttempts, 
  showDetails = false,
  className = "" 
}) => {
  // Don't show anything if connected and no errors
  if (isConnected && !connectionError && !showDetails) {
    return null;
  }

  const getStatusConfig = () => {
    if (isConnected) {
      return {
        icon: CheckCircle2,
        text: 'Connected',
        bgColor: 'bg-green-50 border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-500'
      };
    } else if (connectionError) {
      return {
        icon: AlertCircle,
        text: connectionError,
        bgColor: 'bg-red-50 border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-500'
      };
    } else {
      return {
        icon: WifiOff,
        text: `Connecting... (${reconnectAttempts}/5)`,
        bgColor: 'bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-500'
      };
    }
  };

  const { icon: Icon, text, bgColor, textColor, iconColor } = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bgColor} ${className}`}>
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <span className={`text-sm font-medium ${textColor}`}>
        {text}
      </span>
      {!isConnected && reconnectAttempts > 0 && (
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                i < reconnectAttempts ? 'bg-yellow-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Usage examples:

// Simple notification
export const ConnectionNotification = ({ socketStatus }) => (
  <div className="fixed top-4 right-4 z-50">
    <ConnectionStatus {...socketStatus} />
  </div>
);

// Header status indicator
export const HeaderConnectionStatus = ({ socketStatus }) => (
  <div className="flex items-center">
    <ConnectionStatus 
      {...socketStatus} 
      showDetails={true}
      className="text-xs"
    />
  </div>
);

// Chat interface status
export const ChatConnectionStatus = ({ socketStatus, className }) => {
  if (socketStatus.isConnected) return null;
  
  return (
    <div className={`mb-4 ${className}`}>
      <ConnectionStatus {...socketStatus} />
      {socketStatus.connectionError?.includes('Authentication') && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Please <button 
              onClick={() => window.location.href = '/accounts/sign-in'}
              className="underline font-medium hover:no-underline"
            >
              sign in again
            </button> to continue chatting.
          </p>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;