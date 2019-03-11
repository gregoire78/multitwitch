import React, { Component } from 'react';
import {debounce} from 'lodash';
import axios from 'axios';
import Autocomplete from 'react-autocomplete';
import './SearchBox.css';

export default class SearchBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            query: this.props.input && '',
            itemsSearch: [],
            openDropdown: false
        };
        this.handleChange = this.handleChange.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.onMenuVisibilityChange = this.onMenuVisibilityChange.bind(this);
    }

    componentWillReceiveProps(prevProps, prevState) {
        if(prevProps.input !== this.props.input){
            this.setState({ query : prevProps.input})
            if(prevProps.input.length <= 0) this.setState({ itemsSearch: [] })
        }
    }

    componentWillMount() {
        this.handleSearchDebounced = debounce(() => {
            this.handleSearch.apply(this, [this.state.query]);
        }, 250);
    }

    async searchTwitchChannel(query) {
        return (await axios.get(`https://api.twitch.tv/kraken/search/channels?query=${query}`, {
            headers: {
            'Content-Type': 'application/json',
            'Client-ID': process.env.REACT_APP_TWITCH_CLIENTID
            }
        })).data;
    }

    async handleSearch(query) {
        if(query.trim().length > 0) {
            const result = await this.searchTwitchChannel(query);
            this.setState({ itemsSearch: result.channels, openDropdown : result.channels.length > 0 });
        } else {
            this.setState({ itemsSearch: [], openDropdown: false })
        }
    }

    handleChange(event) {
        this.props.queryCallback(event.target.value);
        this.setState({ query: event.target.value, openDropdown : this.state.itemsSearch.length < 0 });
        this.handleSearchDebounced();
    }

    onSelect(item) {
        this.props.queryCallback(item);
        this.setState({query: item});
    }

    onMenuVisibilityChange(isopen) {
        this.setState({openDropdown : !this.state.openDropdown && this.state.query.length>0});
    }

    render() {
        return (
            <Autocomplete
                getItemValue={(item) => item.name}
                items={this.state.itemsSearch}
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
                value={this.state.query}
                onChange={this.handleChange}
                onSelect={this.onSelect}
                renderInput={(props) => <input type="search" placeholder={this.props.placeholder} {...props}/>}
                onMenuVisibilityChange={this.onMenuVisibilityChange}
                selectOnBlur={false}
                open={this.state.openDropdown}
            />
        );
    }
}