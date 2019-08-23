import React, { Component } from 'react';
import {debounce} from 'lodash';
import {observer} from "mobx-react";
import axios from 'axios';
import Autocomplete from 'react-autocomplete';
import './SearchBox.css';

export default observer(class SearchBox extends Component {
    constructor(props) {
        super(props);
        const { person } = this.props;
        this.handleChange = this.handleChange.bind(this);
        this.onSelect = person.onSelect.bind(person);
        this.onMenuVisibilityChange = person.onMenuVisibilityChange.bind(person);
    }

    componentWillMount() {
        this.handleSearchDebounced = debounce(() => {
            this.handleSearch.apply(this, [this.props.person.query]);
        }, 250);
    }

    async searchTwitchChannel(query) {
        return (await axios.get(`https://api.twitch.tv/kraken/search/channels?query=${query}`, {
            headers: {
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Content-Type': 'application/json',
            'Client-ID': process.env.REACT_APP_TWITCH_CLIENTID
            }
        })).data;
    }

    async handleSearch(query) {
        if(query.trim().length > 0) {
            const result = await this.searchTwitchChannel(query);
            this.props.person.itemsSearch = result.channels;
            this.props.person.openDropdown = result.channels.length > 0;
        } else {
            this.props.person.itemsSearch = [];
            this.props.person.openDropdown = false;
        }
    }

    handleChange(event) {
        //this.props.queryCallback(event.target.value);
        this.props.person.query = event.target.value;
        this.props.person.openDropdown = this.props.person.itemsSearch.length < 0;
        this.handleSearchDebounced();
    }

    render() {
        return (
            <Autocomplete
                getItemValue={(item) => item.name}
                items={this.props.person.itemsSearch.slice()}
                renderItem={(item, isHighlighted) =>
                <div className="item" key={item.name} style={{ background: isHighlighted ? '#b34646' : 'transparent' }}>
                    <img src={item.logo} height="20" alt="" /> {item.display_name}
                </div>
                }
                renderMenu={(children, value, style) => (
                <div className="search-box">
                    {children}
                </div>
                )}
                value={this.props.person.queryFormat}
                onChange={this.handleChange}
                onSelect={this.onSelect}
                renderInput={(props) => <input type="search" placeholder={this.props.placeholder} {...props}/>}
                onMenuVisibilityChange={this.onMenuVisibilityChange}
                selectOnBlur={false}
                open={this.props.person.openDropdown}
            />
        );
    }
})