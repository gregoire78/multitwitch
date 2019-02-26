import React, { Component, Fragment } from 'react';

import Twitch from './Twitch';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faEdit, faLayerGroup, faPlus, faAngleDoubleRight, faAngleDoubleLeft, faComment, faCommentSlash } from '@fortawesome/free-solid-svg-icons'
library.add(faTimes, faEdit, faLayerGroup, faPlus, faAngleDoubleRight, faAngleDoubleLeft, faComment, faCommentSlash);

export default class GridTwitch extends Component {

    constructor(props) {
        super(props);

        this.state = {
            isVideoWChat: true
        }

        this.handleVideoWChat = this.handleVideoWChat.bind(this);
    }

    handleVideoWChat() {
        this.setState(prevState => ({
            isVideoWChat: !prevState.isVideoWChat
        }));
    }

    render() {
        return (
            <Fragment>
                <div className="header-player" style={{marginTop: this.props.isEditMode?"5px":"0"}}>{this.props.isEditMode?this.props.l.channel:''}</div>
                <Twitch style={{ height: "calc(100%)", width: "calc(100%)"}} channel={this.props.l.channel} targetID={`twitch-embed-${this.props.l.channel}`} layout={this.state.isVideoWChat?"video-with-chat":"video"}/>
                <div className="overlay" style={{width:'100%', height:'100%', position: "absolute", top:0, right:0, display: this.props.showOverlay?"block":"none"}}></div>
                <button
                    className="remove"
                    style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    cursor: "pointer",
                    color: "rgba(255, 255, 255, 0.6)",
                    backgroundColor: this.props.isEditMode?"#5a3a93":"transparent",
                    border: "none",
                    width: "20px",
                    height: "20px",
                    }}
                    onClick={this.props.onRemoveItem.bind(this, this.props.l)}
                >
                    <FontAwesomeIcon icon="times" />
                </button>
                {this.props.isEditMode?<button
                    className="chat"
                    style={{
                    position: "absolute",
                    right:0,
                    top: 20,
                    cursor: "pointer",
                    color: "rgba(255, 255, 255, 0.6)",
                    backgroundColor: "#6441A4",
                    border: "none",
                    width: "20px",
                    height: "20px",
                    padding:0
                    }}
                    onClick={this.handleVideoWChat}
                >
                    <FontAwesomeIcon icon={this.state.isVideoWChat?"comment":"comment-slash"} />
                </button>:''}
            </Fragment>
        )
    }
}