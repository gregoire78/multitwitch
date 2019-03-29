import React, { Component } from 'react';
import tmi from 'tmi.js';
import axios from 'axios';
import _ from 'lodash';
//import { HotKeys } from "react-hotkeys";
import moment from 'moment';
import ReactTooltip from 'react-tooltip';
import IntervalTimer from 'react-interval-timer';
import 'moment/locale/fr';
moment.locale('fr');
export default class Chatwitch extends Component {
    chatComponent = React.createRef();

    constructor(props) {
        super(props);
        this.state = {
            connecting: false,
            channels: _.uniqBy(_.compact(window.location.pathname.split("/"))),
            channelsDetails : [],
            chatThreads: [],
            infoStreams: {}
        }
        this.badgesGlobal = {};
        this.client = new tmi.client({
            channels: _.uniqBy(_.compact(window.location.pathname.split("/")))
        });
    }

    async componentWillMount() {
        this.client.connect();
        this.client.on("connecting", this.toogleConnectingChat.bind(this));
        this.client.on("connected", this.toogleConnectingChat.bind(this));
    }

    async componentDidMount() {
        this.badgesGlobal = (await axios.get(`https://badges.twitch.tv/v1/badges/global/display?language=fr`)).data
        this.infoChannels = await this.getInfoChannels();
        this.setState({infoStreams: await this.getInfoStreams()})
        console.table(this.state.infoStreams)
        console.table(this.infoChannels)
        this.setState({channelsDetails: await Promise.all(_.map(this.state.channels, async(channel)=>{
            const infoChannel = _.find(this.infoChannels, user => user.login === channel);
            const infoStream = _.find(this.state.infoStreams, user => user.user_id === infoChannel.id);
            return {channel, badges : await this.getBadgeLink(infoChannel), infoChannel, infoStream }
        }))});
        console.table(this.state.channelsDetails);

        this.client.on("chat", (channel, user, message, self)=>{
            const channelDetails = _.find(this.state.channelsDetails, ['channel', channel.slice(1)]);
            let chat = {status: "message", message, channel: channelDetails, badgesUser:[], user, ts: moment(user["tmi-sent-ts"], "x").format('LT')};
            if(user.badges) {
                chat.badgesUser = _.map(user.badges, (v,k)=>{return channelDetails.badges[k].versions[v]})
            }
            console.log(chat)
            this.setState(prevState => ( {
                chatThreads: [...prevState.chatThreads.slice(-49), chat]
            }));
            this.chatComponent.current.scrollToBottom();
        });

        this.client.on("timeout", (channel, username, reason, duration, userstate) => {
            const channelDetails = _.find(this.state.channelsDetails, ['channel', channel.slice(1)]);
            //const chatThreads = _.find(this.state.chatThreads, ['channel', channel.slice(1)]);
            let to = {status: "to", username, channel: channelDetails, reason, duration};
            this.setState(prevState => ({
                chatThreads: [...prevState.chatThreads.slice(-49), to]
            }))
            this.chatComponent.current.scrollToBottom();
        });

        this.client.on("ban", (channel, username, reason, userstate) => {
            const channelDetails = _.find(this.state.channelsDetails, ['channel', channel.slice(1)]);
            let ban = {status: "ban", username, channel: channelDetails, reason};
            this.setState(prevState => ({
                chatThreads: [...prevState.chatThreads.slice(-49), ban]
            }))
            this.chatComponent.current.scrollToBottom();
        });

        /*this.client.on("raw_message", (messageCloned, message) => {
        });*/

        this.client.on("notice", (channel, msgid, message) => {
            console.log("notice", msgid,message)
        });

        // for /me messages
        this.client.on("action", (channel, user, message, self) => {
            const channelDetails = _.find(this.state.channelsDetails, ['channel', channel.slice(1)]);
            let chat = {status: "message", message, channel: channelDetails, badgesUser:[], user, ts: moment(user["tmi-sent-ts"], "x").format('LT')};
            if(user.badges) {
                chat.badgesUser = _.map(user.badges, (v,k)=>{return channelDetails.badges[k].versions[v]})
            }
            this.setState(prevState => ({
                chatThreads: [...prevState.chatThreads.slice(-49), chat]
            }))
            this.chatComponent.current.scrollToBottom();
        });

        this.client.on("messagedeleted", (channel, username, deletedMessage, userstate) => {
            console.log(channel, username, deletedMessage, userstate)
        });

        setTimeout(() => {
            ReactTooltip.rebuild();
        }, 0);
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

    async getInfoStreams() {
        return (await axios.get(`https://api.twitch.tv/helix/streams?user_login=${this.state.channels.join('&user_login=')}`, {
            headers: {
                'Client-ID': process.env.REACT_APP_TWITCH_CLIENTID
            }
        })).data.data;
    }

    async getBadgeLink(infoChannel) {
        const badgesChannel = (await axios.get(`https://badges.twitch.tv/v1/badges/channels/${infoChannel.id}/display?language=fr`)).data;
        return {...this.badgesGlobal.badge_sets, ...badgesChannel.badge_sets}
    }

    render() {
        return (
            <>
                {this.state.connecting && <p>connecting to chat irc</p>}

                <div style={{fontSize: 12}}>{_.map(this.state.channelsDetails, (channelDetail,k)=>{return(<span data-for="info" data-tip={JSON.stringify(channelDetail.infoStream)} key={k} style={{background: "#"+intToRGB(hashCode(channelDetail.channel)), color: "white", cursor: "default"}}>{channelDetail.infoStream && "🔴"} {channelDetail.infoChannel.display_name}</span>)})}</div>

                <Chat chatThreads={this.state.chatThreads} ref={this.chatComponent} />

                <IntervalTimer
                    timeout={2000}
                    callback={async()=>{
                        const infoStreams = await this.getInfoStreams();
                        this.setState(async prevState => ({channelsDetails: await Promise.all(_.map(this.state.channels, async(channel)=>{
                            const infoChannel = _.find(this.infoChannels, user => user.login === channel);
                            const infoStream = _.find(infoStreams, user => user.user_id === infoChannel.id);
                            return {channel, badges : _.find(prevState.channelsDetails, user => user.channel === channel).badges, infoChannel, infoStream }
                        }), infoStreams)}));
                        ReactTooltip.rebuild();
                    }}
                    enabled={true}
                    repeat={true}
                />

                <ReactTooltip id="info" place="bottom" border={true} getContent={datumAsText => {
                    if (datumAsText == null) {
                    return;
                    }
                    let v = JSON.parse(datumAsText);
                    return (
                        <div>
                            <b>{v.title}</b><br/>
                        </div>
                    );
                }} />
            </>
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
                splitText.splice(mote[0], 1, `<img style="vertical-align: middle;margin: -100% 0;" class="emoticon" title=${text.slice(mote[0],mote[1]+1).replace(/[\u00A0-\u9999<>&]/gim, function(i) {
                    return '&#'+i.charCodeAt(0)+';';
                 })} src="http://static-cdn.jtvnw.net/emoticons/v1/${i}/1.0">`);
            }
        }
    }
    return splitText.join('');
}

class Chat extends Component {
    messagesEnd = React.createRef();
    chatelem = React.createRef();
    constructor(props){
        super(props);
        this.state = {
            autoscroll: true,
        }
    }

    componentDidMount() {
        let lastScrollTop = 0;
        window.addEventListener('scroll',(e)=>{
            if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight && !this.state.autoscroll) {
                this.setState({autoscroll: true});
            }
            let st = e.target.scrollTop;
            if (st > lastScrollTop){
                // downscroll code
            } else {
                this.setState({autoscroll: false});
            }
            lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
        }, true);
    }

    scrollToBottom() {
        if(this.state.autoscroll)
            //document.documentElement.scrollTop = document.body.scrollHeight;
            this.messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
    }

    render() {
        return (
        <div ref={this.chatelem} style={{height: "calc(100% - 16px)", overflow: "auto"}}>
            {this.props.chatThreads.map((chatThread,k)=>{
                let thread;
                if(chatThread.status === "to"){
                    thread = (<b style={{background: "yellow", color: "black"}}>@{chatThread.username} you are timed out for {chatThread.duration} seconds.</b>)
                }
                if(chatThread.status === "ban"){
                    thread = (<b style={{background: "red"}}>@{chatThread.username} you are BANNED.</b>)
                }
                if(chatThread.status === "message"){
                    thread = (<><small style={{color: "grey", verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.ts}</small> {chatThread.badgesUser.map((badgeUser, k)=>{return <img key={k} src={badgeUser.image_url_1x} alt="" title={badgeUser.title} style={{verticalAlign: "middle",lineHeight: "28px"}} />})} <span style={{color: chatThread.user.color, fontWeight: "bold",verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.user["display-name"]}:</span> <span style={chatThread.user["message-type"] === "action" ? {color: chatThread.user.color,verticalAlign: "middle",lineHeight: "28px"}:{verticalAlign: "middle",lineHeight: "28px"}} dangerouslySetInnerHTML={{ __html: formatEmotes(chatThread.message, chatThread.user.emotes, k).replace(/(?:^|\s)((?:http|https|ftp|ftps):\/\/[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}(\/\S*)?)/g, " <a href=$1 target='_blank'>$1</a>") }} /> </>)
                }
                const color = "#"+intToRGB(hashCode(chatThread.channel.channel));
                return (<div key={k} style={{minHeight: "28px", overflowWrap: "break-word"}}><img title={chatThread.channel.infoChannel.display_name} style={{height: 22, verticalAlign: "middle",lineHeight: "28px", border: `3px solid ${color}`, background: color}} src={chatThread.channel.infoChannel.profile_image_url} alt="" /> {thread} </div>);
            })}
            <div ref={this.messagesEnd} />
        </div>
    );
  }
}