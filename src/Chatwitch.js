import React, { Component, Fragment } from 'react';
import tmi from 'tmi.js';
import axios from 'axios';
import _ from 'lodash';
//import { HotKeys } from "react-hotkeys";
import moment from 'moment';
import ReactTooltip from 'react-tooltip';
import IntervalTimer from 'react-interval-timer';
import Notification  from 'react-web-notification';
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
            infoStreams: {},
            ignoreNotif: true,
            titleNotif: '',
            infoGames: []
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
        this.setState({infoGames: await this.getGames(_.map(this.state.infoStreams, (o)=>{return o.game_id}))});
        console.table(this.state.infoGames)
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
            let chat = {status: "message", message, channel: channelDetails, badgesUser:[], user, ts: moment(user["tmi-sent-ts"], "x").format('LT'), ts_global : moment().valueOf()};
            if(user.badges) {
                chat.badgesUser = _.map(user.badges, (v,k)=>{return channelDetails.badges[k].versions[v]})
            }
            this.setState(prevState => ( {
                chatThreads: [...prevState.chatThreads.slice(-199), chat]
            }));
            this.chatComponent.current.scrollToBottom();
        });

        this.client.on("timeout", (channel, username, reason, duration, userstate) => {
            const channelDetails = _.find(this.state.channelsDetails, ['channel', channel.slice(1)]);
            //const chatThreads = _.find(this.state.chatThreads, ['channel', channel.slice(1)]);
            let to = {status: "to", username, channel: channelDetails, reason, duration, ts_global : moment().valueOf()};
            this.setState(prevState => ({
                chatThreads: [...prevState.chatThreads.slice(-199), to]
            }))
            this.chatComponent.current.scrollToBottom();
        });

        this.client.on("ban", (channel, username, reason, userstate) => {
            const channelDetails = _.find(this.state.channelsDetails, ['channel', channel.slice(1)]);
            let ban = {status: "ban", username, channel: channelDetails, reason, ts_global : moment().valueOf()};
            //const messages = this.state.chatThreads.filter((r)=>{return r.user.username===username})
            console.log("ban",channel, username, reason, userstate, this.state.chatThreads);
            this.setState(prevState => ({
                chatThreads: [...prevState.chatThreads.slice(-199), ban]
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
            let chat = {status: "message", message, channel: channelDetails, badgesUser:[], user, ts: moment(user["tmi-sent-ts"], "x").format('LT'), ts_global : moment().valueOf()+""};
            if(user.badges) {
                chat.badgesUser = _.map(user.badges, (v,k)=>{return channelDetails.badges[k].versions[v]})
            }
            this.setState(prevState => ({
                chatThreads: [...prevState.chatThreads.slice(-199), chat]
            }))
            this.chatComponent.current.scrollToBottom();
        });

        this.client.on("messagedeleted", (channel, username, deletedMessage, userstate) => {
            console.log(channel, username, deletedMessage, userstate)
        });

        this.client.on("resub", (channel, username, months, message, user, methods) => {
            const channelDetails = _.find(this.state.channelsDetails, ['channel', channel.slice(1)]);
            let cumulativeMonths = ~~user["msg-param-cumulative-months"];
            const resub = {status: "resub", username, methods, message, cumulativeMonths, channel: channelDetails, badgesUser:[], user, ts: moment(user["tmi-sent-ts"], "x").format('LT'), ts_global : moment().valueOf()};
            console.log("resub ", channel, username, months, message, user, methods, cumulativeMonths)
            if(user.badges) {
                resub.badgesUser = _.map(user.badges, (v,k)=>{return channelDetails.badges[k].versions[v]})
            }
            this.setState(prevState => ({
                chatThreads: [...prevState.chatThreads.slice(-199), resub]
            }))
            this.openNotification(`${channel} RESUB`, `${methods.planName} (${methods.plan}) - c'est le ${cumulativeMonths}e mois d'abonnement de @${user["display-name"]} !!! ${message !== null ? message : ''}`, channelDetails.infoChannel.profile_image_url)
            this.chatComponent.current.scrollToBottom();
        });

        this.client.on("subscription", (channel, username, method, message, user) => {
            const channelDetails = _.find(this.state.channelsDetails, ['channel', channel.slice(1)]);
            const subscription = {status: "subscription", username, method, channel: channelDetails, badgesUser:[], user, ts: moment(user["tmi-sent-ts"], "x").format('LT'), ts_global : moment().valueOf()};
            console.log("subscription ",channel, username, method, message, user)
            if(user.badges) {
                subscription.badgesUser = _.map(user.badges, (v,k)=>{return channelDetails.badges[k].versions[v]})
            }
            this.setState(prevState => ({
                chatThreads: [...prevState.chatThreads.slice(-199), subscription]
            }))
            this.openNotification(`${channel} SUBSCRIPTION`, `${method.planName} (${method.plan}) - c'est le 1er mois d'abonnement de @${user["display-name"]} !!!`, channelDetails.infoChannel.profile_image_url)
            this.chatComponent.current.scrollToBottom();
        });

        this.client.on("submysterygift", (channel, username, numbOfSubs, methods, userstate) => {
            // Do your stuff.
            let senderCount = ~~userstate["msg-param-sender-count"];
            console.log("submysterygift", channel, username, numbOfSubs, methods, userstate, senderCount)
        });

        this.client.on("subgift", (channel, username, streakMonths, recipient, methods, userstate) => {
            // Do your stuff.
            let senderCount = ~~userstate["msg-param-sender-count"];
            console.log("subgift", channel, username, streakMonths, recipient, methods, userstate, senderCount)
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

    handlePermissionGranted() {
        console.log('Permission Granted');
        this.setState({
            ignoreNotif: false
        });
    }
    handlePermissionDenied() {
        console.log('Permission Denied');
        this.setState({
            ignoreNotif: true
        });
    }
    handleNotSupported() {
        console.log('Web Notification not Supported');
        this.setState({
            ignoreNotif: true
        });
    }

    openNotification(title, body, icon) {
        if(this.state.ignoreNotif) {
            return;
        }
        const options = {
            tag: Date.now(),
            body: body,
            icon: icon,
            lang: 'fr',
            dir: 'ltr'
        }
        this.setState({
            titleNotif: title,
            optionsNotif: options
        });
    }

    async getGames(ids) {
        return (await axios.get(`https://api.twitch.tv/helix/games?id=${ids.join('&id=')}`, {
            headers: {
                'Client-ID': process.env.REACT_APP_TWITCH_CLIENTID
            }
        })).data.data;
    }

    render() {
        return (
            <>
                <div style={{fontSize: 12, textAlign: 'center'}}>{this.state.channelsDetails.map((channelDetail,k)=>{return(<Fragment key={k}><span data-for="info" data-tip={JSON.stringify(channelDetail.infoStream)} key={k} style={{background: "#"+intToRGB(hashCode(channelDetail.channel)), color: "white", cursor: "default"}}>{channelDetail.infoStream && "🔴 "}{channelDetail.infoChannel.display_name}</span>{k===this.state.channelsDetails.length-1 ? '':' - '}</Fragment>)})}</div>

                {this.state.connecting ? <p>connecting to chat irc</p> : <Chat chatThreads={this.state.chatThreads} ref={this.chatComponent} />}

                <IntervalTimer
                    timeout={5000}
                    callback={async()=>{
                        this.badgesGlobal = (await axios.get(`https://badges.twitch.tv/v1/badges/global/display?language=fr`)).data
                        this.infoChannels = await this.getInfoChannels();
                        this.setState({infoStreams: await this.getInfoStreams()});
                        this.setState({infoGames: await this.getGames(_.map(this.state.infoStreams, (o)=>{return o.game_id}))});
                        this.setState({channelsDetails: await Promise.all(_.map(this.state.channels, async(channel)=>{
                            const infoChannel = _.find(this.infoChannels, user => user.login === channel);
                            const infoStream = _.find(this.state.infoStreams, user => user.user_id === infoChannel.id);
                            return {channel, badges : await this.getBadgeLink(infoChannel), infoChannel, infoStream }
                        }))});
                        ReactTooltip.rebuild();
                    }}
                    enabled={this.infoChannels && this.infoChannels.length > 0 && this.state.channels.length > 0 }
                    repeat={true}
                />

                <ReactTooltip id="info" place="bottom" border={true} getContent={datumAsText => {
                    if (datumAsText == null) {
                    return;
                    }
                    let v = JSON.parse(datumAsText);
                    const game = this.state.infoGames.find(o=>{return v.game_id === o.id})
                    return (
                        <div>
                            <img alt='' style={{display: "inline-block"}} src={game.box_art_url.replace(/(.*)({width}x{height})(.*)/,'$140x55$3')} />
                            <div style={{display: "inline-block", verticalAlign: "top", margin: "0 0 0 10px",overflow: "hidden",textOverflow: "ellipsis", whiteSpace: "nowrap",width: "calc(100% - 50px)"}}>
                                <b>{v.title}</b><br/>
                                <small>{game.name}</small>
                            </div>
                        </div>
                    );
                }} />

                <ReactTooltip id="emote" place="top" border={true} className="emote-preview" getContent={datumAsText => {
                    if (datumAsText == null) {
                    return;
                    }
                    let v = JSON.parse(datumAsText);
                    return (
                        <><img src={v.src} alt=""/><p>{v.title}</p></>
                    );
                }} />

                <Notification
                    ignore={this.state.ignoreNotif && this.state.titleNotif !== ''}
                    notSupported={this.handleNotSupported.bind(this)}
                    onPermissionGranted={this.handlePermissionGranted.bind(this)}
                    onPermissionDenied={this.handlePermissionDenied.bind(this)}
                    timeout={10000}
                    title={this.state.titleNotif}
                    options={this.state.optionsNotif}
                />
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

function hashCode2(s) {
    let h;
    for(let i = 0; i < s.length; i++) 
          h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    return h;
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
                    empty = Array.apply(null, new Array(length + 1+1)).map(function() { return '' });
                splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1+1, splitText.length));
                var datajson = {src: `http://static-cdn.jtvnw.net/emoticons/v1/${i}/3.0`, title: text.slice(mote[0],mote[1]+1).replace(/[\u00A0-\u9999<>&]/gim, function(i) {return '&#'+i.charCodeAt(0)+';';})}
                splitText.splice(mote[0], 1, `<img data-for="emote" data-tip=${JSON.stringify(datajson)} style="vertical-align: middle;margin: -0.5% 0;display: inline-block;" class="emoticon" alt="${datajson.title}" src="http://static-cdn.jtvnw.net/emoticons/v1/${i}/1.0">`);
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
        window.addEventListener('scroll',(e)=>{
            if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight && !this.state.autoscroll) {
                this.setState({autoscroll: true});
            }
        }, true);
    }

    componentDidUpdate() {
        ReactTooltip.rebuild();
    }

    onWheel(e) {
        //e.nativeEvent.wheelDelta > 0//scroolup
        //console.log(this.chatelem.current.scrollTop,this.chatelem.current.clientHeight,this.chatelem.current.scrollHeight, this.chatelem.current.scrollHeight-this.chatelem.current.clientHeight)
        let st = this.chatelem.current.scrollTop;
        if (((st <= this.chatelem.current.scrollHeight-this.chatelem.current.clientHeight && this.state.autoscroll) || st < this.chatelem.current.scrollHeight-this.chatelem.current.clientHeight) && e.nativeEvent.wheelDelta > 0 ){
            this.setState({autoscroll: false});
        }
    }

    scrollToBottom() {
        if(this.state.autoscroll)
            this.chatelem.current.scrollTop = this.chatelem.current.scrollHeight;
            //this.messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
    }

    render() {
        return (
        <div ref={this.chatelem} style={{height: "calc(100% - 16px)", overflow: "auto"}} onWheel={this.onWheel.bind(this)}>
            {this.props.chatThreads.map((chatThread)=>{
                let thread;
                switch(chatThread.status) {
                    case "to":
                        thread = (<b style={{background: "yellow", color: "black"}}>@{chatThread.username} you are timed out for {chatThread.duration} seconds.</b>)
                        break;
                    case "ban":
                        thread = (<b style={{background: "red"}}>@{chatThread.username} you are BANNED.</b>)
                        break;
                    case "message":
                        thread = (<><small style={{color: "grey", verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.ts}</small> {chatThread.badgesUser.map((badgeUser, k)=>{return <img key={k} src={badgeUser && badgeUser.image_url_1x} alt="" title={badgeUser && badgeUser.title} style={{verticalAlign: "middle",lineHeight: "28px"}} />})} <span style={{color: chatThread.user.color, fontWeight: "bold",verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.user["display-name"]}:</span> <span style={chatThread.user["message-type"] === "action" ? {color: chatThread.user.color,verticalAlign: "top",lineHeight: "28px"}:{verticalAlign: "top",lineHeight: "28px"}} dangerouslySetInnerHTML={{ __html: formatEmotes(chatThread.message, chatThread.user.emotes).replace(/(?:^|\s)((?:http|https|ftp|ftps):\/\/[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}(\/\S*)?)/g, " <a href=$1 target='_blank' style='color: black;vertical-align: middle;'>$1</a>") }} /></>)
                        break;
                    case "subscription":
                        thread = (<>
                        <small style={{color: "grey", verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.ts}</small> {chatThread.badgesUser.map((badgeUser, k)=>{return <img key={k} src={badgeUser && badgeUser.image_url_1x} alt="" title={badgeUser && badgeUser.title} style={{verticalAlign: "middle",lineHeight: "28px"}} />})} <span style={{color: chatThread.user.color, fontWeight: "bold",verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.user["display-name"]}:</span> <span style={chatThread.user["message-type"] === "action" ? {color: chatThread.user.color,verticalAlign: "top",lineHeight: "28px", fontWeight: "bold"}:{verticalAlign: "top",lineHeight: "28px", fontWeight: "bold"}}>{chatThread.method.planName} ({chatThread.method.plan}) - c'est le 1er mois d'abonnement de {"@"+chatThread.user["display-name"]} !!!</span>
                        </>)
                        break;
                    case "resub":
                        thread = (<><small style={{color: "grey", verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.ts}</small> {chatThread.badgesUser.map((badgeUser, k)=>{return <img key={k} src={badgeUser && badgeUser.image_url_1x} alt="" title={badgeUser && badgeUser.title} style={{verticalAlign: "middle",lineHeight: "28px"}} />})} <span style={{color: chatThread.user.color, fontWeight: "bold",verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.user["display-name"]}:</span> <span style={chatThread.user["message-type"] === "action" ? {color: chatThread.user.color,verticalAlign: "top",lineHeight: "28px", fontWeight: "bold"}:{verticalAlign: "top",lineHeight: "28px", fontWeight: "bold"}}>{chatThread.methods.planName} ({chatThread.methods.plan}) - c'est le {chatThread.cumulativeMonths}e mois d'abonnement de @{chatThread.user["display-name"]} !!!</span> {chatThread.message && <span style={chatThread.user["message-type"] === "action" ? {color: chatThread.user.color,verticalAlign: "top",lineHeight: "28px"}:{verticalAlign: "top",lineHeight: "28px"}} dangerouslySetInnerHTML={{ __html: formatEmotes(chatThread.message, chatThread.user.emotes).replace(/(?:^|\s)((?:http|https|ftp|ftps):\/\/[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}(\/\S*)?)/g, " <a href=$1 target='_blank' style='color: black;vertical-align: middle;'>$1</a>") }} />}</>)
                        break;
                    default:
                        // Something else ?
                        break;
                }
                const color = "#"+intToRGB(hashCode2(chatThread.channel.channel));
                return (<div key={chatThread.ts_global+chatThread.channel.channel} style={{minHeight: "28px", overflowWrap: "break-word", background: color+"33"}}><img title={chatThread.channel.infoChannel.display_name} style={{height: 22, verticalAlign: "middle",lineHeight: "28px", border: `3px solid ${color}`, background: color}} src={chatThread.channel.infoChannel.profile_image_url} alt="" /> {thread} </div>);
            })}
            <div ref={this.messagesEnd} />
        </div>
    );
  }
}