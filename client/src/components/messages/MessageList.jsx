import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function MessageList() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please log in to view messages.");
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(response.data.messages);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Error fetching messages.");
      }
    };

    fetchMessages();
  }, []);

  return (
    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 z-50 TopNav">
      <h2 className="font-bold mb-2">Messages</h2>
      {loading ? (
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin h-5 w-5 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : messages.length === 0 ? (
        <p>No new messages</p>
      ) : (
        <ul className="space-y-2">
          {messages.map((message) => (
            <li key={message._id} className="p-2 bg-gray-100 rounded">
              {message.content}{" "}
              <span className="text-sm text-gray-500">
                - {new Date(message.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
