import React, { Fragment, lazy, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faComment, faCommentSlash } from "@fortawesome/free-solid-svg-icons";
import { useRef } from "react";
const Twitch = lazy(() => import("./Twitch"));
library.add(faComment, faCommentSlash);

function GridTwitch({
  isEditMode,
  layout,
  showOverlay,
  onRemoveItem,
  channelSettings,
  handleSettings,
  length,
}) {
  const [chat, setChat] = useState(
    channelSettings?.chat ?? layout?.chat ?? true
  );
  const p = useRef();
  const isMounted = useRef(false);

  useEffect(() => {
    if (!channelSettings) {
      handleSettings(layout.channel, {
        chat: layout?.chat ?? true,
        quality: layout?.quality ?? "auto",
        muted: layout?.muted ?? false,
      });
      isMounted.current = true;
    }
    return () => (isMounted.current = false);
  }, [
    channelSettings,
    handleSettings,
    layout.channel,
    layout?.chat,
    layout?.muted,
    layout?.quality,
  ]);

  useEffect(() => {
    if (p.current && channelSettings) {
      setChat(channelSettings?.chat);
      //p.current.setVolume(channelSettings?.muted ? 0 : 0.5);
      p.current.setQuality(channelSettings?.quality ?? "auto");
    }
  }, [channelSettings, length]);

  const handleChat = () => {
    const g = !chat;
    setChat(g);
    handleSettings(layout.channel, {
      chat: g,
      quality: layout?.quality ?? "auto",
      muted: layout?.muted ?? false,
    });
  };
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
        layout={chat ? "video-with-chat" : "video"}
        onPlayerReady={(player) => {
          //player.setVolume(layout?.muted ? 0 : 0.5);
          player.setQuality(layout?.quality ?? "auto");
          p.current = player;
        }}
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
          onClick={handleChat}
          onTouchStartCapture={(e) => {
            e.stopPropagation();
          }}
        >
          <FontAwesomeIcon icon={chat ? "comment-slash" : "comment"} />
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
  showChat: PropTypes.bool,
  channelSettings: PropTypes.any,
  handleSettings: PropTypes.any,
  length: PropTypes.any,
};

export default GridTwitch;
