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
                src={`https://static-cdn.jtvnw.net/ttv-boxart/${v.game}-40x55.jpg`}
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
                <b style={{ display: "block" }}>{v.channel.status}</b>
                {v.game} - {v.channel.broadcaster_language.toUpperCase()}
                {v.channel.mature ? " - 🔞" : ""}
                <br />
                <small>
                  <FontAwesomeIcon icon="clock" />{" "}
                  {`${dayjs
                    .utc(dayjs() - dayjs(v.created_at))
                    .format("HH[h]mm")}`}{" "}
                  - <FontAwesomeIcon icon="user" />{" "}
                  {v.viewers.toLocaleString(i18n.language, {
                    minimumFractionDigits: 0,
                  })}
                </small>
              </div>
            </div>
            <img style={{ display: "block" }} alt="" src={v.preview.small} />
          </div>
        );
      }}
    />
  );
}

export default ToolTipChannel;
