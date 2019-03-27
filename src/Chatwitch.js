import React, { Component } from 'react';
import tmi from 'tmi.js';
import axios from 'axios';
import _ from 'lodash';
import { HotKeys } from "react-hotkeys";
import moment from 'moment';
import 'moment/locale/fr';
moment.locale('fr');
export default class Chatwitch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            connecting: false,
            channels: [
                "loeya",
                "rhobalas_lol",
                "domingo",
                "bestmarmotte",
                "ikatv",
                "warths",
                "aypierre",
                "mistermv",
                "peteur_pan",
                "twitchpresentsfr",
                "edorocky",
                "nems"
            ],
            channelsDetails : [],
            chatThreads: [],
            autoscroll: true
        }
        this.badgesGlobal = {};
        this.client = new tmi.client({
            channels: [
                "loeya",
                "rhobalas_lol",
                "domingo",
                "bestmarmotte",
                "ikatv",
                "warths",
                "aypierre",
                "mistermv",
                "peteur_pan",
                "twitchpresentsfr",
                "edorocky",
                "nems"
            ]
        });
    }
    messagesEnd = React.createRef()

    async componentWillMount() {
        this.client.connect();
        this.client.on("connecting", this.toogleConnectingChat.bind(this));
        this.client.on("connected", this.toogleConnectingChat.bind(this));
        

        this.badgesGlobal = (await axios.get(`https://badges.twitch.tv/v1/badges/global/display?language=fr`)).data
        let dd = {}
        this.infoChannels = await this.getInfoChannels();
        console.table(this.infoChannels)
        _.map(this.state.channels, async (channel)=> {
            dd[channel]=await this.getBadgeLink(channel)
        })
        this.setState({channelsDetails: dd})
        console.log(this.state.channelsDetails)
    }

    componentDidMount() {
        let lastScrollTop = 0
        window.addEventListener('scroll',(e)=>{
            let st = window.pageYOffset || document.documentElement.scrollTop;
            if (st > lastScrollTop){
                // downscroll code
            } else {
                this.setState({autoscroll: false});
            }
            lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
            if (window.pageYOffset === document.body.scrollHeight - window.innerHeight && !this.state.autoscroll) {
                this.setState({autoscroll: true});
            }
        }, true);
        this.client.on("chat", (channel, user, message, self)=>{
            let chat = {status: "message", message, channel:{name:channel, display_name: this.state.channelsDetails[channel.slice(1)].display_name}, badgesUser:[], user, ts: moment(user["tmi-sent-ts"], "x").format('LT')};
            if(user.badges) {
                chat.badgesUser = _.map(user.badges, (v,k)=>{return this.state.channelsDetails[channel.slice(1)].badges[k].versions[v]})
            }
            this.setState(prevState => ({
                chatThreads: [...prevState.chatThreads, chat]
            }))
            this.scrollToBottom();
        });

        this.client.on("timeout", (channel, username, reason, duration, userstate) => {
            let to = {status: "to", username, channel:{name:channel, display_name: this.state.channelsDetails[channel.slice(1)].display_name}, reason, duration};
            this.setState(prevState => ({
                chatThreads: [...prevState.chatThreads, to]
            }))
            this.scrollToBottom();
        });

        this.client.on("ban", (channel, username, reason, userstate) => {
            let ban = {status: "ban", username, channel:{name:channel, display_name: this.state.channelsDetails[channel.slice(1)].display_name}, reason};
            this.setState(prevState => ({
                chatThreads: [...prevState.chatThreads, ban]
            }))
            this.scrollToBottom();
        });
    }

    toogleConnectingChat(address, port) {
        this.setState({connecting : !this.state.connecting})
        console.log(this.state.connecting ? "Connecting to : "+address+":"+port : "Connected to : "+address+":"+port);
    }

    async getInfoChannels() {
        return (await axios.get(`https://api.twitch.tv/helix/users?login=${this.state.channels.join('&login=')}`, {
            headers: {
                'Client-ID': process.env.REACT_APP_TWITCH_CLIENTID
            }
        })).data.data;
    }

    async getBadgeLink(channel) {
        const infoChannel = _.find(this.infoChannels, user => user.login === channel);
        console.table(infoChannel)
        const infoStream = (await axios.get(`https://api.twitch.tv/helix/streams?user_login=${channel}`, {
            headers: {
                'Client-ID': process.env.REACT_APP_TWITCH_CLIENTID
            }
        })).data;
        const badgesChannel = (await axios.get(`https://badges.twitch.tv/v1/badges/channels/${infoChannel.id}/display?language=fr`)).data;
        return {id: infoChannel.id, display_name: infoChannel.display_name, badges:{...this.badgesGlobal.badge_sets, ...badgesChannel.badge_sets}, infoChannel: infoChannel, infoStream: infoStream.data[0]}
    }

    scrollToBottom = () => {
        if(this.state.autoscroll)
            this.messagesEnd.current.scrollIntoView({ behavior: 'smooth' })
    }

    render() {
        return (
            <HotKeys keyMap={{
                ALT: { sequence: "alt" }
              }} handlers={{
                ALT: event => {this.setState(prevState=>({autoscroll: !prevState.autoscroll}))},
            }}>
                <div style={{position: "fixed", right: 0, fontSize: 12}}>{_.map(this.state.channelsDetails, (channelDetails,k)=>{return(<span key={k} style={{background: "#"+intToRGB(hashCode("#"+k)), color: "white"}}>{channelDetails.display_name}</span>)})}</div>
                {this.state.connecting && <p>connecting to chat irc</p>}
                <div>
                {this.state.chatThreads.map((chatThread,k)=>{
                    let thread;
                    if(chatThread.status === "to"){
                        thread = (<b style={{background: "yellow", color: "black"}}>@{chatThread.username} you are timed out for {chatThread.duration} seconds.</b>)
                    }
                    if(chatThread.status === "ban"){
                        thread = (<b style={{background: "red"}}>@{chatThread.username} you are BANNED.</b>)
                    }
                    if(chatThread.status === "message"){
                        thread = (<><small style={{color: "grey"}}>{chatThread.ts}</small> {chatThread.badgesUser.map((badgeUser, k)=>{return <img key={k} src={badgeUser.image_url_1x} alt="" title={badgeUser.title} style={{verticalAlign:"text-bottom"}} />})} <span style={{color: chatThread.user.color, fontWeight: "bold"}}>{chatThread.user["display-name"]}</span> : <span dangerouslySetInnerHTML={{ __html: formatEmotes(chatThread.message, chatThread.user.emotes, k).replace(/(?:^|\s)((?:http|https|ftp|ftps):\/\/[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,3}(\/\S*)?)/g, " <a href=$1 target='_blank'>$1</a>") }} /> </>)
                    }
                    return (<div key={k} style={{minHeight: "28px"}}><img title={chatThread.channel.display_name} style={{height: 22, verticalAlign: "text-top", border: `3px solid ${"#"+intToRGB(hashCode(chatThread.channel.name))}`, background: "#"+intToRGB(hashCode(chatThread.channel.name))}} src={this.state.channelsDetails[chatThread.channel.name.slice(1)].infoChannel.profile_image_url} alt="" /> {thread} </div>);
                })}
                </div>
                <div ref={this.messagesEnd} />
            </HotKeys>
        )
    }
}

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

function formatEmotes(text, emotes) {
    var splitText = text.split('');
    for(var i in emotes) {
        var e = emotes[i];
        for(var j in e) {
            var mote = e[j];
            if(typeof mote == 'string') {
                mote = mote.split('-');
                mote = [parseInt(mote[0]), parseInt(mote[1])];
                var length =  mote[1] - mote[0],
                    empty = Array.apply(null, new Array(length + 1)).map(function() { return '' });
                splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1, splitText.length));
                splitText.splice(mote[0], 1, `<img style="vertical-align: text-top;" class="emoticon" title=${text.slice(mote[0],mote[1]+1).replace(/[\u00A0-\u9999<>&]/gim, function(i) {
                    return '&#'+i.charCodeAt(0)+';';
                 })} src="http://static-cdn.jtvnw.net/emoticons/v1/${i}/1.0">`);
            }
        }
    }
    return splitText.join('');
}