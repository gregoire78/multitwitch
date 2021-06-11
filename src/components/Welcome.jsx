import React, { useState } from "react";
import PropTypes from "prop-types";
import { WidthProvider, Responsive } from "react-grid-layout";
import { useTranslation, Trans } from "react-i18next";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { faTwitch, faGithub } from "@fortawesome/free-brands-svg-icons";

library.add(faTwitch, faSignOutAlt, faGithub);
const ResponsiveReactGridLayout = WidthProvider(Responsive);

Welcome.propTypes = {
  isAuth: PropTypes.bool,
  user: PropTypes.any,
  logout: PropTypes.any,
  handleWindow: PropTypes.func,
};

export default function Welcome({ isAuth, user, logout, handleWindow }) {
  const { t, i18n } = useTranslation();
  const [layouts, setLayouts] = useState();
  const onLayoutChange = (layout, layouts) => {
    setLayouts(layouts);
  };
  return (
    <ResponsiveReactGridLayout
      isResizable={true}
      onDrag={(layout, oldItem, newItem, placeholder, e, element) => {
        element.style.cursor = "grabbing";
      }}
      onDragStop={(layout, oldItem, newItem, placeholder, e, element) => {
        element.style.cursor = "grab";
      }}
      compactType={null}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      preventCollision={true}
      cols={{ lg: 12, md: 12, sm: 6, xs: 6, xxs: 6 }}
      autoSize={true}
      layouts={layouts}
      onLayoutChange={onLayoutChange}
      isDraggable={true}
    >
      <div
        key="welcome"
        className="welcome"
        data-grid={{ x: 3, y: 1, w: 6, h: 3, minH: 3, minW: 6 }}
      >
        <h1>{t("title")}</h1>
        <p>
          <Trans
            i18nKey="description.part1"
            components={[
              <a
                key={0}
                href="https://twitch.tv/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "1em" }}
              ></a>,
            ]}
          />
          {/*<Trans i18nKey="description.part1">
                        In MultiTwitch.co you can watch a multi streams of <a href="https://twitch.tv/" target="_blank" rel="noopener noreferrer" style={{ fontSize: "1em" }}></a>.
                    </Trans>*/}
        </p>
        <p>
          <Trans
            i18nKey="description.part2"
            components={[
              <a
                key={0}
                href={`${window.location.origin}/peteur_pan/psykaoz`}
              ></a>,
            ]}
          />
        </p>
        <p style={{ textAlign: "center" }}>{t("description.part3")}</p>
        <p>{t("description.part4")}</p>

        {!isAuth ? (
          <button
            style={{
              display: "block",
            }}
            onClick={handleWindow}
            title={t("connect-button.title")}
          >
            <FontAwesomeIcon
              icon={["fab", "twitch"]}
              style={{ verticalAlign: "middle" }}
            />
            <span> {t("connect-button.text")}</span>
          </button>
        ) : (
          <div className="profile">
            <span>{t("description.part5")} </span>
            <span
              style={{
                background: "rgb(130, 107, 173)",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <img
                src={user?.profile_image_url}
                alt=""
                style={{
                  height: "21px",
                  verticalAlign: "top",
                  backgroundColor: "black",
                }}
              />
              <span> {user?.display_name} </span>
            </span>
            <span> {t("description.part6")} </span>
            <button onClick={logout}>
              <span>{t("logout-button.text")} </span>
              <FontAwesomeIcon icon="sign-out-alt" />
            </button>
          </div>
        )}
        <small>
          <Trans i18nKey="footer.part1" />
          <a
            href="https://github.com/gregoire78/multitwitch"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Trans
              i18nKey="footer.part2"
              components={[
                <FontAwesomeIcon key={0} icon={["fab", "github"]} />,
              ]}
            />
          </a>
          <Trans
            i18nKey="footer.part3"
            values={{
              year: new Date().getFullYear(),
              lng: i18n.language,
              version: __COMMIT_HASH__,
            }}
          />
          <select
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="lang-select"
            defaultValue={i18n.language}
          >
            {
              /*Object.keys(i18n.services.resourceStore.data)*/ [
                "en",
                "fr",
              ].map((lang) => (
                <option key={lang} value={lang} className="lang-option">
                  {lang.toUpperCase()}
                </option>
              ))
            }
          </select>
        </small>
      </div>
    </ResponsiveReactGridLayout>
  );
}
