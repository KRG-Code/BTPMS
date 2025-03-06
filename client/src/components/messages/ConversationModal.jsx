import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { RiUser3Line } from "react-icons/ri";
import io from 'socket.io-client';

export default function ConversationModal({ conversation, onClose, onNewMessage }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [socket, setSocket] = useState(null);

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
    scrollToBottom();
  }, [conversation._id, messages.length]);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL);
    setSocket(newSocket);

    // Join conversation room
    newSocket.emit('joinConversation', conversation._id);

    // Listen for new messages
    newSocket.on('messageReceived', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    return () => {
      newSocket.emit('leaveConversation', conversation._id);
      newSocket.disconnect();
    };
  }, [conversation._id]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/messages/conversations/${conversation._id}/messages`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Error fetching messages.");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/messages`,
        {
          conversationId: conversation._id,
          content: newMessage,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setNewMessage("");
      onNewMessage();
    } catch (error) {
      toast.error("Error sending message.");
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg w-[500px] max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center TopNav">
          {(() => {
            const receiver = getOtherParticipant();
            return (
              <div className="flex items-center">
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

        <form onSubmit={sendMessage} className="p-4 border-t TopNav">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="Type a message..."
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
