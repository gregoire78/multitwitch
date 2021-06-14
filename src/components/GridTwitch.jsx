import React, { useState, Fragment } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faComment, faCommentSlash } from "@fortawesome/free-solid-svg-icons";
import Twitch from "./Twitch";
library.add(faComment, faCommentSlash);

function GridTwitch({ isEditMode, layout, showOverlay, onRemoveItem }) {
  const [isVideoWChat, setIsVideoWChat] = useState(true);
  return (
    <Fragment>
      <div
        className="header-player"
        style={{ marginTop: isEditMode ? "5px" : "0" }}
      >
        {isEditMode && layout.channel}
      </div>
      <Twitch
        style={{ height: "calc(100%)", width: "calc(100%)" }}
        channel={layout.channel}
        targetID={`twitch-embed-${layout.channel}`}
        layout={isVideoWChat ? "video-with-chat" : "video"}
      />
      <div
        className="overlay"
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          right: 0,
          display: showOverlay ? "block" : "none",
        }}
      ></div>
      <button
        className="remove"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          cursor: "pointer",
          color: "rgba(255, 255, 255, 0.6)",
          backgroundColor: isEditMode ? "#5a3a93" : "transparent",
          border: "none",
          width: "20px",
          height: "20px",
        }}
        onClick={() => onRemoveItem(layout)}
        onTouchStartCapture={(e) => {
          e.stopPropagation();
        }}
      >
        <FontAwesomeIcon icon="times" />
      </button>
      {isEditMode && (
        <button
          className="chat"
          style={{
            position: "absolute",
            right: 0,
            top: 20,
            cursor: "pointer",
            color: "rgba(255, 255, 255, 0.6)",
            backgroundColor: "#6441A4",
            border: "none",
            width: "20px",
            height: "20px",
            padding: 0,
          }}
          onClick={() => setIsVideoWChat((v) => !v)}
          onTouchStartCapture={(e) => {
            e.stopPropagation();
          }}
        >
          <FontAwesomeIcon icon={isVideoWChat ? "comment-slash" : "comment"} />
        </button>
      )}
    </Fragment>
  );
}

GridTwitch.propTypes = {
  isEditMode: PropTypes.bool,
  layout: PropTypes.any,
  showOverlay: PropTypes.bool,
  onRemoveItem: PropTypes.func,
};

export default GridTwitch;
