import React, { Suspense, useEffect, useState } from "react";
import uniqBy from "lodash.uniqby";
import compact from "lodash.compact";
import reject from "lodash.reject";
import map from "lodash.map";
import { useCookies } from "react-cookie";
import { WidthProvider, Responsive } from "react-grid-layout";
import Welcome from "./Welcome";
import generateLayout from "./gridLayout";

import "/node_modules/react-resizable/css/styles.css";
import "/node_modules/react-grid-layout/css/styles.css";
import "./App.css";
import Header from "./Header";
import process from "process";
import GridTwitch from "./GridTwitch";

const ResponsiveGridLayout = WidthProvider(Responsive);

function App() {
  const [cookies, setCookie, removeCookie] = useCookies(["token"]);
  const [channels, setChannels] = useState();
  const [layout, setLayout] = useState();
  const [showOverlay, setShowOverlay] = useState();
  const [isAutoSize, setIsAutoSize] = useState(getFromLS("auto_size") ?? true);
  const [isCollapse, setIsCollapse] = useState();
  const [isEditMode, setIsEditMode] = useState(true);
  const [layouts, setLayouts] = useState();

  useEffect(() => {
    if (getFromLS("version") !== process.env.npm_package_version) {
      localStorage.clear();
      saveToLS("version", process.env.npm_package_version);
    }

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
  }, []);

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
      <Suspense fallback="">
        <Header
          isEditMode={isEditMode}
          isCollapse={isCollapse}
          isAutoSize={isAutoSize}
          setIsEditMode={setIsEditMode}
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
          <Welcome isAuth={false} />
        </Suspense>
      )}
    </>
  );
}

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

export default App;
