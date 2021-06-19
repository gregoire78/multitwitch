import React, { useCallback, useState, lazy, Suspense } from "react";
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
  faDownload,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { faTwitch, faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
const SearchBox = lazy(() => import("./SearchBox"));
const DynamicTooltip = lazy(() => import("./ToolTipChannel"));
import ReactTooltip from "react-tooltip";
import axios from "axios";
import process from "process";
import { withCookies } from "react-cookie";
import { useEffect } from "react";
import useInterval from "use-interval";

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
  faMagic,
  faDownload,
  faTrash
);

function Header({
  isAuth,
  user,
  saves,
  isEditMode,
  isCollapse,
  isAutoSize,
  handleEditMode,
  handleSave,
  handleLoadSave,
  handleDeleteSave,
  handleReset,
  handleAutoSize,
  onAddChannel,
  setIsCollapse,
  handleWindow,
  cookies,
  logout,
  disabledSave,
}) {
  const { t } = useTranslation();
  const [streams, setStreams] = useState();
  const [orderBy, setOrderBy] = useState();

  useEffect(() => {
    if (!isCollapse && isEditMode && isAuth) {
      getOrderBy();
    }
  }, [isAuth, isEditMode, isCollapse, getOrderBy]);

  useEffect(() => {
    if (isEditMode || saves?.channels?.length > 0 || streams?.length > 0)
      ReactTooltip.rebuild();
  }, [isEditMode, saves, streams]);

  useInterval(
    () => getFollowedStream(orderBy),
    orderBy && !isCollapse && isEditMode && isAuth ? 10000 : null,
    false
  );

  const getOrderBy = useCallback(() => {
    if (!orderBy) {
      import("lodash.orderby").then((module) => {
        setOrderBy(() => {
          getFollowedStream(module.default);
          return module.default;
        });
      });
    } else getFollowedStream(orderBy);
  }, [orderBy, getFollowedStream]);

  const getFollowedStream = useCallback(
    (orderBy) => {
      axios
        .get(`https://api.twitch.tv/kraken/streams/followed`, {
          headers: {
            Accept: "application/vnd.twitchtv.v5+json",
            Authorization: `OAuth ${cookies.get("token")}`,
            "Client-ID": process.env.TWITCH_CLIENTID,
          },
        })
        .then((res) => {
          setStreams(orderBy(res.data.streams, "channel.name"));
        })
        .catch(() => setStreams());
    },
    [cookies]
  );

  const handleCollapse = () => setIsCollapse((c) => !c);

  return (
    <CSSTransition in={isCollapse} classNames="header" timeout={300}>
      <header>
        <nav>
          <SearchBox onAddChannel={onAddChannel} />
          <button
            onClick={handleSave}
            disabled={disabledSave}
            title={t("save-button.title")}
          >
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
            onClick={handleCollapse}
            title={t("collapse-button.title")}
            className="collapse-btn"
          >
            <FontAwesomeIcon
              icon={isCollapse ? "angle-double-right" : "angle-double-left"}
            />
          </button>
          {isAuth ? (
            <button onClick={handleCollapse} className="img-profile">
              <img
                src={user?.profile_image_url}
                height={24}
                width={24}
                alt="profile"
              />
            </button>
          ) : (
            <button title={t("connect-button.text")} onClick={handleWindow}>
              <FontAwesomeIcon icon={["fab", "twitch"]} />
            </button>
          )}
          <button onClick={handleEditMode} title={t("edit-button.title")}>
            <FontAwesomeIcon icon="edit" color={!isEditMode ? "#cc8686" : ""} />
          </button>
        </nav>
        {saves?.channels?.length > 0 && (
          <nav
            className="saves"
            style={{ display: isEditMode ? "block" : "none" }}
          >
            <div className="items-saves">
              <span
                className="text"
                data-for="saves"
                data-tip={JSON.stringify(saves.channels)}
              >
                {saves.channels.length} {t("menu.save")}
              </span>
              <div className="buttons">
                <button
                  onClick={handleLoadSave}
                  title={t("load_save-button.title")}
                >
                  <FontAwesomeIcon icon="download" />
                </button>
                <button
                  onClick={handleDeleteSave}
                  title={t("delete_save-button.title")}
                >
                  <FontAwesomeIcon icon="trash" />
                </button>
              </div>
            </div>
          </nav>
        )}

        {isAuth && (
          <nav
            className="streams"
            style={{ display: isEditMode ? "block" : "none" }}
          >
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
              <span className="twitch-pseudo">{user?.display_name}</span>
            </p>
            {streams?.length > 0 && (
              <div className="stream-list">
                {streams.map((v) => {
                  return (
                    <p
                      key={v.channel.name}
                      onClick={() => onAddChannel(v.channel.name)}
                      data-for="status"
                      data-tip={JSON.stringify(v)}
                    >
                      <img alt="" height={22} width={22} src={v.channel.logo} />
                      <span className="stream-name">
                        {v.channel.display_name}
                      </span>
                    </p>
                  );
                })}
              </div>
            )}
          </nav>
        )}
        <ReactTooltip
          id="saves"
          place="bottom"
          border={true}
          className="extraClass"
          getContent={(channels) => {
            if (channels == null) {
              return;
            }
            let v = JSON.parse(channels);
            return (
              <div>
                {v.map((channel) => (
                  <p style={{ margin: 0, fontSize: "15px" }} key={channel}>
                    {channel}
                  </p>
                ))}
              </div>
            );
          }}
        />
        <Suspense fallback="">
          <DynamicTooltip FontAwesomeIcon={FontAwesomeIcon} />
        </Suspense>
      </header>
    </CSSTransition>
  );
}

Header.propTypes = {
  isAuth: PropTypes.bool,
  user: PropTypes.any,
  saves: PropTypes.any,
  isEditMode: PropTypes.bool,
  isCollapse: PropTypes.bool,
  isAutoSize: PropTypes.bool,
  handleEditMode: PropTypes.func,
  handleSave: PropTypes.func,
  handleLoadSave: PropTypes.func,
  handleDeleteSave: PropTypes.func,
  handleReset: PropTypes.func,
  handleAutoSize: PropTypes.func,
  onAddChannel: PropTypes.func,
  setIsCollapse: PropTypes.func,
  handleWindow: PropTypes.func,
  cookies: PropTypes.any,
  logout: PropTypes.func,
  disabledSave: PropTypes.bool,
};

export default withCookies(Header);
