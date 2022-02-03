/* eslint-disable react/prop-types */
import React from "react";
import ReactTooltip from "react-tooltip";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useTranslation } from "react-i18next";
dayjs.extend(utc);

function ToolTipChannel({ FontAwesomeIcon }) {
  const { i18n } = useTranslation();
  return (
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
                src={v.game.box_art_url.replace("{width}x{height}", "40x55")}
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
                <b style={{ display: "block" }}>{v.stream.title}</b>
                {v.stream.game_name} - {v.stream.language.toUpperCase()}
                {v.stream.is_mature ? " - 🔞" : ""}
                <br />
                <small>
                  <FontAwesomeIcon icon="clock" />{" "}
                  {`${dayjs
                    .utc(dayjs() - dayjs(v.stream.started_at))
                    .format("HH[h]mm")}`}{" "}
                  - <FontAwesomeIcon icon="user" />{" "}
                  {v.stream.viewer_count.toLocaleString(i18n.language, {
                    minimumFractionDigits: 0,
                  })}
                </small>
              </div>
            </div>
            <img
              style={{ display: "block" }}
              alt=""
              src={v.stream.thumbnail_url.replace("{width}x{height}", "80x45")}
            />
          </div>
        );
      }}
    />
  );
}

export default ToolTipChannel;
