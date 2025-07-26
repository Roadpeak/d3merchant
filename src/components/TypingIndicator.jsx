// components/TypingIndicator.jsx
import React, { useState, useEffect } from 'react';

const TypingIndicator = ({ 
  typingUsers = [], 
  currentUserId,
  getUserName = (userId) => `User ${userId}`,
  className = "",
  showAvatars = false,
  maxDisplayUsers = 3
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  // Filter out current user and limit displayed users
  const displayUsers = typingUsers
    .filter(userId => userId !== currentUserId)
    .slice(0, maxDisplayUsers);

  // Animation effect for dots
  useEffect(() => {
    if (displayUsers.length === 0) return;

    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, [displayUsers.length]);

  if (displayUsers.length === 0) return null;

  const formatTypingText = () => {
    const userNames = displayUsers.map(getUserName);
    const remainingCount = typingUsers.length - maxDisplayUsers;

    if (userNames.length === 1) {
      return `${userNames[0]} is typing`;
    } else if (userNames.length === 2) {
      return `${userNames[0]} and ${userNames[1]} are typing`;
    } else if (userNames.length === 3) {
      return `${userNames[0]}, ${userNames[1]}, and ${userNames[2]} are typing`;
    } else {
      const displayed = userNames.slice(0, 2).join(', ');
      return `${displayed} and ${remainingCount + 1} others are typing`;
    }
  };

  const renderDots = () => {
    return (
      <div className="flex gap-1 ml-2">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 bg-gray-400 rounded-full transition-opacity duration-300 ${
              index <= animationPhase ? 'opacity-100' : 'opacity-30'
            }`}
            style={{
              animationDelay: `${index * 200}ms`
            }}
          />
        ))}
      </div>
    );
  };

  const renderAvatars = () => {
    if (!showAvatars) return null;

    return (
      <div className="flex -space-x-2 mr-2">
        {displayUsers.slice(0, 3).map((userId, index) => (
          <div
            key={userId}
            className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium"
            style={{ zIndex: 10 - index }}
            title={getUserName(userId)}
          >
            {getUserName(userId).charAt(0).toUpperCase()}
          </div>
        ))}
        {typingUsers.length > 3 && (
          <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium">
            +{typingUsers.length - 3}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex items-center px-4 py-2 ${className}`}>
      {renderAvatars()}
      <div className="flex items-center text-sm text-gray-500">
        <span>{formatTypingText()}</span>
        {renderDots()}
      </div>
    </div>
  );
};

// Enhanced version with message bubble style
export const TypingBubble = ({ 
  typingUsers = [], 
  currentUserId,
  getUserName,
  className = "" 
}) => {
  const displayUsers = typingUsers.filter(userId => userId !== currentUserId);
  
  if (displayUsers.length === 0) return null;

  return (
    <div className={`flex items-start gap-2 mb-4 ${className}`}>
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
        <div className="w-4 h-4 bg-gray-500 rounded-full animate-pulse" />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-xs">
        <TypingIndicator 
          typingUsers={typingUsers}
          currentUserId={currentUserId}
          getUserName={getUserName}
          className="p-0 text-gray-600"
        />
      </div>
    </div>
  );
};

// Simple dots only version
export const TypingDots = ({ isVisible = false, className = "" }) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className={`flex gap-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`w-2 h-2 bg-current rounded-full transition-opacity duration-300 ${
            index <= animationPhase ? 'opacity-100' : 'opacity-30'
          }`}
        />
      ))}
    </div>
  );
};

// Hook for easier typing management
export const useTypingIndicator = (socket, conversationId, user) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const startTyping = React.useCallback(() => {
    if (!socket?.isConnected || !conversationId || !user?.id) return;

    if (!isTyping) {
      socket.emit('typing_start', { conversationId, userId: user.id });
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing
    const timeout = setTimeout(() => {
      socket.emit('typing_stop', { conversationId, userId: user.id });
      setIsTyping(false);
    }, 2000);

    setTypingTimeout(timeout);
  }, [socket, conversationId, user?.id, isTyping, typingTimeout]);

  const stopTyping = React.useCallback(() => {
    if (!socket?.isConnected || !conversationId || !user?.id) return;

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    if (isTyping) {
      socket.emit('typing_stop', { conversationId, userId: user.id });
      setIsTyping(false);
    }
  }, [socket, conversationId, user?.id, isTyping, typingTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  return { startTyping, stopTyping, isTyping };
};

export default TypingIndicator;