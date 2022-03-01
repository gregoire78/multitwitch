/* eslint-disable react/prop-types */
import React from "react";
import ReactTooltip from "react-tooltip";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

function ToolTipSaves() {
  return (
    <ReactTooltip
      id="saves"
      place="bottom"
      border={true}
      className="extraClass"
      getContent={(channels) => {
        if (channels == null) {
          return;
        }
        let v = JSON.parse(channels);
        return (
          <ul>
            {v.map((channel) => (
              <li style={{ margin: 0, fontSize: "15px" }} key={channel}>
                {channel}
              </li>
            ))}
          </ul>
        );
      }}
    />
  );
}

export default ToolTipSaves;
