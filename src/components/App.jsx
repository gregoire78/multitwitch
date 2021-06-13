import React, { Suspense, useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import uniqBy from "lodash.uniqby";
import compact from "lodash.compact";
import reject from "lodash.reject";
import map from "lodash.map";
import { withCookies } from "react-cookie";
import { WidthProvider, Responsive } from "react-grid-layout";
import Welcome from "./Welcome";
import generateLayout from "./gridLayout";
import NewWindow from "react-new-window";
import process from "process";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import axios from "axios";

import "/node_modules/react-resizable/css/styles.css";
import "/node_modules/react-grid-layout/css/styles.css";
import "./App.css";
import Header from "./Header";
import GridTwitch from "./GridTwitch";

const ResponsiveGridLayout = WidthProvider(Responsive);
dayjs.extend(duration);

function App({ cookies }) {
  const [channels, setChannels] = useState();
  const [layout, setLayout] = useState();
  const [showOverlay, setShowOverlay] = useState();
  const [isAutoSize, setIsAutoSize] = useState(getFromLS("auto_size") ?? true);
  const [isCollapse, setIsCollapse] = useState();
  const [isEditMode, setIsEditMode] = useState(true);
  const [layouts, setLayouts] = useState();
  const [isOpened, setIsOpened] = useState(false);
  const [isAuth, setIsAuth] = useState(!!cookies.get("token"));
  const [user, setUser] = useState();

  useEffect(() => {
    if (getFromLS("version") !== __COMMIT_HASH__) {
      localStorage.clear();
      saveToLS("version", __COMMIT_HASH__);
    }

    getTwitchUser();
    const urlparse = uniqBy(compact(window.location.pathname.split("/")));
    const url = JSON.parse(JSON.stringify(getFromLS("channels") || []));
    setLayouts(JSON.parse(JSON.stringify(getFromLS("layouts") || {})));
    if (urlparse.length !== 0) {
      setChannels(urlparse);
      setLayout(generateLayout(urlparse));
    } else {
      setChannels(url);
      setLayout(generateLayout(url));
    }
  }, [cookies, getTwitchUser]);

  useEffect(() => {
    saveToLS("auto_size", isAutoSize);
  }, [isAutoSize]);

  useEffect(() => {
    if (channels) {
      window.history.replaceState(
        "",
        "",
        `${window.origin}/${channels.join("/")}`
      );
    }
  }, [channels]);

  const onLayoutChange = (layout, layouts) => {
    setLayouts(layouts);
  };

  const getTwitchUser = useCallback(async () => {
    const _token = cookies.get("token");
    if (_token) {
      try {
        const twitchUser = (
          await axios.get(`https://api.twitch.tv/helix/users`, {
            headers: {
              Authorization: `Bearer ${_token}`,
              "Client-ID": process.env.TWITCH_CLIENTID,
            },
          })
        ).data;
        if (twitchUser) {
          setIsAuth(true);
          setUser(twitchUser.data[0]);
        }
      } catch (error) {
        setUser();
        setIsAuth(false);
        cookies.remove("token", { domain: window.location.hostname });
      }
    }
  }, [cookies]);

  const logout = async () => {
    await axios.post(
      `https://id.twitch.tv/oauth2/revoke?client_id=${
        process.env.TWITCH_CLIENTID
      }&token=${cookies.get("token")}`
    );
    setIsAuth(false);
    setUser();
    cookies.remove("token", { domain: window.location.hostname });
  };

  const onResize = (
    layout,
    oldLayoutItem,
    layoutItem,
    placeholder,
    e,
    element
  ) => {
    element.style.cursor = "se-resize";
  };

  const onDragStart = (layout, oldItem, newItem, placeholder, e, element) => {
    setShowOverlay(true);
    element.style.cursor = "grabbing";
  };

  const onDragStop = (layout, oldItem, newItem, placeholder, e, element) => {
    setShowOverlay(false);
    //element.style.cursor = "grab";
    element.style.cursor = "move";
  };

  const onRemoveItem = (l) => {
    let pseudos = reject(channels, (value) => value === l.channel);
    setChannels(pseudos);

    // open menu if all close
    if (pseudos.length === 0) {
      setIsCollapse(false);
      setIsEditMode(true);
    }

    // reset mode layout
    if (isAutoSize) {
      setLayouts({});
      setLayout(generateLayout(pseudos));
    } else {
      setLayout((la) => reject(la, { i: l.i }));
    }
  };

  return (
    <>
      {isOpened && (
        <NewWindow
          onUnload={() => {
            getTwitchUser();
            setIsOpened(false);
          }}
          url={`https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENTID}&redirect_uri=${window.location.origin}/redirect&response_type=token&scope=user_read`}
          features={{
            left: window.innerWidth / 2 - 600 / 2,
            top: window.innerHeight / 2 - 600 / 2,
            width: 600,
            height: 600,
          }}
        >
          <h5 style={{ color: "white" }}>Connecting to twitch id</h5>
        </NewWindow>
      )}
      <Suspense fallback="">
        <Header
          isAuth={isAuth}
          user={user}
          isEditMode={isEditMode}
          isCollapse={isCollapse}
          isAutoSize={isAutoSize}
          setIsEditMode={setIsEditMode}
          setIsOpened={setIsOpened}
          setIsCollapse={setIsCollapse}
          handleSave={() => {
            saveToLS("layouts", layouts);
            saveToLS("channels", channels);
          }}
          handleReset={() => {
            setLayouts({});
            setLayout(generateLayout(channels));
          }}
          handleAutoSize={() => {
            setIsAutoSize((r) => {
              saveToLS("auto_size", !r);
              return !r;
            });
          }}
          onAddChannel={(channel) => {
            if (isAutoSize) {
              setLayouts({});
            }
            setLayout(generateLayout(uniqBy([...channels, channel])));
            setChannels((c) => uniqBy([...c, channel]));
          }}
          logout={logout}
        />
      </Suspense>

      {layouts && channels && channels.length > 0 ? (
        <ResponsiveGridLayout
          margin={[5, 5]}
          containerPadding={[5, 5]}
          onLayoutChange={onLayoutChange}
          onResize={onResize}
          layouts={layouts}
          onResizeStart={() => setShowOverlay(true)}
          onResizeStop={() => setShowOverlay(false)}
          onDrag={onDragStart}
          onDragStop={onDragStop}
          isDraggable={true}
          isResizable={true}
          rowHeight={10}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          preventCollision={false}
          autoSize={true}
          verticalCompact={true}
          compactType={"vertical"}
          measureBeforeMount={true}
        >
          {map(layout, (l) => (
            <div
              key={l.i}
              data-grid={l}
              style={
                isEditMode && {
                  padding: "5px",
                  outline: "5px dashed #5a3a93",
                  outlineOffset: "-5px",
                  cursor: "move",
                }
              }
            >
              <GridTwitch
                isEditMode={isEditMode}
                showOverlay={showOverlay}
                layout={l}
                onRemoveItem={onRemoveItem}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      ) : (
        <Suspense fallback="">
          <Welcome
            isAuth={isAuth}
            user={user}
            logout={logout}
            handleWindow={() => setIsOpened(true)}
          />
        </Suspense>
      )}
    </>
  );
}

App.propTypes = {
  cookies: PropTypes.any,
};

function getFromLS(key) {
  let ls = {};
  if (window.localStorage) {
    ls = JSON.parse(window.localStorage.getItem("multitwitch_" + key));
  }
  return ls;
}

function saveToLS(key, value) {
  if (window.localStorage) {
    window.localStorage.setItem("multitwitch_" + key, JSON.stringify(value));
  }
}

export default withCookies(App);
