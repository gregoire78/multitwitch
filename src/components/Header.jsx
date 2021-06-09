import React, { useState } from "react";
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
import { useTranslation, Trans } from "react-i18next";
import isEmpty from "lodash.isempty";
import map from "lodash.map";
import SearchBox from "./SearchBox";

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

function Header({
  isEditMode,
  isCollapse,
  isAutoSize,
  setIsEditMode,
  handleSave,
  handleReset,
  handleAutoSize,
  onAddChannel,
  setIsCollapse,
}) {
  const { t, i18n } = useTranslation();

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
          {
            <button title={t("connect-button.text")}>
              <FontAwesomeIcon icon={["fab", "twitch"]} />
            </button>
          }
          <button
            onClick={() => setIsEditMode((e) => !e)}
            title={t("edit-button.title")}
          >
            <FontAwesomeIcon icon="edit" color={!isEditMode ? "#cc8686" : ""} />
          </button>
        </nav>

        {/*isAuth && isEditMode && (
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
                  this.logout().then(() => ReactTooltip.hide());
                }}
                title={t("logout-button.text")}
                style={{ position: "absolute", left: 0 }}
              >
                <FontAwesomeIcon icon="sign-out-alt" />
              </button>
              <span style={{ lineHeight: "24px" }}>{user.display_name}</span>
            </p>
            {!isEmpty(streams) &&
              map(streams, (v, k) => {
                return (
                  <p
                    key={k}
                    onClick={this.addFollow.bind(this, v.channel.name)}
                    data-for="status"
                    data-tip={JSON.stringify(v)}
                  >
                    <img alt="" height={22} src={v.channel.logo} />{" "}
                    {v.channel.display_name}
                  </p>
                );
              })}
          </nav>
            )*/}
      </header>
    </CSSTransition>
  );
}

export default Header;
