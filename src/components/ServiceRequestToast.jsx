// components/ServiceRequestToast.jsx - Real-time IMMEDIATE service request notification toast
import React, { useState, useEffect } from 'react';
import merchantNotificationSocket from '../services/merchantNotificationSocket';

const ServiceRequestToast = () => {
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Subscribe to IMMEDIATE service request notifications
    const unsubscribe = merchantNotificationSocket.onNotification((notification, eventType) => {
      if (eventType === 'immediate_service_request') {
        console.log('🔔 Showing toast for IMMEDIATE request:', notification);

        // Add to notifications list
        setNotifications(prev => [...prev, notification]);

        // Play notification sound if enabled
        if (soundEnabled) {
          playNotificationSound();
        }

        // Auto-remove after 10 seconds
        setTimeout(() => {
          removeNotification(notification.id);
        }, 10000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [soundEnabled]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.2);
      }, 300);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  const handleViewRequest = (notification) => {
    window.location.href = notification.actionUrl;
    removeNotification(notification.id);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg shadow-2xl border-2 border-white overflow-hidden animate-slideInRight"
        >
          {/* Header */}
          <div className="bg-red-600 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="animate-pulse">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="font-bold text-sm">IMMEDIATE SERVICE REQUEST</span>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white hover:text-gray-200 text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-bold text-lg mb-2">{notification.data.title}</h3>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{notification.data.location}</span>
              </div>

              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold">KSH {notification.data.budgetMin.toLocaleString()} - {notification.data.budgetMax.toLocaleString()}</span>
              </div>

              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="bg-white text-red-600 px-2 py-0.5 rounded font-medium">
                  {notification.data.category}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleViewRequest(notification)}
                className="flex-1 bg-white text-red-600 hover:bg-gray-100 font-bold py-2 px-4 rounded transition-colors"
              >
                View & Send Offer
              </button>
              <button
                onClick={() => removeNotification(notification.id)}
                className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Timer bar */}
          <div className="h-1 bg-red-700">
            <div className="h-full bg-white animate-shrinkWidth" style={{ animationDuration: '10s' }}></div>
          </div>
        </div>
      ))}

      {/* Sound toggle button */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="fixed bottom-4 right-4 bg-white text-gray-700 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        title={soundEnabled ? 'Disable notification sound' : 'Enable notification sound'}
      >
        {soundEnabled ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }

        .animate-shrinkWidth {
          animation: shrinkWidth linear;
        }
      `}</style>
    </div>
  );
};

export default ServiceRequestToast;
