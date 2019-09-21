import React, { Component } from 'react';
import {observer} from "mobx-react";
import _ from 'lodash';
import NewWindow from 'react-new-window';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/fr';
import ReactGA from 'react-ga';
import ReactTooltip from 'react-tooltip';
import { withCookies, Cookies } from 'react-cookie';
import { instanceOf } from 'prop-types';
import IntervalTimer from 'react-interval-timer';
import { WidthProvider, Responsive } from "react-grid-layout";
//import Twitch from './Twitch';
//import MyIcon from './Combo_Purple_RGB.svg';

import { CSSTransition } from 'react-transition-group';

import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faEdit, faLayerGroup, faPlus, faAngleDoubleRight, faAngleDoubleLeft, faSignOutAlt, faHandshake, faClock, faEye, faUser } from '@fortawesome/free-solid-svg-icons';
import { faTwitch, faGithub } from '@fortawesome/free-brands-svg-icons';

import '../node_modules/react-resizable/css/styles.css';
import '../node_modules/react-grid-layout/css/styles.css';
import './App.css';
import GridTwitch from './GridTwitch';
import Welcome from './Welcome';
import SearchBox from './SearchBox';
const ResponsiveReactGridLayout = WidthProvider(Responsive);
const originalLayouts = getFromLS("layouts") || {};
library.add(faTimes, faEdit, faLayerGroup, faPlus, faAngleDoubleRight, faAngleDoubleLeft, faTwitch, faSignOutAlt, faHandshake, faClock, faGithub, faEye, faUser);
moment.locale('fr');

class App extends Component {
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };
  static defaultProps = {
    isDraggable: true,
    isResizable: true,
    rowHeight: 30,
    cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    preventCollision: false,
    verticalCompact: true,
    compactType: "vertical"
  };

  constructor(props) {
    super(props);
    const { cookies, person } = props;

    // get pseudo from url
    const urlparse = _.uniqBy(_.compact(window.location.pathname.split("/")));
    
    person.layouts = JSON.parse(JSON.stringify(originalLayouts));
    person.layout = this.generateLayout(urlparse);
    person.pseudos = urlparse;
    person.isAuth = cookies.get('token') && cookies.get('token').length > 0;
    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.resetLayout = person.resetLayout.bind(person, saveToLS);
    this.addPseudo = this.addPseudo.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragStop = this.onDragStop.bind(this);
    this.handleEdit = person.handleEdit.bind(person, this.toolTipRebuild.bind(this));
    this.onToogleCollapse = person.onToogleCollapse.bind(person, this.getFollowedStream.bind(this));
    this.onRemoveItem = this.onRemoveItem.bind(this);
    this.handleWindow = person.handleWindow.bind(person);
    this.logout = person.logout.bind(person, cookies, this.revokeTwitchToken.bind(this));
    this.toogleOverlay = person.toogleOverlay.bind(person);
  }

  async componentDidMount() {
    ReactGA.initialize(process.env.REACT_APP_GTAG_ID, {
      debug: process.env.NODE_ENV !== 'production'
    });
    ReactGA.pageview(window.location.pathname);
    //this.compononentLoginWindow();
    if(this.props.person.isAuth){
      const twitchUser = await this.getTwitchUser();
      if(twitchUser) {
        this.props.person.user = twitchUser.data[0];
        this.getFollowedStream();
      }
    }
    this.props.person.mounted = true;
  }

  componentWillMount() {
    const { cookies } = this.props;
    if(window.location.hash) {
      document.body.innerHTML = "";
      document.body.style.display = "none";
      let search = window.location.hash.substring(1);
      search = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
      if('access_token' in search) {
        //set cookie to save twitch token
        cookies.set('token', search.access_token, {expires: moment().add(1, 'year').toDate(), domain: process.env.REACT_APP_DOMAIN});
      }
      window.close();
    }
  }

  toolTipRebuild() {
    setTimeout(() => {
      ReactTooltip.rebuild();
    }, 0);
  }

  generateLayout(pseudos) {
    //const p = this.props;
    return _.map(pseudos, (item, i) => {
      const w = 6;
      const h = 14;
      return {
        x: Math.floor((i * 12/2) % 12),
        y: Infinity,
        w: w,
        h: h,
        i: item,
        channel: item,
        draggableHandle: ".react-grid-dragHandleExample"
      };
    });
  }

  onLayoutChange(layout, layouts) {
    if(this.props.person.pseudos.length){
      saveToLS("layouts", layouts);
      this.props.person.layouts = layouts;
    }
    //this.props.onLayoutChange(layout);
  }

  onRemoveItem(l) {
    let pseudos = _.reject(this.props.person.pseudos, ( value, key ) => {return value === l.channel});
    this.props.person.layout = _.reject(this.props.person.layout, { i: l.i });
    this.props.person.pseudos = pseudos;
    window.history.replaceState('','',`${window.origin}/${pseudos.join('/')}`);
    ReactGA.pageview(window.location.pathname);
  }

  addPseudo(event){
    const pseudo = this.props.person.queryFormat;
    event.preventDefault();
    if(pseudo.length > 0) {
      this.addFollow(pseudo);
      this.props.person.query = '';
    }
  }

  onResize(layout, oldLayoutItem, layoutItem, placeholder, e, element) {
    element.style.cursor = "se-resize";
  }

  onDragStart(layout, oldItem, newItem, placeholder, e, element) {
    this.toogleOverlay(true);
    element.style.cursor = "grabbing";
  }

  onDragStop(layout, oldItem, newItem, placeholder, e, element) {
    this.toogleOverlay(false);
    element.style.cursor = "grab";
  }

  async getTwitchUser(){
    try{
      return (await axios.get(`https://api.twitch.tv/helix/users`, {
        headers: {
          'Authorization': `Bearer ${this.props.cookies.get('token')}`,
          'Client-ID': process.env.REACT_APP_TWITCH_CLIENTID
        }
      })).data;
    } catch(error) {
      await this.props.person.logout(this.props.cookies);
      return false;
    }
  }

  async revokeTwitchToken(token) {
    try {
      await axios.post(`https://id.twitch.tv/oauth2/revoke?client_id=${process.env.REACT_APP_TWITCH_CLIENTID}&token=${token}`)
    } catch(error) {
      return true;
    }
  }

  async handleClosePopup() {
    if(this.props.cookies.get('token')){
      this.props.person.isAuth = this.props.cookies.get('token').length > 0;
      this.props.person.user = (await this.getTwitchUser()).data[0];
      this.props.person.opened = false;
      this.getFollowedStream();
    } else {
      this.props.person.opened = false;
    }
  }

  getFollowedStream() {
    axios.get(`https://api.twitch.tv/kraken/streams/followed`, {
      headers: {
        'Accept': 'application/vnd.twitchtv.v5+json',
        'Authorization': `OAuth ${this.props.cookies.get('token')}`,
        'Client-ID': process.env.REACT_APP_TWITCH_CLIENTID
      }
    }).then(res => {
      const streams = _.orderBy(res.data.streams, 'channel.name');
      this.props.person.streams = streams;
      ReactTooltip.rebuild();
    })
  }

  addFollow(name){
    const pseudos = this.props.person.pseudos;
    if(!_.includes(pseudos, name)) {
      window.history.replaceState('','',`${window.location}${window.location.href.slice(-1) === '/' ? '' : '/'}${name}`);
      pseudos.push(name);
      let layout = this.generateLayout(pseudos)
      this.props.person.pseudos = pseudos;
      this.props.person.layout = layout;
      ReactGA.pageview(window.location.pathname);
    }
  }

  render() {
    const { isEditMode, isCollapse, isAuth, user, streams, opened, showOverlay, query, pseudos, layout, layouts} = this.props.person;
    return (
      <>
        { opened &&
          <NewWindow
            onUnload={this.handleClosePopup.bind(this)}
            url={`https://id.twitch.tv/oauth2/authorize?client_id=${process.env.REACT_APP_TWITCH_CLIENTID}&redirect_uri=${process.env.REACT_APP_TWITCH_URI}&response_type=token&scope=user_read`}
            features={ { left: (window.innerWidth / 2) - (600 / 2), top: (window.innerHeight / 2) - (600 / 2), width: 600, height: 600 } }
          >
            <h5 style={{color: "white"}}>Connecting to twitch id</h5>
          </NewWindow>
        }

        <CSSTransition
          in={isCollapse}
          classNames="header"
          timeout={300}
        >
          <header>
            <nav>
              <form onSubmit={this.addPseudo}>
                <SearchBox placeholder="Search a channel" person={this.props.person}/>
                <button type="submit" disabled={query.length <= 0 || pseudos.find((v,k) => v === query)}><FontAwesomeIcon icon="plus" /></button>
              </form>

              <button onClick={this.resetLayout}><FontAwesomeIcon icon="layer-group" title="reset layout"/></button>
              <button onClick={this.onToogleCollapse} className="collapse-btn"><FontAwesomeIcon icon={isCollapse ? "angle-double-right" : "angle-double-left"} /></button>
              {isAuth ? <button onClick={this.onToogleCollapse} className="img-profile"><img src={user.profile_image_url} height={24} alt="" /></button> : <button onClick={this.handleWindow} title="connect your twitch account"><FontAwesomeIcon icon={["fab","twitch"]} /></button>}
              <button onClick={this.handleEdit}><FontAwesomeIcon icon="edit" color={!isEditMode ? "lightgrey" : ''} /></button>
            </nav>

            {(isAuth && isEditMode) &&
            <nav className="streams">
                <p style={{textAlign: "center", background: "#b34646", cursor: "default", height: "24px"}}><button onClick={()=>{this.logout().then(()=>ReactTooltip.hide()); }} title="Logout" style={{position: "absolute",left: 0}}><FontAwesomeIcon icon="sign-out-alt" /></button><span style={{lineHeight: "24px"}}>{user.display_name}</span></p>
                {!_.isEmpty(streams) &&
                _.map(streams, (v,k) => {
                  return (
                    <p key={k} onClick={this.addFollow.bind(this, v.channel.name)} data-for="status" data-tip={JSON.stringify(v)} /*data-tip={`${v.channel.status} - ${v.game} - ${v.channel.broadcaster_language}${v.channel.mature ? " - 🔞" : ""}`}*/ >
                      <img alt="" height={22} src={v.channel.logo} /> {v.channel.display_name}{/*v.channel.partner && <FontAwesomeIcon icon="handshake" color="#BA55D3" title="partner" size="xs" />*/}
                    </p>
                  )
                })}
            </nav>}

            <IntervalTimer
              timeout={10000}
              callback={this.getFollowedStream.bind(this)}
              enabled={!isCollapse && isEditMode && isAuth}
              repeat={true}
            />
          </header>
        </CSSTransition>

        {pseudos.length > 0 ?
          <ResponsiveReactGridLayout
            margin={[10, 10]}
            containerPadding={[10, 10]}
            onLayoutChange={this.onLayoutChange}
            onResize={this.onResize}
            layouts={layouts}
            onResizeStart={()=>this.toogleOverlay(true)}
            onResizeStop={()=>this.toogleOverlay(false)}
            onDragStart={this.onDragStart}
            onDragStop={this.onDragStop}
            measureBeforeMount={true}
            {...this.props}
          >
            {_.map(layout, (l, k) => {
              return (
                <div key={l.i} data-grid={l} style={isEditMode && { padding: '5px', outline: '5px dashed #5a3a93', outlineOffset: '-5px' }}>
                  <GridTwitch isEditMode={isEditMode} showOverlay={showOverlay} l={l} onRemoveItem={this.onRemoveItem} />
                </div>
              )
            })
            }
          </ResponsiveReactGridLayout>
        :
          <Welcome isAuth={isAuth} user={user} handleWindow={this.handleWindow} logout={this.logout} />
        }

        <ReactTooltip id="status" place="right" border={true} className="extraClass" getContent={datumAsText => {
          if (datumAsText == null) {
            return;
          }
          let v = JSON.parse(datumAsText);
          return (
            <div>
              <img style={{display: "inline-block"}} alt="" src={`https://static-cdn.jtvnw.net/ttv-boxart/${v.game}-40x55.jpg`} />
              <div style={{display: "inline-block", verticalAlign: "top", margin: "0 0 0 10px",overflow: "hidden",textOverflow: "ellipsis", whiteSpace: "nowrap",width: "calc(100% - 50px)"}}>
                <b>{v.channel.status}</b><br/>
                {v.game} - {v.channel.broadcaster_language.toUpperCase()}{v.channel.mature ? " - 🔞" : ""}<br/>
                <small><FontAwesomeIcon icon="clock" /> {`${moment.utc(moment()-moment(v.created_at)).format("HH[h]mm")}`} - <FontAwesomeIcon icon="user" /> {v.viewers.toLocaleString('en-US',{ minimumFractionDigits: 0 })}</small>
              </div><br/>
              <img  style={{display: "block"}} alt="" src={v.preview.small} />
            </div>
          );
        }} />
      </>
    );
  }
}

function getFromLS(key) {
  let ls = {};
  if (global.localStorage) {
    try {
      ls = JSON.parse(global.localStorage.getItem("rgl-7")) || {};
    } catch (e) {
      /*Ignore*/
    }
  }
  return ls[key];
}

function saveToLS(key, value) {
  if (global.localStorage) {
    global.localStorage.setItem(
      "rgl-7",
      JSON.stringify({
        [key]: value
      })
    );
  }
}

export default withCookies(observer(App));
