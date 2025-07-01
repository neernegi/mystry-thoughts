'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Send, MessageCircle } from 'lucide-react';
import { toast, Toaster } from "sonner";

import { socket } from '@/lib/socketClient';
import { Message } from '@/types/interfaces';



interface MatchedUser {
  anonymousName: string;
  image: string;
}

const ChatRoom = ({ chatRoomId }: { chatRoomId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    // Connect socket when component mounts
    socket.connect();

    // Join the chat room
    if (session?.user) {
      socket.emit("join-room", { 
        room: chatRoomId,
        username: session.user?.anonymousName || "Anonymous" 
      });
    }

    // Set up socket listeners
    socket.on("message", (data: { sender: string, content: string, timestamp: string }) => {
      setMessages(prev => [...prev, {
        _id: Date.now().toString(),
        content: data.content,
        sender: {
          _id: data.sender,
          anonymousName: data.sender === session?.user?._id ? "You" : matchedUser?.anonymousName || "Unknown",
          image: data.sender === session?.user?._id ? session.user.image : matchedUser?.image || ""
        },
        timestamp: data.timestamp
      }]);
    });

    socket.on("user-joined", (username: string) => {
      toast(`${username} joined the chat`, { icon: '👋' });
    });

    socket.on("typing", ({ isTyping, sender }) => {
      if (sender !== session?.user?._id) {
        setIsTyping(isTyping);
      }
    });

    const fetchChatData = async () => {
      try {
        const response = await axios.get(`/api/chat/${chatRoomId}`);
        const { data } = response;
        
        if (data.success && data.messages && data.matchedUser) {
          setMessages(data.messages);
          setMatchedUser(data.matchedUser);
          setError(null);
        } else {
          setError(data.message || 'Failed to load chat data');
          router.push('/');
        }
      } catch (err) {
        console.error('Error fetching chat room:', err);
        setError('Failed to load chat. Please try again.');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();

    // Clean up on unmount
    return () => {
      socket.off("message");
      socket.off("user-joined");
      socket.off("typing");
      socket.disconnect();
    };
  }, [chatRoomId, router, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const typingTimeout = setTimeout(() => {
      setIsTyping(false);
    }, 1500);

    return () => clearTimeout(typingTimeout);
  }, [newMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (session?.user?._id) {
      socket.emit("typing", { 
        room: chatRoomId, 
        isTyping: e.target.value.length > 0,
        sender: session.user._id 
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session?.user) return;
    
    const tempId = Date.now().toString();
    try {
      // Optimistically add the message to the UI
      const tempMessage = {
        _id: tempId,
        content: newMessage,
        sender: {
          _id: session.user._id ??"",
          anonymousName: "You",
          image: session.user.image
        },
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      // Send via socket
      socket.emit("message", {
        room: chatRoomId,
        message: newMessage,
        sender: session.user._id
      });

      // Also send to API for persistence
      await axios.post(`/api/chat/${chatRoomId}`, {
        content: newMessage
      });
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      // Remove the optimistic message if there was an error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    }
  };

  const isMyMessage = (senderId: string) => {
    return senderId === session?.user?._id;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <img
              src={matchedUser?.image}
              alt="Chat partner"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-semibold text-white">
                {matchedUser?.anonymousName}
              </h3>
              <p className="text-sm text-green-400">
                {isTyping ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-center">
              {error}
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No messages yet</p>
                <p className="text-sm">Start the conversation by saying hello!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${isMyMessage(message.sender._id) ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                  {!isMyMessage(message.sender._id) && (
                    <img
                      src={message?.sender?.image}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isMyMessage(message.sender._id)
                        ? 'bg-purple-600 text-white rounded-br-sm'
                        : 'bg-gray-700 text-white rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Message ${matchedUser?.anonymousName || ''}`}
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;