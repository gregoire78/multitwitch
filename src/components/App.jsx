import React, { Suspense, useCallback, useEffect, useState, lazy } from "react";
import PropTypes from "prop-types";
import uniqBy from "lodash.uniqby";
import compact from "lodash.compact";
import reject from "lodash.reject";
import transform from "lodash.transform";
import omit from "lodash.omit";
import merge from "lodash.merge";
import isEqual from "lodash.isequal";
import { withCookies } from "react-cookie";
import { WidthProvider, Responsive } from "react-grid-layout";
import NewWindow from "react-new-window";
import process from "process";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import axios from "axios";
import ReactGA from "react-ga";
import { useMatomo } from "@datapunt/matomo-tracker-react";
const Header = lazy(() => import("./Header"));
import "/node_modules/react-resizable/css/styles.css";
import "/node_modules/react-grid-layout/css/styles.css";
import "./App.css";

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
  const [saves, setSaves] = useState();
  const [generateLayout, setGenerateLayout] = useState();
  const { trackPageView, trackEvent } = useMatomo();
  const [DynamicWelcome, setDynamicWelcome] = useState();
  const [DynamicGridTwitch, setDynamicGridTwitch] = useState();

  useEffect(() => {
    ReactGA.initialize(process.env.GTAG_ID, {
      debug: process.env.NODE_ENV !== "production",
    });
    const version = getFromLS("version");
    if (version !== __COMMIT_HASH__) {
      if (!["44a68ce"].includes(version)) {
        localStorage.clear();
      }
      saveToLS("version", __COMMIT_HASH__);
    }

    getTwitchUser();
    const urlparse = uniqBy(
      compact(window.location.pathname.split("/").map((v) => v.toLowerCase()))
    );
    const layoutsSaved = JSON.parse(JSON.stringify(getFromLS("layouts") || {}));
    const channelsSaved = JSON.parse(
      JSON.stringify(getFromLS("channels") || [])
    );
    if (channelsSaved.length > 0 || urlparse.length > 0) {
      setSaves({ channels: channelsSaved, layouts: layoutsSaved });
      if (urlparse.length > 0) {
        setChannels(urlparse);
      } else {
        setChannels(channelsSaved);
      }
    } else setChannels([]);
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
      ReactGA.pageview(window.location.pathname);
      trackPageView();
    }
  }, [channels, trackPageView]);

  useEffect(() => {
    if (channels) {
      setDynamicWelcome((dw) => {
        if (channels.length === 0 && !dw) {
          return lazy(() => import("./Welcome"));
        }
        return dw;
      });
      setDynamicGridTwitch((dgt) => {
        if (channels.length > 0 && !dgt) {
          return lazy(() => import("./GridTwitch"));
        }
        return dgt;
      });
      martin(channels);
    }
  }, [channels, martin]);

  const martin = useCallback(
    async (channels) => {
      setLayouts((la) => {
        const isSameAsSaved = isEqual(channels.sort(), saves?.channels.sort());
        return !isAutoSize
          ? merge({}, la, isSameAsSaved && saves?.layouts)
          : transform(
              isSameAsSaved ? saves?.layouts : {},
              (result, value, key) => {
                const d = value.filter(
                  ({ i }) => !channels.some((v) => v.i === i)
                );
                if (d.length > 0) result[key] = d;
                else omit(result, key);
              }
            );
      });
      if (channels.length > 0) {
        let mo;
        if (!generateLayout) {
          const module = await import("./gridLayout");
          setGenerateLayout(() => module.default);
          mo = module.default;
        } else {
          mo = generateLayout;
        }
        if (isAutoSize) {
          setLayout(mo(channels));
        } else {
          setLayout((la) => {
            const layoutFiltered = reject(la, (o) => !channels.includes(o.i));
            const f = mo(
              channels.filter((c) => !layoutFiltered.some((v) => v.i === c))
            );
            return [...layoutFiltered, ...f];
          });
        }
      } else setLayout([]);
    },
    [isAutoSize, saves, generateLayout]
  );

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
    trackEvent({
      category: "user",
      action: "click-logout-twitch",
      name: "logout-twitch",
    });
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
    deleteLs(`chat_${l.channel}`);
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
          <h5 style={{ color: "white" }}>Loading ...</h5>
        </NewWindow>
      )}
      <Suspense fallback="">
        <Header
          isAuth={isAuth}
          user={user}
          saves={saves}
          isEditMode={isEditMode}
          isCollapse={isCollapse}
          isAutoSize={isAutoSize}
          handleEditMode={() => {
            setIsEditMode((e) => {
              trackEvent({
                category: "menu",
                action: !e
                  ? "enable-edit_mode-layout"
                  : "disable-edit_mode-layout",
                name: "edit_mode-layout",
              });
              return !e;
            });
          }}
          handleWindow={() => {
            trackEvent({
              category: "menu",
              action: "click-login-twitch",
              name: "login-twitch",
            });
            setIsOpened(true);
          }}
          setIsCollapse={setIsCollapse}
          handleSave={() => {
            trackEvent({
              category: "menu",
              action: "click-save-layout",
              name: "save-layout",
            });
            const saveWithoutChannelDeleted = transform(
              layouts,
              (result, value, key) => {
                const d = value.filter(({ i }) => channels.includes(i));
                if (d.length > 0) result[key] = d;
                else omit(result, key);
              }
            );
            saveToLS("layouts", saveWithoutChannelDeleted);
            saveToLS("channels", channels);
            setSaves({
              channels: channels,
              layouts: saveWithoutChannelDeleted,
            });
          }}
          handleLoadSave={() => {
            trackEvent({
              category: "menu",
              action: "click-load-save-layout",
              name: "load-save-layout",
            });
            const channelsSaved = JSON.parse(
              JSON.stringify(getFromLS("channels") || [])
            );
            const layoutsSaved = JSON.parse(
              JSON.stringify(getFromLS("layouts") || {})
            );
            if (channelsSaved.length > 0) {
              setChannels(channelsSaved);
              setSaves({ channels: channelsSaved, layouts: layoutsSaved });
            }
          }}
          handleDeleteSave={() => {
            trackEvent({
              category: "menu",
              action: "click-delete-save-layout",
              name: "delete-save-layout",
            });
            deleteLs("layouts");
            deleteLs("channels");
            setSaves();
          }}
          handleReset={() => {
            trackEvent({
              category: "menu",
              action: "click-reset-layout",
              name: "reset-layout",
            });
            setLayouts({});
            setLayout(generateLayout(channels));
          }}
          handleAutoSize={() => {
            setIsAutoSize((r) => {
              saveToLS("auto_size", !r);
              trackEvent({
                category: "menu",
                action: !r ? "enable-reset-layout" : "disable-reset-layout",
                name: "auto_size-layout",
              });
              return !r;
            });
          }}
          onAddChannel={(channel) => {
            const _channel = channel.toLowerCase();
            if (!channels.includes(_channel)) {
              setChannels((c) => uniqBy([...c, _channel]));
            }
          }}
          logout={logout}
        />
      </Suspense>

      {layout?.length > 0 ? (
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
          {layout.map((l) => {
            return (
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
                <Suspense fallback="">
                  {DynamicGridTwitch && (
                    <DynamicGridTwitch
                      isEditMode={isEditMode}
                      showOverlay={showOverlay}
                      layout={l}
                      showChat={true}
                      onRemoveItem={onRemoveItem}
                    />
                  )}
                </Suspense>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      ) : (
        <Suspense fallback="">
          {DynamicWelcome && (
            <DynamicWelcome
              isAuth={isAuth}
              user={user}
              logout={logout}
              handleWindow={() => {
                trackEvent({
                  category: "welcome",
                  action: "click-login-twitch",
                  name: "login-twitch",
                });
                setIsOpened(true);
              }}
            />
          )}
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

function deleteLs(key) {
  if (window.localStorage) {
    window.localStorage.removeItem("multitwitch_" + key);
  }
}

export default withCookies(App);
