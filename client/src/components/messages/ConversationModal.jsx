import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { RiUser3Line, RiEmotionLine } from "react-icons/ri";
import io from 'socket.io-client';
import RTCManager from './RTCManager';
import EmojiPicker from 'emoji-picker-react';

export default function ConversationModal({ conversation, onClose, onNewMessage }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [rtcManager, setRtcManager] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Add refresh interval reference
  const refreshIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const checkUserId = () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        // If userId is not in localStorage, try to get it from the token
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.id) {
              localStorage.setItem("userId", payload.id);
            }
          } catch (error) {
            console.error("Error parsing token:", error);
          }
        }
      }
    };

    checkUserId();
    fetchMessages();
  }, [conversation._id]);

  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_API_URL, {
      auth: { token: localStorage.getItem("token") },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      socketInstance.emit('joinConversation', conversation._id);
    });

    socketInstance.on('messageReceived', (newMsg) => {
      console.log('New message received:', newMsg);
      if (newMsg.conversationId === conversation._id) {
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(msg => msg._id === newMsg._id);
          if (!messageExists) {
            onNewMessage(); // Call this to update the conversation list
            scrollToBottom();
            return [...prevMessages, newMsg];
          }
          return prevMessages;
        });
      }
    });

    setSocket(socketInstance);
    fetchMessages();

    return () => {
      if (socketInstance) {
        socketInstance.off('messageReceived');
        socketInstance.emit('leaveConversation', conversation._id);
        socketInstance.disconnect();
      }
    };
  }, [conversation._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll when messages update

  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 500);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [conversation._id]); // Remove showEmojiPicker from dependencies

  // Modify fetchMessages to avoid unnecessary UI updates
  const fetchMessages = async () => {
    // Skip fetching messages for temporary conversations
    if (conversation.temporary) {
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/messages/conversations/${conversation._id}/messages`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      
      // Compare with current messages to avoid unnecessary updates
      const newMessages = response.data.messages;
      const currentMessagesIds = new Set(messages.map(m => m._id));
      const hasNewMessages = newMessages.some(msg => !currentMessagesIds.has(msg._id));
      
      if (hasNewMessages) {
        setMessages(newMessages);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Don't show error toast on auto-refresh to avoid spam
      if (!refreshIntervalRef.current) {
        toast.error("Error fetching messages.");
      }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    try {
      // If this is a new conversation, create it first
      if (conversation.temporary) {
        const convResponse = await axios.post(
          `${process.env.REACT_APP_API_URL}/messages/conversations`,
          { participantId: conversation.participants[1]._id },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        conversation._id = convResponse.data.conversation._id;
        delete conversation.temporary;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/messages`,
        {
          conversationId: conversation._id,
          content: messageContent,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // Add the message to the UI immediately
      setMessages(prevMessages => [...prevMessages, response.data.message]);
      if (onNewMessage) onNewMessage();
      scrollToBottom();
    } catch (error) {
      toast.error("Error sending message.");
      setNewMessage(messageContent); // Restore message if failed
    }
  };

  const isCurrentUserMessage = (message) => {
    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) return false;

    // Ensure we're comparing strings and handling nested objects
    const messageUserId = (message.userId?._id || message.userId)?.toString();
    return messageUserId === currentUserId.toString();
  };

  const getOtherParticipant = () => {
    const currentUserId = localStorage.getItem("userId");
    return conversation.participants.find(
      p => p._id?.toString() !== currentUserId?.toString()
    );
  };

  useEffect(() => {
    const currentUserId = localStorage.getItem("userId");
    console.log("Current user ID:", currentUserId);
    console.log("Messages:", messages);
    console.log("Conversation participants:", conversation.participants);
  }, [messages, conversation]);

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
    // Remove the refresh interval restart since it's now always running
  };

  // Add this function near your other functions
  const getEmojiPickerPosition = () => {
    const viewportHeight = window.innerHeight;
    const emojiHeight = 400; // Height of emoji picker
    const buttonPosition = document.querySelector('.emoji-button')?.getBoundingClientRect();
    
    if (!buttonPosition) return 'bottom-14';
    
    // Check if there's enough space below
    const spaceBelow = viewportHeight - buttonPosition.bottom;
    const spaceAbove = buttonPosition.top;
    
    // Return appropriate position class
    if (spaceBelow >= emojiHeight) {
      return 'bottom-14';
    }
    return 'top-14';
  };

  useEffect(() => {
    // Add this function to mark messages as read
    const markConversationAsRead = async () => {
      if (!conversation.temporary) {
        try {
          await axios.post(
            `${process.env.REACT_APP_API_URL}/messages/conversations/${conversation._id}/read`,
            {},
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          );
          onNewMessage(); // Update conversation list to reflect read status
        } catch (error) {
          console.error("Error marking conversation as read:", error);
        }
      }
    };

    // Call it when modal opens and after receiving new messages
    markConversationAsRead();
  }, [conversation._id, messages]); // Run when messages update or conversation changes

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-[30px] w-[500px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center TopNav rounded-t-[30px]">
          {(() => {
            const receiver = getOtherParticipant();
            return (
              <div className="flex items-center ">
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex items-center justify-center">
                  {receiver?.profilePicture ? (
                    <img
                      src={receiver.profilePicture}
                      alt={`${receiver.firstName}'s profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <RiUser3Line className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold">
                    {receiver?.firstName} {receiver?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {receiver?.userType}
                  </p>
                </div>
              </div>
            );
          })()}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {messages.length > 0 ? (
              messages.map((message) => {
                const isSender = isCurrentUserMessage(message);
                console.log("Message:", message, "IsSender:", isSender);
                return (
                  <div
                    key={message._id}
                    className={`flex items-end gap-2 ${
                      isSender ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl max-w-[70%] break-words ${
                        isSender
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-gray-200 text-black rounded-bl-sm'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No messages yet</p>
                <p className="text-sm">Start the conversation by sending a message!</p>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t TopNav relative rounded-b-[30px]">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border rounded-full px-4 py-2 text-black"
              placeholder="Type a message..."
            />
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 emoji-button"
              >
                <RiEmotionLine className="w-6 h-6" />
              </button>
              
              {showEmojiPicker && (
                <div className="fixed bottom-4 right-4" style={{ transform: 'translateY(-100%)', zIndex: 9999 }}>
                  <div className="shadow-xl rounded-lg">
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      width={300}
                      height={400}
                      searchDisabled={false}
                      skinTonesDisabled={true}
                      previewConfig={{
                        showPreview: false
                      }}
                      categories={[
                        'suggested',
                        'smileys_people',
                        'animals_nature',
                        'food_drink',
                        'travel_places',
                        'activities',
                        'objects',
                        'symbols',
                        'flags'
                      ]}
                      searchPlaceholder="Search emojis..."
                      theme="light"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
