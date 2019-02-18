import React, { Component } from 'react';
const EMBED_URL = 'https://embed.twitch.tv/embed/v1.js';

export default class Twitch extends Component {
    componentDidMount() {
      let embed;
      const script = document.createElement('script');
      script.setAttribute(
        'src',
        EMBED_URL
      );
      script.addEventListener('load', () => {
        embed = new window.Twitch.Embed(this.props.targetID, { ...this.props });
      });
      document.body.appendChild(script);
      return embed;
    }
  
    render() {
      return (
        <div style={this.props.style} id={this.props.targetID}></div>
      )
    }
  }

Twitch.defaultProps = {
    targetID: 'twitch-embed',
    width: '100%',
    height: '100%',
    theme: 'dark'
}