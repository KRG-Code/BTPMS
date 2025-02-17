// src/components/common/Loading.js
import React from "react";
import "./Loading.css"; // Create a separate CSS file for styles

const Loading = ({ type = "spinner" }) => {
  return (
    <div className="loading-wrapper">
      {type === "bar" && (
        <div className="loading-bar-compact-container">
        <div className="loading-bar-compact"></div>
      </div>
      )}
        
      {type === "spinner" && (
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
        </div>
      )}

      {type === "pulse" && (
        <div className="loading-pulse-container">
          <div className="loading-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default Loading;
