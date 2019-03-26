import React, { Component } from 'react';
import NewWindow from 'react-new-window';
import tmi from 'tmi.js';
import axios from 'axios';
import _ from 'lodash';

export default class Welcome extends Component {
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
                "twitchpresentsfr"
            ],
            channelsDetails : [],
            chatThreads: [],
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
                "twitchpresentsfr"
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
        _.map(this.state.channels, async (channel)=> {
            dd[channel]=await this.getBadgeLink(channel)
        })
        this.setState({channelsDetails: dd})
        console.log(this.state.channelsDetails)
    }

    componentDidMount() {
        this.client.on("chat", (channel, user, message, self)=>{
            let chat = {status: "message", message, channel:{name:channel, display_name: this.state.channelsDetails[channel.slice(1)].display_name}, badgesUser:[], user};
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

    async getBadgeLink(channel) {
        const infoChannel = (await axios.get(`https://api.twitch.tv/helix/users?login=${channel}`, {
            headers: {
                'Client-ID': process.env.REACT_APP_TWITCH_CLIENTID
            }
        })).data;
        const badgesChannel = (await axios.get(`https://badges.twitch.tv/v1/badges/channels/${infoChannel.data[0].id}/display?language=fr`)).data;
        return {id: infoChannel.data[0].id, display_name: infoChannel.data[0].display_name, badges:{...this.badgesGlobal.badge_sets, ...badgesChannel.badge_sets}}
    }

    scrollToBottom = () => {
        this.messagesEnd.current.scrollIntoView({ behavior: 'smooth' })
    }

    parseFormatEmotes(text, emotes, key) {
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
                    splitText.splice(mote[0], 1, <img key={key-mote[0]} alt="" style={{verticalAlign: "text-top"}} className="emoticon" title={text.slice(mote[0],mote[1]+1)} src={`http://static-cdn.jtvnw.net/emoticons/v1/${i}/1.0`} />);
                }
            }
        }
        return splitText;
    }

    altr(message, emotes) {
        for(var i in emotes) {
            var e = emotes[i];
            for(var j in e) {
                var mote = e[j];
                mote = mote.split('-');
                    mote = [parseInt(mote[0]), parseInt(mote[1])];
                var length =  mote[1] - mote[0];
                var re = new RegExp(`(.{${mote[0]}}).{${length+1}}`,"g");
                message = message.replace(re, "ddsd");
                console.log(message)
            }
        }
        return message;
    }

    render() {
        return (
            <NewWindow
                features={ { left: (window.innerWidth / 2) - (600 / 2), top: (window.innerHeight / 2) - (600 / 2), width: 600, height: 600 } }
            >
                <p>{this.state.connecting && "connecting to chat irc"}</p>
                {this.state.chatThreads.map((chatThread,k)=>{
                    let thread;
                    if(chatThread.status === "to"){
                        thread = (<>@{chatThread.username} you are timed out for {chatThread.duration} seconds. </>)
                    }
                    if(chatThread.status === "ban"){
                        thread = (<>@{chatThread.username} you are BANNED. </>)
                    }
                    if(chatThread.status === "message"){
                        thread = (<>{chatThread.badgesUser.map((badgeUser, k)=>{return <img key={k} src={badgeUser.image_url_1x} alt="" title={badgeUser.title} style={{verticalAlign:"text-bottom"}} />})} <span style={{color: chatThread.user.color, fontWeight: "bold"}}>{chatThread.user["display-name"]}</span> : {this.altr(chatThread.message, chatThread.user.emotes)} </>)
                    }
                    return (<div key={k} style={{minHeight: "28px"}}><span style={{background: "#"+intToRGB(hashCode(chatThread.channel.name)), color: "white"}}>{chatThread.channel.display_name}</span> {thread} </div>);
                })}
                <div ref={this.messagesEnd} />
            </NewWindow>
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

/*function formatEmotes(text, emotes) {
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
                splitText.splice(mote[0], 1, '<img class="emoticon" title="'+text.slice(mote[0],mote[1]+1)+'" src="http://static-cdn.jtvnw.net/emoticons/v1/' + i + '/1.0">');
            }
        }
    }
    return splitText.join('');
}*/