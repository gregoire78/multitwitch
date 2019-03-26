import React, { Component } from 'react';
import { WidthProvider, Responsive } from "react-grid-layout";
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { faTwitch, faGithub } from '@fortawesome/free-brands-svg-icons';
import tmi from 'tmi.js';
import axios from 'axios';
import _ from 'lodash';

library.add(faTwitch, faSignOutAlt, faGithub);
const ResponsiveReactGridLayout = WidthProvider(Responsive);

// Generating HASH out of Random String
function hashCode(str) { 
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
} 

// Creating Hex Color code out of Random String
function intToRGB(i){
    var c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
}
const client = new tmi.client({
    channels: [
        "loeya",
        "rhobalas_lol",
        "domingo",
        "bestmarmotte",
        "ikatv",
        "warths",
        "aypierre",
        "mistermv"
    ]
});
let id = {}
async function getBadgeLink(channel){
    const idy = (await axios.get(`https://api.twitch.tv/helix/users?login=${channel}`, {
      headers: {
        'Client-ID': process.env.REACT_APP_TWITCH_CLIENTID
      }
    })).data.data[0].id;
    const badges = (await axios.get(`https://badges.twitch.tv/v1/badges/channels/${idy}/display?language=fr`)).data;
    const badgesglobal = (await axios.get(`https://badges.twitch.tv/v1/badges/global/display?language=fr`)).data;

    id[channel] = {id: idy, badges: _.assign(badgesglobal.badge_sets, badges.badge_sets)};
}

//client.connect();
client.on("connected", (address, port) => {
    console.log(address);
    ["loeya","rhobalas_lol","domingo","bestmarmotte","ikatv","warths","aypierre","mistermv"
    ].map(async(chan)=>await getBadgeLink(chan))
    
});
client.on("chat", async (channel, user, message, self) => {
    let p = [`font-size: 0px;display: none;`, `font-size: 0px;display: none;`, `font-size: 0px;display: none;`]
    if(user.badges) {
        p = _.map(user.badges, (v,k)=>{return `font-size: 1px;padding: ${(18 * 0.5)}px;background-size: ${(18 * 0.5)}px;background: url( ${id[channel.slice(1)].badges[k].versions[v].image_url_1x}) no-repeat;`})
    }
    //badges = user.badges ? id[channel.slice(1)].badges[user.badges["subscriber"]].image_url_1x : ''
    console.log(`%c${channel}%c %c %c %c %c ${user["display-name"]}%c: ${message}`, `background: #${intToRGB(hashCode(channel))}; color: white;`, '', p[0], p[1] ? p[1] : `font-size: 0px;display: none;`, p[2] ? p[2] : `font-size: 0px;display: none;`, `color: ${user.color};font-weight: bold;`, ``)
});
client.on("timeout", (channel, username, reason, duration, userstate) => {
    console.log("TO", username, channel, reason, duration)
});
client.on("ban", (channel, username, reason, userstate) => {
    console.log("Ban", username, channel, reason)
});
export default class Welcome extends Component {
    render() {
        const { isAuth, user } = this.props
        return (
            <ResponsiveReactGridLayout
                className="layout"
                isResizable={true}
                onDragStart={(layout, oldItem, newItem, placeholder, e, element) => { element.style.cursor = "grabbing"; }}
                onDragStop={(layout, oldItem, newItem, placeholder, e, element) => { element.style.cursor = "grab"; }}
                compactType={null}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 12, sm: 6, xs: 6, xxs: 6 }}>
                <div key="welcome" className="welcome" data-grid={{ x: 3, y: 1, w: 6, h: 3, minH: 3, minW: 6 }}>
                    <h1>Welcome to MultiTwitch.co</h1>
                    <p>
                    In MultiTwitch.co you can watch a multi streams of <a href="https://twitch.tv/" target="_blank" rel="noopener noreferrer" style={{fontSize: "1em"}}>twitch.tv</a>.
                    </p>
                    <p>Simply add the channel ID in <i>"channel twitch"</i> input at the top of the page or in the url. <br/><i>(ex: <a href={`${window.location.origin}/peteur_pan/psykaoz`}>multitwitch.co/peteur_pan/psykaoz/other_channel_id</a>)</i></p>
                    <p style={{ textAlign: "center" }}>or</p>
                    <p>You can also connect your twitch account to watch live of followed channels.</p>
                    <p>
                    {!isAuth ?
                        <button onClick={this.props.handleWindow} title="Login to your twitch account"><FontAwesomeIcon icon={["fab", "twitch"]} /> Connect your Twitch account</button>
                        :
                        <>Congratulation <span style={{background: "rgb(130, 107, 173)"}}><img src={user.profile_image_url} alt="" style={{height: "21px", verticalAlign: "top", backgroundColor: "black"}}/> {user.display_name} </span>&nbsp;you are connected ! <button onClick={this.props.logout}>logout <FontAwesomeIcon icon="sign-out-alt" /></button></> }
                    </p>
                    <small>Created by Grégoire Joncour - <a href="https://github.com/gregoire78/multitwitch" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={["fab", "github"]} /> view the project on github</a> - &copy; 2019 multitwitch.co</small>
                </div>
            </ResponsiveReactGridLayout>
            /*<div className="main-welcome">
                <div className="welcome">
                    <h1>Welcome to MultiTwitch.co</h1>
                    <p>
                        In MultiTwitch.co you can watch a multi streams of twitch.tv.
                        </p>
                    <p>Simply add the channel ID in <i>"channel twitch"</i> input at the top of the page. (ex: peteur_pan)</p>
                    <p style={{ textAlign: "center" }}>or</p>
                    <p>You can also connect your twitch account to watch live of followed channels.</p>
                    <button>Connect my Twitch account</button>
                </div>
            </div>*/
        )
    }
}