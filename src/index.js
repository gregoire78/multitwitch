import React from 'react';
import ReactDOM from 'react-dom';
import DevTools from "mobx-react-devtools";
import { observable, decorate, action } from "mobx";
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

    handleEdit() {
        this.isEditMode = !this.isEditMode;
    }

    onToogleCollapse() {
        this.isCollapse = !this.isCollapse;
        //if(this.isCollapse && this.isAuth) {this.getFollowedStream()}
    }

    handleWindow() {
        this.opened = !this.opened;
    }
}
decorate(Person, {
    isEditMode: observable,
    isCollapse: observable,
    isAuth: observable,
    user: observable,
    streams: observable,
    opened: observable,
    handleEdit: action,
    onToogleCollapse: action,
    handleWindow: action
})

ReactDOM.render(
    <CookiesProvider>
        <DevTools />
        <App person={new Person()} />
    </CookiesProvider>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.register();
