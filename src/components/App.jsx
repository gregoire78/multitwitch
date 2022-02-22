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
import process from "process";
import axios from "axios";
import { useMatomo } from "@datapunt/matomo-tracker-react";
import { useTranslation } from "react-i18next";
import { ToastContainer, toast } from "react-toastify";
const Header = lazy(() => import("./Header"));
const DynamicGridLayout = lazy(() => import("./GridLayout"));
const DynamicWelcome = lazy(() => import("./Welcome"));
const DynamicNewWindow = lazy(() => import("react-new-window"));
import "/node_modules/react-resizable/css/styles.css";
import "/node_modules/react-grid-layout/css/styles.css";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App({ cookies }) {
  const { t } = useTranslation();
  const [channels, setChannels] = useState();
  const [layout, setLayout] = useState();
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
  const [channelsSettings, setChannelsSettings] = useState(new Map());

  useEffect(() => {
    const version = getFromLS("version");
    if (version !== __COMMIT_HASH__) {
      if (!["6e67571"].includes(version)) {
        localStorage.clear();
      }
      saveToLS("version", __COMMIT_HASH__);
    }

    getTwitchUser();
    const urlparse = uniqBy(
      compact(window.location.pathname.split("/").map((v) => v.toLowerCase()))
    );
    const layoutsSaved = JSON.parse(JSON.stringify(getFromLS("layouts") || {}));
    const settingsSaved = new Map(
      JSON.parse(JSON.stringify(getFromLS("settings") || []))
    );
    const channelsSaved = [...settingsSaved.keys()];
    setChannelsSettings(settingsSaved);
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
      trackPageView();
    }
  }, [channels, trackPageView]);

  useEffect(() => {
    if (channels) {
      martin(channels);
    }
  }, [channels, martin]);

  const martin = useCallback(
    async (channels) => {
      setLayouts((la) => {
        const isSameAsSaved = saves
          ? isEqual([...channels].sort(), [...saves.channels].sort())
          : false;
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
          const module = await import("./layout.js");
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
    trackEvent({
      category: "user",
      action: "click-logout-twitch",
      name: "logout-twitch",
    });
    setIsAuth(false);
    setUser();
    await axios.post(`https://id.twitch.tv/oauth2/revoke`, null, {
      params: {
        client_id: process.env.TWITCH_CLIENTID,
        token: cookies.get("token"),
      },
    });
    cookies.remove("token", { domain: window.location.hostname });
  };

  const onRemoveItem = (l) => {
    let pseudos = reject(channels, (value) => value === l.channel);
    setChannels(pseudos);
    /*if (!pseudos.includes(l.channel)) {
      channelsSettings.delete(l.channel);
    }*/

    // open menu if all close
    if (pseudos.length === 0) {
      setIsCollapse(false);
      setIsEditMode(true);
    }
  };

  return (
    <>
      {isOpened && (
        <Suspense fallback="">
          <DynamicNewWindow
            onUnload={() => {
              getTwitchUser();
              setIsOpened(false);
            }}
            url={`https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENTID}&redirect_uri=${window.location.origin}/redirect&response_type=token&scope=user:read:follows`}
            features={{
              left: window.innerWidth / 2 - 600 / 2,
              top: window.innerHeight / 2 - 600 / 2,
              width: 600,
              height: 600,
            }}
          >
            <h5 style={{ color: "white" }}>Loading ...</h5>
          </DynamicNewWindow>
        </Suspense>
      )}
      <Suspense fallback="">
        <Header
          isAuth={isAuth}
          user={user}
          saves={saves}
          isEditMode={isEditMode}
          isCollapse={isCollapse}
          isAutoSize={isAutoSize}
          disabledSave={!channels?.length > 0}
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
            for (const channel of channelsSettings.keys()) {
              if (!channels.includes(channel)) {
                channelsSettings.delete(channel);
              }
            }
            saveToLS("layouts", saveWithoutChannelDeleted);
            saveToLS("settings", [...channelsSettings.entries()]);
            setSaves({
              channels: channels,
              layouts: saveWithoutChannelDeleted,
            });
            toast.dark(t("toast.save"), {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }}
          handleLoadSave={() => {
            trackEvent({
              category: "menu",
              action: "click-load-save-layout",
              name: "load-save-layout",
            });
            const layoutsSaved = JSON.parse(
              JSON.stringify(getFromLS("layouts") || {})
            );
            const channelsSettingsSaved = new Map(
              JSON.parse(JSON.stringify(getFromLS("settings") || []))
            );
            const channelsSaved = [...channelsSettingsSaved.keys()];
            if (channelsSaved.length > 0) {
              setChannelsSettings(channelsSettingsSaved);
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
            deleteLs("settings");
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

      {layout?.length > 0 && (
        <Suspense fallback="">
          <DynamicGridLayout
            onLayoutChange={onLayoutChange}
            layouts={layouts}
            layout={layout}
            isEditMode={isEditMode}
            onRemoveItem={onRemoveItem}
            channelsSettings={channelsSettings}
          />
        </Suspense>
      )}
      {channels?.length === 0 && (
        <Suspense fallback="">
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
        </Suspense>
      )}
      <ToastContainer />
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
