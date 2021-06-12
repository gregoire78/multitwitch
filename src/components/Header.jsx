import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { CSSTransition } from "react-transition-group";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faTimes,
  faEdit,
  faSave,
  faPlus,
  faAngleDoubleRight,
  faAngleDoubleLeft,
  faSignOutAlt,
  faHandshake,
  faClock,
  faEye,
  faUser,
  faSyncAlt,
  faMagic,
} from "@fortawesome/free-solid-svg-icons";
import { faTwitch, faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import SearchBox from "./SearchBox";
import ReactTooltip from "react-tooltip";
import isEmpty from "lodash.isempty";
import map from "lodash.map";
import orderBy from "lodash.orderby";
import axios from "axios";
import process from "process";
import { withCookies } from "react-cookie";
import { useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

library.add(
  faTimes,
  faEdit,
  faSave,
  faPlus,
  faAngleDoubleRight,
  faAngleDoubleLeft,
  faTwitch,
  faSignOutAlt,
  faHandshake,
  faClock,
  faGithub,
  faEye,
  faUser,
  faSyncAlt,
  faMagic
);
dayjs.extend(utc);

function Header({
  isAuth,
  user,
  isEditMode,
  isCollapse,
  isAutoSize,
  setIsEditMode,
  handleSave,
  handleReset,
  handleAutoSize,
  onAddChannel,
  setIsCollapse,
  setIsOpened,
  cookies,
  logout,
}) {
  const { t } = useTranslation();
  const [streams, setStreams] = useState();

  useEffect(() => {
    if (isAuth) {
      getFollowedStream();
    }
  }, [getFollowedStream, isAuth]);

  useEffect(() => {
    if (isEditMode) ReactTooltip.rebuild();
  }, [isEditMode]);

  const getFollowedStream = useCallback(() => {
    axios
      .get(`https://api.twitch.tv/kraken/streams/followed`, {
        headers: {
          Accept: "application/vnd.twitchtv.v5+json",
          Authorization: `OAuth ${cookies.get("token")}`,
          "Client-ID": process.env.REACT_APP_TWITCH_CLIENTID,
        },
      })
      .then((res) => {
        const _streams = orderBy(res.data.streams, "channel.name");
        setStreams(_streams);
        ReactTooltip.rebuild();
      });
  }, [cookies]);

  return (
    <CSSTransition in={isCollapse} classNames="header" timeout={300}>
      <header>
        <nav>
          <SearchBox onAddChannel={onAddChannel} />
          <button onClick={handleSave} title={t("save-button.title")}>
            <FontAwesomeIcon icon="save" />
          </button>
          <button onClick={handleReset} title={t("reset-button.title")}>
            <FontAwesomeIcon icon="sync-alt" />
          </button>
          <button onClick={handleAutoSize} title={t("auto_size-button.title")}>
            <FontAwesomeIcon
              icon="magic"
              color={!isAutoSize ? "#cc8686" : ""}
            />
          </button>
          <button
            onClick={() => setIsCollapse((c) => !c)}
            className="collapse-btn"
          >
            <FontAwesomeIcon
              icon={isCollapse ? "angle-double-right" : "angle-double-left"}
            />
          </button>
          {isAuth ? (
            <button
              onClick={() => setIsCollapse((c) => !c)}
              className="img-profile"
            >
              <img src={user?.profile_image_url} height={24} alt="" />
            </button>
          ) : (
            <button
              title={t("connect-button.text")}
              onClick={() => setIsOpened(true)}
            >
              <FontAwesomeIcon icon={["fab", "twitch"]} />
            </button>
          )}
          <button
            onClick={() => setIsEditMode((e) => !e)}
            title={t("edit-button.title")}
          >
            <FontAwesomeIcon icon="edit" color={!isEditMode ? "#cc8686" : ""} />
          </button>
        </nav>

        {isAuth && isEditMode && (
          <nav className="streams">
            <p
              style={{
                textAlign: "center",
                background: "#b34646",
                cursor: "default",
                height: "24px",
              }}
            >
              <button
                onClick={() => {
                  logout().then(() => ReactTooltip.hide());
                }}
                title={t("logout-button.text")}
                style={{ position: "absolute", left: 0 }}
              >
                <FontAwesomeIcon icon="sign-out-alt" />
              </button>
              <span style={{ lineHeight: "24px" }}>{user?.display_name}</span>
            </p>
            {!isEmpty(streams) &&
              map(streams, (v, k) => {
                return (
                  <p
                    key={k}
                    //onClick={addFollow.bind(this, v.channel.name)}
                    data-for="status"
                    data-tip={JSON.stringify(v)}
                  >
                    <img alt="" height={22} src={v.channel.logo} />{" "}
                    <span className="stream-name">
                      {v.channel.display_name}
                    </span>
                  </p>
                );
              })}
          </nav>
        )}
        <ReactTooltip
          id="status"
          place="right"
          border={true}
          className="extraClass"
          getContent={(datumAsText) => {
            if (datumAsText == null) {
              return;
            }
            let v = JSON.parse(datumAsText);
            return (
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "start",
                  }}
                >
                  <img
                    style={{ display: "inline-block" }}
                    alt=""
                    src={`https://static-cdn.jtvnw.net/ttv-boxart/${v.game}-40x55.jpg`}
                  />
                  <div
                    style={{
                      lineHeight: "16px",
                      margin: "0 0 0 5px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <b style={{ display: "block" }}>{v.channel.status}</b>
                    {v.game} - {v.channel.broadcaster_language.toUpperCase()}
                    {v.channel.mature ? " - 🔞" : ""}
                    <br />
                    <small>
                      <FontAwesomeIcon icon="clock" />{" "}
                      {`${dayjs
                        .utc(dayjs() - dayjs(v.created_at))
                        .format("HH[h]mm")}`}{" "}
                      - <FontAwesomeIcon icon="user" />{" "}
                      {v.viewers.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                      })}
                    </small>
                  </div>
                </div>
                <img
                  style={{ display: "block" }}
                  alt=""
                  src={v.preview.small}
                />
              </div>
            );
          }}
        />
      </header>
    </CSSTransition>
  );
}

Header.propTypes = {
  isAuth: PropTypes.bool,
  user: PropTypes.any,
  isEditMode: PropTypes.bool,
  isCollapse: PropTypes.bool,
  isAutoSize: PropTypes.bool,
  setIsEditMode: PropTypes.func,
  handleSave: PropTypes.func,
  handleReset: PropTypes.func,
  handleAutoSize: PropTypes.func,
  onAddChannel: PropTypes.func,
  setIsCollapse: PropTypes.func,
  setIsOpened: PropTypes.func,
  cookies: PropTypes.any,
  logout: PropTypes.func,
};

export default withCookies(Header);
