import React, { Component, Fragment } from 'react';
import tmi from 'tmi.js';
import axios from 'axios';
import _ from 'lodash';
//import { HotKeys } from "react-hotkeys";
import moment from 'moment';
import ReactTooltip from 'react-tooltip';
import Notification  from 'react-web-notification';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUser } from '@fortawesome/free-solid-svg-icons';
import 'moment/locale/fr';
//import textToSpeech from '@google-cloud/text-to-speech';

library.add(faClock, faUser);
moment.locale('fr');

/*function randomIntFromInterval(min = 3000,max = 5000) { // min and max included
    return Math.floor(Math.random()*(max-min+1)+min);
}*/

export default class Chatwitch extends Component {
    chatComponent = React.createRef();

    constructor(props) {
        super(props);
        this.state = {
            connecting: true,
            channels: [..._.uniqBy(_.compact(window.location.pathname.toLowerCase().split("/"))), process.env.REACT_APP_CHANNELID.toLowerCase()],
            channelsDetails : [],
            chatThreads: [],
            infoStreams: {},
            ignoreNotif: true,
            titleNotif: '',
            infoGames: [],
            message: '',
            channelChat: '',
            roomsStates: [],
            countdown: 0,
            audio: [],
        }

        this.player = new Audio();
        this.handleChange = this.handleChange.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.handleSelect = this.handleSelect.bind(this);

        this.badgesGlobal = {};
        this.client = new tmi.client({
            connection: { reconnect: true, secure: true },
            options: {
                debug: false,
                clientId: process.env.REACT_APP_TWITCH_CLIENTID
            },
            channels: [..._.uniqBy(_.compact(window.location.pathname.toLowerCase().split("/"))), process.env.REACT_APP_CHANNELID.toLowerCase()],
            identity: {
                username: process.env.REACT_APP_CHANNELID,
                password: process.env.REACT_APP_CHANNELOAUTH
            }
        });
        //this.clientTts = new textToSpeech.TextToSpeechClient();
    }

    async componentWillMount() {
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.audio.length > 0 && this.state.audio !== prevState.audio && this.player.paused) {
                this.player.volume = 0.4;
                this.player.src = this.state.audio[0];
                this.player.play();
                this.player.onended = () => {
                    this.setState((prevState) => {
                        return {
                            audio: prevState.audio.filter(function (value, index, arr) {
                                return value !== prevState.audio[0];
                            })
                        }
                    })
                }
        }
    }

    async getPhrase() {
        return await (await axios.post(`http://app.gregoirejoncour.xyz/https://generateur.vuzi.fr/scripts/refresh.php`)).data.match(/[^/]*/)[0];
    }

    async getTts(text) {
        return await (await axios.post(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.REACT_APP_TTS}`, {
            input: {
                ssml: '<speak>'+text+'</speak>'
            },
            voice: {
                languageCode: "fr-FR",
                ssmlGender: "MALE"
            },
            audioConfig: {
                audioEncoding:"MP3",
                speakingRate: "1.5"
            }
        })).data
    }

    async componentDidMount() {
        //GET infos streams, games ...
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

        this.client.connect();

        this.client.on("connecting", ()=>{this.setState({connecting: true})});
        this.client.on("connected", this.toogleConnectingChat.bind(this));
        this.client.on("logon", () => {
            // Do your stuff.
            console.log("logged !")
        });

        this.client.on("roomstate", (channel, state) => {
            this.setState(prevState => ( {
                roomsStates: _.values(_.merge(_.keyBy(prevState.roomsStates, 'room-id'), _.keyBy([state], 'room-id')))
            }))
            console.log("roomstate",channel, state, this.state.channelChat)
            if("#"+this.state.channelChat === channel) {
                this.setState({channelChat: this.state.channelChat})
            }

            //show in thread
            const channelDetails = _.find(this.state.channelsDetails, ['channel', channel.slice(1)]);
            let roomstate = {status: "roomstate", channel: channelDetails, state, ts_global : moment().valueOf()};
            this.setState(prevState => ( {
                chatThreads: [...prevState.chatThreads.slice(-199), roomstate]
            }));
            this.chatComponent.current.scrollToBottom();
        });

        this.client.on("emotesets", (sets, obj) => {
            console.log(sets, obj)
        }); 

        this.client.on("chat", async (channel, user, message, self)=>{
            const channelDetails = _.find(this.state.channelsDetails, ['channel', channel.slice(1)]);
            /*if(!["moobot","nightbot", "ayrob0t"].includes(user.username)){
                const tts = await this.getTts(`${user.username} dit : ${message}`.replace(/_/g, ' '));
                this.setState({audio : [...this.state.audio, 'data:audio/mpeg;base64,'+tts.audioContent]})
            }*/
            let chat = {status: "message", message, channel: channelDetails, badgesUser:[], user, ts: (user["tmi-sent-ts"] ? moment(user["tmi-sent-ts"], "x").format('LT') : moment().format('LT')), ts_global : moment().valueOf()};
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
            const channelDetails = _.find(this.state.channelsDetails, ['channel', channel.slice(1)]);
            console.log("notice", msgid,message)
            let notice = {status: "notice", channel: channelDetails, msgid, message, ts_global : moment().valueOf()};
            this.setState(prevState => ({
                chatThreads: [...prevState.chatThreads.slice(-199), notice]
            }))
            this.chatComponent.current.scrollToBottom();
        });

        this.client.on("slowmode", (channel, enabled, length) => {
            // Do your stuff.
            console.log("slowmode",channel, enabled, length)
        });

        this.client.on("disconnected", (reason) => {
            // Do your stuff.
            console.log("disconnected",reason)
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
            /*setTimeout(async () => {
                this.client.say(this.state.channelChat , await this.getPhrase());
            }, randomIntFromInterval());*/
            //this.client.say(this.state.channelChat, `aypierreFouet `);
            //if(channel === "#roi_louis")
            //    this.client.say('roi_louis',`GG @${username} aureli4Coucou`);
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
            /*setTimeout(async () => {
                this.client.say(this.state.channelChat , await this.getPhrase());
            }, randomIntFromInterval());*/
            //this.client.say(this.state.channelChat, `aypierreFouet `);
            //if(channel === "#kawautv")
            //    this.client.say('kawautv',`GG @${username} aureli4Coucou aypierreBiere`);
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
            /*setTimeout(async () => {
                this.client.say(this.state.channelChat , await this.getPhrase());
            }, randomIntFromInterval());*/
            //this.client.say(this.state.channelChat, `aypierreFouet `);
            console.log("subgift", channel, username, streakMonths, recipient, methods, userstate, senderCount)
        });

        this.client.on("anongiftpaidupgrade", (channel, username, userstate) => {
            // Do your stuff.
            console.log("anongiftpaidupgrade", channel, username, userstate)
        });

        setTimeout(() => {
            ReactTooltip.rebuild();
        }, 0);
        var intervalId = setInterval(this.getupdateinfos.bind(this), 20000);
        this.setState({intervalId: intervalId});
    }
    componentWillUnmount() {
        // use intervalId from the state to clear the interval
        clearInterval(this.state.intervalId);
    }

    async getupdateinfos() {
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

    countdownChat(timeleft) {
        let inittimeleft = timeleft;
        const intcount = setInterval(()=>{
            //document.getElementById("countdown").innerHTML = timeleft + " seconds remaining";
            timeleft -= 1;
            if(timeleft <= 0){
                this.setState({countdown: inittimeleft})
                clearInterval(intcount);
                //document.getElementById("countdown").innerHTML = "Finished"
            }
            this.setState({countdown: timeleft})
        }, 1000);
    }

    async sendMessage(event) {
        event.preventDefault();
        if(this.state.channelChat && this.state.message) {
            await this.client.say(this.state.channelChat ,this.state.message)
            this.setState({message: ""})
            this.chatComponent.current.scrollToBottom();
        }
    }
    handleChange(event) {
        this.setState({message: event.target.value})
    }
    handleSelect(event,roomstate) {
        const channelSelected = event.target.value;
        //const roomstate = _.find(this.state.roomsStates, ['channel', "#"+channelSelected]);
        //if(roomstate) {
            this.setState({channelChat: channelSelected, countdown:(roomstate && roomstate['slow'])?~~roomstate['slow']:0});
        //} else {this.setState({channelChat: ''})}
    }
    async onEnterPress(e) {
        if(e.keyCode === 13 && e.shiftKey === false) {
            this.sendMessage(e);
            /*setTimeout(async () => {
                await this.client.say(this.state.channelChat , await this.getPhrase())
            }, randomIntFromInterval());*/
            /*await this.client.say(this.state.channelChat ,`aypierreCasteur1 aypierreCasteur2 `)
            setTimeout(async() => {
                return await this.client.say(this.state.channelChat ,`aypierreCasteur3 aypierreCasteur4 `)
            }, 100);*/
            this.chatComponent.current.scrollToBottom();
        }
    }
    render() {
        const roomstate = _.find(this.state.roomsStates, ['channel', "#"+this.state.channelChat]);
        const placeholder = (roomstate && (roomstate['followers-only'] !== '-1' || roomstate['emote-only'] || roomstate['sub-only'])) ? `\nle chat est en mode ${roomstate['followers-only'] !== '-1' ? `followers-only ${roomstate['followers-only']?`(${roomstate['followers-only']}min) `:''}`:''}${roomstate['emote-only'] === true ? 'emotes-only ':''}${roomstate['subs-only'] === true ? 'sub-only':''}` : '';
        return (
            <>
                {this.state.connecting ? <p>connecting to chat irc</p> : <><Chat chatThreads={this.state.chatThreads} ref={this.chatComponent} />
                <div>
                    <div className="channels">{this.state.channelsDetails.map((channelDetail,k)=>{return(<Fragment key={k}><span data-for="info" data-tip={JSON.stringify(channelDetail.infoStream)} key={k} style={{background: "#"+intToRGB(hashCode(channelDetail.channel)), color: "white", cursor: "default"}}>{channelDetail.infoStream && "🔴 "}{channelDetail.infoChannel.display_name}</span>{k===this.state.channelsDetails.length-1 ? '':' - '}</Fragment>)})}</div>
                    <form ref={el => this.myFormRef = el} style={{display: "block"}} onSubmit={this.sendMessage}>
                        <textarea onKeyDown={this.onEnterPress.bind(this)} disabled={!roomstate} onChange={this.handleChange} style={{minWidth: "100%", maxWidth: "100%", maxHeight: "45px", minHeight: "45px",margin: 0, padding: 0, border: "none", display: "block"}} rows={3} placeholder={"envoyer un message"+placeholder} value={this.state.message} ></textarea>
                        <span style={{display: "flex"}}>
                            <button style={{display: "inline-block", height:"20px", border: "none", padding: 0, margin: 0}} type="submit">SEND</button>
                            <select onChange={this.handleSelect} style={{border: "none", display: "inline-block", verticalAlign: "top", height: "20px"}}>
                                <option value="">--Please choose a channel--</option>
                                {this.state.channelsDetails.map(obj=>{return(<option key={obj.channel} value={obj.channel}>{obj.channel}</option>)})}
                            </select>
                            <small>{((roomstate && roomstate['slow']) && 'Mode lent activé durée : '+(this.state.countdown > 0 ? this.state.countdown : roomstate['slow'])+'s')}</small>
                        </span>
                    </form>
                </div></>}

                <ReactTooltip effect="solid" id="info" place="bottom" border={true} getContent={datumAsText => {
                    if (datumAsText == null) {
                    return;
                    }
                    let v = JSON.parse(datumAsText);
                    const game = this.state.infoGames.find(o=>{return v.game_id === o.id})
                    return (
                        <div>
                            <img alt='' style={{display: "inline-block"}} src={game && game.box_art_url.replace(/(.*)({width}x{height})(.*)/,'$175x100$3')} />
                            <div style={{display: "inline-block", verticalAlign: "top", margin: "10px",width: "calc(100% - 95px)"}}>
                                <b>{v.title}</b><br/>
                                <small>{game && game.name}</small><br/>
                                <small><FontAwesomeIcon icon="clock" /> {`${moment.utc(moment()-moment(v.started_at)).format("HH[h]mm")}`} - <FontAwesomeIcon icon="user" /> {v.viewer_count.toLocaleString('en-US',{ minimumFractionDigits: 0 })}</small>
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
                splitText.splice(mote[0], 1, `<img data-for="emote" data-tip=${JSON.stringify(datajson)} style="vertical-align: middle;margin: -0.5% 0;display: inline-block;" class="emoticon" alt="${datajson.title}" src="http://static-cdn.jtvnw.net/emoticons/v1/${i}/1.0"> `);
            }
        }
    }
    return splitText.join('').replace(/(<img\s[^>]*>)(?: )(?=<)/igm, "$1").replace(/(?:^|\s)((?:http|https|ftp|ftps):\/\/[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}(\/\S*)?)/g, " <a href=$1 target='_blank' style='color: black;vertical-align: middle;'>$1</a>");
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
        <div ref={this.chatelem} style={{height: "calc(100% - 45px - 20px)", overflow: "auto"}} onWheel={this.onWheel.bind(this)}>
            {this.props.chatThreads.map((chatThread)=>{
                let thread;
                switch(chatThread.status) {
                    case "to":
                        thread = (<b style={{background: "#ffff0073", color: "black", verticalAlign: "middle"}}>@{chatThread.username} is banned for {chatThread.duration} seconds.</b>)
                        break;
                    case "notice":
                        thread = (<b style={{background: "#80808082", color: "black", verticalAlign: "middle"}}>{chatThread.message}</b>)
                        break;
                    case "roomstate":
                        thread = (<i style={{color: "black", verticalAlign: "middle"}}>Room updated {chatThread.state['emote-only']!==undefined && 'emote-only='+chatThread.state['emote-only']} {chatThread.state['followers-only']!==undefined && 'followers-only='+chatThread.state['followers-only']} {chatThread.state['slow']!==undefined && 'slow='+chatThread.state['slow']} {chatThread.state['subs-only']!==undefined && 'subs-only='+chatThread.state['subs-only']}</i>)
                        break;
                    case "ban":
                        thread = (<b style={{background: "red", verticalAlign: "middle"}}>@{chatThread.username} is BANNED.</b>)
                        break;
                    case "message":
                        thread = (<><small style={{color: "grey", verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.ts}</small> {chatThread.badgesUser.map((badgeUser, k)=>{return <img key={k} src={badgeUser && badgeUser.image_url_1x} alt="" title={badgeUser && badgeUser.title} style={{verticalAlign: "middle",lineHeight: "28px"}} />})} <span style={{color: chatThread.user.color, fontWeight: "bold",verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.user["display-name"]}:</span> <span style={chatThread.user["message-type"] === "action" ? {color: chatThread.user.color,verticalAlign: "top",lineHeight: "28px"}:{verticalAlign: "top",lineHeight: "28px"}} dangerouslySetInnerHTML={{ __html: formatEmotes(chatThread.message, chatThread.user.emotes) }} /></>)
                        break;
                    case "subscription":
                        thread = (<>
                        <small style={{color: "grey", verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.ts}</small> {chatThread.badgesUser.map((badgeUser, k)=>{return <img key={k} src={badgeUser && badgeUser.image_url_1x} alt="" title={badgeUser && badgeUser.title} style={{verticalAlign: "middle",lineHeight: "28px"}} />})} <span style={{color: chatThread.user.color, fontWeight: "bold",verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.user["display-name"]}:</span> <span style={chatThread.user["message-type"] === "action" ? {color: chatThread.user.color,verticalAlign: "top",lineHeight: "28px", fontWeight: "bold"}:{verticalAlign: "top",lineHeight: "28px", fontWeight: "bold"}}>{chatThread.method.planName} ({chatThread.method.plan}) - c'est le 1er mois d'abonnement de {"@"+chatThread.user["display-name"]} !!!</span>
                        </>)
                        break;
                    case "resub":
                        thread = (<><small style={{color: "grey", verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.ts}</small> {chatThread.badgesUser.map((badgeUser, k)=>{return <img key={k} src={badgeUser && badgeUser.image_url_1x} alt="" title={badgeUser && badgeUser.title} style={{verticalAlign: "middle",lineHeight: "28px"}} />})} <span style={{color: chatThread.user.color, fontWeight: "bold",verticalAlign: "middle",lineHeight: "28px"}}>{chatThread.user["display-name"]}:</span> <span style={chatThread.user["message-type"] === "action" ? {color: chatThread.user.color,verticalAlign: "top",lineHeight: "28px", fontWeight: "bold"}:{verticalAlign: "top",lineHeight: "28px", fontWeight: "bold"}}>{chatThread.methods.planName} ({chatThread.methods.plan}) - c'est le {chatThread.cumulativeMonths}e mois d'abonnement de @{chatThread.user["display-name"]} !!!</span> {chatThread.message && <span style={chatThread.user["message-type"] === "action" ? {color: chatThread.user.color,verticalAlign: "top",lineHeight: "28px"}:{verticalAlign: "top",lineHeight: "28px"}} dangerouslySetInnerHTML={{ __html: formatEmotes(chatThread.message, chatThread.user.emotes) }} />}</>)
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