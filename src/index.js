import React from 'react';
import ReactDOM from 'react-dom';
import DevTools from "mobx-react-devtools";
import { observable, decorate, action, computed } from "mobx";
import './index.css';
import App from './App';
import { CookiesProvider } from 'react-cookie';
import * as serviceWorker from './serviceWorker';

class Person {
    isEditMode = true;
    isCollapse = false;
    isAuth;
    user = {};
    streams = [];
    opened = false;
    mounted = false;
    showOverlay = false;
    query = '';
    itemsSearch = new Array(1);
    openDropdown = false;

    handleEdit() {
        this.isEditMode = !this.isEditMode;
    }

    onToogleCollapse(getFollowedStream) {
        if(this.isCollapse && this.isAuth) {getFollowedStream()}
        this.isCollapse = !this.isCollapse;
    }

    handleWindow() {
        this.opened = !this.opened;
    }

    async logout(revokeTwitchToken, cookies) {
        await revokeTwitchToken(cookies.get('token'));
        this.isAuth = false;
        this.user = {};
        this.streams = [];
        cookies.remove('token', {domain: process.env.REACT_APP_DOMAIN});
    }

    toogleOverlay(bool) {
        this.showOverlay = bool;
    }

    get queryFormat() {
        return this.query.trim().toLowerCase();
    }

    onMenuVisibilityChange() {
        this.openDropdown = !this.openDropdown && this.query.length>0;
    }

    onSelect(item) {
        this.query = item;
    }
}
decorate(Person, {
    isEditMode: observable,
    isCollapse: observable,
    isAuth: observable,
    user: observable,
    streams: observable,
    opened: observable,
    mounted: observable,
    showOverlay: observable,
    query: observable,
    itemsSearch: observable,
    openDropdown: observable,

    handleEdit: action,
    onToogleCollapse: action,
    handleWindow: action,
    logout: action,
    toogleOverlay: action,
    onMenuVisibilityChange: action,
    onSelect: action,

    queryFormat: computed
})

ReactDOM.render(
    <CookiesProvider>
        {process.env.NODE_ENV !== 'production' && <DevTools />}
        <App person={new Person()} />
    </CookiesProvider>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.register();
