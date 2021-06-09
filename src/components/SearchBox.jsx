import React, { useCallback } from "react";
import debounce from "lodash.debounce";
import axios from "axios";
import process from "process";
import AsyncSelect from "react-select/async";
import { useTranslation, Trans } from "react-i18next";
import "./SearchBox.css";

function SearchBox({ onAddChannel }) {
  const { t, i18n } = useTranslation();
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
      }}
      styles={{
        container: (provided, state) => ({
          display: "inline-block",
          width: "204px",
          background: "white",
        }),
        control: (provided, state) => ({
          borderRadius: 0,
          padding: "0 5px",
        }),
        input: (provided, state) => ({
          width: state.selectProps.width,
          color: state.selectProps.menuColor,
        }),
        valueContainer: (provided, state) => ({
          ...provided,
          padding: 0,
        }),
        multiValue: (provided, state) => ({
          ...provided,
          margin: 0,
        }),
        menu: (provided, state) => ({
          ...provided,
          marginTop: 0,
          marginBottom: 0,
          borderRadius: 0,
          boxShadow: "none",
        }),
      }}
    />
  );
}

export default SearchBox;
