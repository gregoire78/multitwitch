/* eslint-disable react/prop-types */
import React, { Suspense, lazy, useState, useEffect } from "react";
import { WidthProvider, Responsive } from "react-grid-layout";
const DynamicGridTwitch = lazy(() => import("./GridTwitch"));
const ResponsiveGridLayout = WidthProvider(Responsive);

function GridLayout({
  onLayoutChange,
  layouts,
  layout,
  isEditMode,
  onRemoveItem,
}) {
  const [isTwitchScriptLoaded, setIsTwitchScriptLoaded] = useState(false);
  const [showOverlay, setShowOverlay] = useState();
  useEffect(() => {
    if (!window.Twitch && !window.Twitch?.Embed) {
      const script = document.createElement("script");
      script.setAttribute("src", "https://embed.twitch.tv/embed/v1.js");
      script.addEventListener("load", () => {
        setIsTwitchScriptLoaded(true);
      });
      document.body.appendChild(script);
    } else setIsTwitchScriptLoaded(true);
  }, []);
  const onDragStart = (layout, oldItem, newItem, placeholder, e, element) => {
    setShowOverlay(true);
    element.style.cursor = "grabbing";
  };
  const onDragStop = (layout, oldItem, newItem, placeholder, e, element) => {
    setShowOverlay(false);
    //element.style.cursor = "grab";
    element.style.cursor = "move";
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
  return (
    isTwitchScriptLoaded && (
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
                <DynamicGridTwitch
                  isEditMode={isEditMode}
                  showOverlay={showOverlay}
                  layout={l}
                  showChat={true}
                  onRemoveItem={onRemoveItem}
                />
              </Suspense>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    )
  );
}

export default GridLayout;
