import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { RiUser3Line } from "react-icons/ri";
import ConversationModal from "./ConversationModal";

export default function MessageList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tanods, setTanods] = useState([]);
  const [showTanodList, setShowTanodList] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to view messages.");
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data.conversations);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Error fetching conversations.");
    }
  };

  const handleStartNewChat = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const currentUserId = localStorage.getItem("userId");
      const currentUserType = localStorage.getItem("userType");
      
      // Filter users based on user type
      const availableUsers = response.data.filter(user => {
        // Always exclude self
        if (user._id === currentUserId) return false;
        
        // If current user is admin, show only tanods
        if (currentUserType === 'admin') return user.userType === 'tanod';
        
        // If current user is tanod, show only admin
        if (currentUserType === 'tanod') return user.userType === 'tanod'|| user.userType === 'admin';
        
        return false;
      });
      
      setTanods(availableUsers);
      setShowTanodList(true);
    } catch (error) {
      toast.error("Error fetching users.");
    }
  };

  const startConversation = async (tanodId) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/messages/conversations`,
        { participantId: tanodId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setShowTanodList(false);
      setSelectedConversation(response.data.conversation);
      setShowModal(true);
      fetchConversations();
    } catch (error) {
      toast.error("Error starting conversation.");
    }
  };

  const deleteConversation = async (conversationId, e) => {
    e.stopPropagation(); // Prevent opening the conversation modal
    
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/messages/conversations/${conversationId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        toast.success("Conversation deleted successfully");
        fetchConversations();
      } catch (error) {
        toast.error("Error deleting conversation");
      }
    }
  };

  return (
    <>
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg p-4 z-50 TopNav">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold">Messages</h2>
          <button
            onClick={handleStartNewChat}
            className="text-blue-500 hover:text-blue-700"
          >
            New Chat
          </button>
        </div>

        {showTanodList ? (
          <div className="mt-2 text-black">
            <h3 className="font-semibold mb-2">Select User</h3>
            {tanods.length > 0 ? (
              <ul className="space-y-2">
                {tanods.map((user) => (
                  <li
                    key={user._id}
                    onClick={() => startConversation(user._id)}
                    className="p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 flex items-center"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-2 bg-gray-200 flex items-center justify-center">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={`${user.firstName}'s profile`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <RiUser3Line className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.userType}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No users available</p>
            )}
            <button
              onClick={() => setShowTanodList(false)}
              className="mt-2 text-sm text-blue-500"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin h-5 w-5 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">No conversations yet</p>
                <p className="text-sm text-gray-400">
                  Start a new chat with a tanod!
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {conversations.map((conv) => {
                  const otherParticipant = conv.participants.find(
                    p => p._id !== localStorage.getItem("userId")
                  );
                  
                  return (
                    <li
                      key={conv._id}
                      onClick={() => {
                        setSelectedConversation(conv);
                        setShowModal(true);
                      }}
                      className="p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
                          {otherParticipant?.profilePicture ? (
                            <img
                              src={otherParticipant.profilePicture}
                              alt={`${otherParticipant.firstName}'s profile`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <RiUser3Line className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold text-black">
                              {otherParticipant?.firstName} {otherParticipant?.lastName}
                            </p>
                            <button
                              onClick={(e) => deleteConversation(conv._id, e)}
                              className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded"
                            >
                              Delete
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {conv.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      {showModal && selectedConversation && (
        <ConversationModal
          conversation={selectedConversation}
          onClose={() => setShowModal(false)}
          onNewMessage={fetchConversations}
        />
      )}
    </>
  );
}
