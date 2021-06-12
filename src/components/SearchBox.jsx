import React from "react";
import PropTypes from "prop-types";
import debounce from "lodash.debounce";
import axios from "axios";
import process from "process";
import { components } from "react-select";
import AsyncSelect from "react-select/async";
import { useTranslation } from "react-i18next";
import "./SearchBox.css";

function SearchBox({ onAddChannel }) {
  const { t } = useTranslation();
  const searchTwitchChannel = async (query) => {
    const channels = (
      await axios.get(
        `https://api.twitch.tv/kraken/search/channels?query=${query}`,
        {
          headers: {
            Accept: "application/vnd.twitchtv.v5+json",
            "Content-Type": "application/json",
            "Client-ID": process.env.REACT_APP_TWITCH_CLIENTID,
          },
        }
      )
    ).data.channels;
    return channels.map((channel) => ({
      value: channel.name,
      label: channel.display_name,
      logo: channel.logo,
    }));
  };

  const loadSuggestedOptions = debounce((inputValue, callback) => {
    searchTwitchChannel(inputValue).then((options) => callback(options));
  }, 500);
  return (
    <AsyncSelect
      loadOptions={loadSuggestedOptions}
      placeholder={t("input-search.placeholder")}
      onChange={(value, action) => {
        if (action.action === "select-option") onAddChannel(value.value);
      }}
      value=""
      components={{
        IndicatorSeparator: null,
        IndicatorsContainer: () => null,
        Option: (props) => {
          return (
            <components.Option {...props}>
              <div className="option">
                {/* eslint-disable-next-line react/prop-types */}
                <img src={props.data.logo} height="20" alt="" />{" "}
                {/* eslint-disable-next-line react/prop-types */}
                <span>{props.label}</span>
              </div>
            </components.Option>
          );
        },
      }}
      noOptionsMessage={() => t("input-search.no-options")}
      styles={{
        container: () => ({
          display: "inline-block",
          width: "204px",
          background: "white",
        }),
        control: () => ({
          borderRadius: 0,
          padding: "0 5px",
        }),
        input: () => ({
          height: 24,
        }),
        valueContainer: (provided) => ({
          ...provided,
          padding: 0,
        }),
        multiValue: (provided) => ({
          ...provided,
          margin: 0,
        }),
        menu: (provided) => ({
          ...provided,
          top: "auto",
          marginTop: 0,
          marginBottom: 0,
          borderRadius: 0,
          boxShadow: "none",
        }),
        menuList: (provided) => ({
          ...provided,
          paddingTop: 0,
          paddingBottom: 0,
        }),
        option: (provided, state) => ({
          ...provided,
          background: state.isFocused && "#6441a4",
          color: state.isFocused && "white",
          padding: "5px 12px",
        }),
      }}
    />
  );
}

SearchBox.propTypes = {
  onAddChannel: PropTypes.func,
};

export default SearchBox;
