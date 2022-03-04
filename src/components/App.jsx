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
import settingsService from "../services/settings.js";
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
      /*if (!["6e67571", "b222af4"].includes(version)) {
        localStorage.clear();
      }*/
      saveToLS("version", __COMMIT_HASH__);
    }

    getTwitchUser();
    const settingsKey = getFromLS("settings_key");
    if (settingsKey) {
      getSettingsOnLoad(settingsKey);
    } else {
      const urlparse = uniqBy(
        compact(window.location.pathname.split("/").map((v) => v.toLowerCase()))
      );

      // save old config to service
      const layoutsSaved = JSON.parse(
        JSON.stringify(getFromLS("layouts") || {})
      );
      const channelsSettingsSaved = new Map(
        JSON.parse(JSON.stringify(getFromLS("settings") || []))
      );
      const channelsSaved = [...channelsSettingsSaved.keys()];
      setChannelsSettings(channelsSettingsSaved);
      if (channelsSaved.length > 0) {
        setSaves({
          channels: channelsSaved,
          layouts: layoutsSaved,
        });
      }
      if (urlparse.length > 0) {
        setChannels(urlparse.map((v) => ({ channel: v })));
      } else if (channelsSaved.length > 0) {
        setChannels(channelsSaved.map((v) => ({ channel: v })));
      } else {
        setChannels([]);
      }
      if (channelsSaved.length > 0) {
        toSaveSettings([...channelsSettingsSaved.entries()], layoutsSaved);
      }
    }
  }, [cookies, getTwitchUser, getSettingsOnLoad, toSaveSettings]);

  useEffect(() => {
    saveToLS("auto_size", isAutoSize);
  }, [isAutoSize]);

  useEffect(() => {
    if (channels) {
      window.history.replaceState(
        "",
        "",
        `${window.origin}/${channels.map((v) => v.channel).join("/")}`
      );
      trackPageView();
    }
  }, [channels, trackPageView]);

  useEffect(() => {
    if (channels) {
      martin(channels.map((v) => v.channel));
    }
  }, [channels, martin]);

  const martin = useCallback(
    async (channels) => {
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
          let newL;
          if (channels?.length <= 6) {
            newL = mo(channels.map((v) => ({ channel: v })));
          } else {
            const g = await sortLive(channels);
            newL = mo(g);
          }
          setLayout(newL);
        } else {
          setLayout((la) => {
            const layoutFiltered = reject(la, (o) => !channels.includes(o.i));
            const f = mo(
              channels
                .filter((c) => !layoutFiltered.some((v) => v.i === c))
                .map((v) => ({ channel: v }))
            );
            return [...layoutFiltered, ...f];
          });
        }
      } else setLayout([]);
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
    },
    [saves, isAutoSize, generateLayout, sortLive]
  );

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

  const toSaveSettings = useCallback(async (settings, layouts) => {
    try {
      const settingsKey = getFromLS("settings_key");
      if (settingsKey) {
        if (settings.length > 0) {
          await settingsService.update(settingsKey, {
            settings,
            layouts,
          });
        }
      } else {
        if (settings.length > 0) {
          const { data: key } = await settingsService.save({
            settings,
            layouts,
          });
          saveToLS("settings_key", key);
          deleteLs("layouts");
          deleteLs("settings");
        }
      }
    } catch (error) {
      saveToLS("layouts", layouts);
      saveToLS("settings", settings);
    }
  }, []);

  const getSettingsOnLoad = useCallback(async (key) => {
    const urlparse = uniqBy(
      compact(window.location.pathname.split("/").map((v) => v.toLowerCase()))
    );
    try {
      const { data } = await settingsService.get(key);
      const layoutsSavedCloud = data.layouts;
      const settingsSavedCloud = new Map(data.settings);
      const channelsSaved = [...settingsSavedCloud.keys()];
      setChannelsSettings(settingsSavedCloud);
      if (channelsSaved.length > 0) {
        setSaves({
          channels: channelsSaved,
          layouts: layoutsSavedCloud,
        });
      }
      if (urlparse.length > 0) {
        setChannels(urlparse.map((v) => ({ channel: v })));
      } else if (channelsSaved.length > 0) {
        setChannels(channelsSaved.map((v) => ({ channel: v })));
      } else {
        setChannels([]);
      }
    } catch (error) {
      if (error?.response?.status === 404) {
        deleteLs("settings_key");
      }
      if (urlparse.length > 0) {
        setChannels(urlparse.map((v) => ({ channel: v })));
      } else {
        setChannels([]);
      }
    }
  }, []);

  const onLayoutChange = (layout, layouts) => {
    setLayouts(layouts);
  };

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
    let pseudos = reject(channels, (value) => value.channel === l.channel);
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

  const handleSave = async () => {
    trackEvent({
      category: "menu",
      action: "click-save-layout",
      name: "save-layout",
    });
    const _channels = channels.map((v) => v.channel);
    const saveWithoutChannelDeleted = transform(
      layouts,
      (result, value, key) => {
        const d = value.filter(({ i }) => _channels.includes(i));
        if (d.length > 0) result[key] = d;
        else omit(result, key);
      }
    );
    for (const channel of channelsSettings.keys()) {
      if (!_channels.includes(channel)) {
        channelsSettings.delete(channel);
      }
    }
    const settings = [...channelsSettings.entries()];

    await toSaveSettings(settings, saveWithoutChannelDeleted);

    setSaves({
      channels: _channels,
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
  };

  const handleLoadSave = async () => {
    trackEvent({
      category: "menu",
      action: "click-load-save-layout",
      name: "load-save-layout",
    });
    const rescue = () => {
      const layoutsSaved = JSON.parse(
        JSON.stringify(getFromLS("layouts") || {})
      );
      const channelsSettingsSaved = new Map(
        JSON.parse(JSON.stringify(getFromLS("settings") || []))
      );
      const channelsSaved = [...channelsSettingsSaved.keys()];
      if (channelsSaved.length > 0) {
        setChannelsSettings(channelsSettingsSaved);
        setChannels(channelsSaved.map((v) => ({ channel: v })));
        setSaves({ channels: channelsSaved, layouts: layoutsSaved });
      }
    };
    try {
      const settingsKey = getFromLS("settings_key");
      if (settingsKey) {
        const { data } = await settingsService.get(settingsKey);
        const layoutsSavedCloud = data.layouts;
        const settingsSavedCloud = new Map(data.settings);
        const channelsSaved = [...settingsSavedCloud.keys()];
        if (channelsSaved.length > 0) {
          setChannelsSettings(settingsSavedCloud);
          setChannels(channelsSaved.map((v) => ({ channel: v })));
          setSaves({ channels: channelsSaved, layouts: layoutsSavedCloud });
        }
      } else rescue();
    } catch (error) {
      rescue();
    }
  };

  const handleDeleteSave = async () => {
    trackEvent({
      category: "menu",
      action: "click-delete-save-layout",
      name: "delete-save-layout",
    });
    deleteLs("layouts");
    deleteLs("settings");
    const settingsKey = getFromLS("settings_key");
    if (settingsKey) {
      try {
        await settingsService.remove(settingsKey);
        deleteLs("settings_key");
      } catch (error) {
        return;
      }
    }
    setSaves();
  };

  const sortLive = useCallback(async (channels) => {
    try {
      const res = await axios.get(`${process.env.TOUAPI}/streams`, {
        params: {
          userNames: channels,
        },
      });
      const h = channels
        .map((c) => ({
          channel: c,
          stream: res.data.find((d) => d.user_login === c),
        }))
        .sort(
          (a, b) => (b.stream?.type === "live") - (a.stream?.type === "live")
        )
        .map((d) => d.channel);

      return channels.map((c) => {
        return {
          channel: c,
          pos: h.indexOf(c),
        };
      });
    } catch (error) {
      return channels.map((c, i) => {
        return {
          channel: c,
          pos: i,
        };
      });
    }
  }, []);

  const handleSetting = (c, v) => {
    setChannelsSettings((d) => d.set(c, v));
  };

  const handleReset = async () => {
    trackEvent({
      category: "menu",
      action: "click-reset-layout",
      name: "reset-layout",
    });
    let newL;
    if (channels?.length <= 6) {
      newL = generateLayout(channels);
    } else {
      const g = await sortLive(channels.map((v) => v.channel));
      newL = generateLayout(g);
    }
    setLayouts({ lg: newL });
    setLayout(newL);
  };

  const handleSort = async () => {
    trackEvent({
      category: "menu",
      action: "click-sort-layout",
      name: "sort-layout",
    });
    const g = await sortLive(channels.map((v) => v.channel));
    const newL = generateLayout(g);
    setLayouts({ lg: newL });
    setLayout(newL);
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
          disabledSort={channels?.length <= 6}
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
          handleSave={handleSave}
          handleLoadSave={handleLoadSave}
          handleDeleteSave={handleDeleteSave}
          handleReset={handleReset}
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
          handleSort={handleSort}
          onAddChannel={(channel) => {
            const _channel = channel.toLowerCase();
            if (!channels.map((v) => v.channel).includes(_channel)) {
              setChannels((c) =>
                uniqBy([...c, { channel: _channel }], "channel")
              );
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
            handleSetting={handleSetting}
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
