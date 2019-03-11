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
            openDropdown: false,
            itemsSearch: []
        };
        this.handleChange = this.handleChange.bind(this);
        this.onSelect = this.onSelect.bind(this);
    }

    componentWillReceiveProps(prevProps, prevState) {
        console.log(prevProps, this.props.input)
        if(this.props.input !== prevProps.input) {
            this.setState({ query : this.props.input })
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
            this.setState({ itemsSearch: result.channels });
        } else {
            this.setState({ itemsSearch: [] })
        }
    }

    handleChange(event) {
        this.setState({ query: event.target.value });
        this.handleSearchDebounced();
    }
    
    onSelect(item) {
        this.setState({query: item});
        this.props.queryCallback(item)
    }

    render() {
        return (
            <Autocomplete
                getItemValue={(item) => item.name}
                items={this.state.itemsSearch}
                renderItem={(item, isHighlighted) =>
                <div className="item" key={item.name} style={{ background: isHighlighted ? 'lightgray' : 'white' }}>
                    <img src={item.logo} height="20" alt="" />{item.display_name}
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
                selectOnBlur={true}
            />
        );
    }
}