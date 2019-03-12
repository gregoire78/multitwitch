import React, { Component } from 'react';
import { observer } from "mobx-react";
import _ from 'lodash';
import NewWindow from 'react-new-window';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/fr';
import ReactGA from 'react-ga';
import { withCookies, Cookies } from 'react-cookie';
import { instanceOf } from 'prop-types';
import IntervalTimer from 'react-interval-timer';
import { WidthProvider, Responsive } from "react-grid-layout";
//import Twitch from './Twitch';
import MyIcon from './Combo_Purple_RGB.svg';

import { CSSTransition } from 'react-transition-group';

import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faEdit, faLayerGroup, faPlus, faAngleDoubleRight, faAngleDoubleLeft, faSignOutAlt, faHandshake, faClock } from '@fortawesome/free-solid-svg-icons';
import { faTwitch, faGithub } from '@fortawesome/free-brands-svg-icons';

import '../node_modules/react-resizable/css/styles.css';
import '../node_modules/react-grid-layout/css/styles.css';
import './App.css';
import GridTwitch from './GridTwitch';
import Welcome from './Welcome';
import SearchBox from './SearchBox';
const ResponsiveReactGridLayout = WidthProvider(Responsive);
const originalLayouts = getFromLS("layouts") || {};
library.add(faTimes, faEdit, faLayerGroup, faPlus, faAngleDoubleRight, faAngleDoubleLeft, faTwitch, faSignOutAlt, faHandshake, faClock, faGithub);
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
    const { cookies } = props;

    // get pseudo from url
    const urlparse = _.uniqBy(_.compact(window.location.pathname.split("/")));
    this.state = {
      layouts: JSON.parse(JSON.stringify(originalLayouts)),
      layout: this.generateLayout(urlparse),
      pseudos: urlparse,
      input: '',
      showOverlay: false,
      isEditMode: true,
      mounted: false,
      isCollapse: false,
      opened: false,
      user: {},
      isAuth: cookies.get('token') && cookies.get('token').length > 0,
      streams: []
    };

    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.resetLayout = this.resetLayout.bind(this);
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
    this.addPseudo = this.addPseudo.bind(this);
    this.showOverlay = this.showOverlay.bind(this);
    this.hideOverlay = this.hideOverlay.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragStop = this.onDragStop.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.onToogleCollapse = this.onToogleCollapse.bind(this);
    this.onRemoveItem = this.onRemoveItem.bind(this);
    this.handleWindow = this.handleWindow.bind(this);
    this.logout = this.logout.bind(this);
  }

  async componentDidMount() {
    ReactGA.initialize(process.env.REACT_APP_GTAG_ID, {
      debug: process.env.NODE_ENV !== 'production'
    });
    ReactGA.pageview(window.location.pathname);
    //this.compononentLoginWindow();
    if(this.state.isAuth) {
      this.setState({user: (await this.getTwitchUser()).data[0]});
      this.getFollowedStream();
    }
    document.body.style.backgroundImage = "url("+MyIcon+")";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundSize = "contain";
    document.body.style.backgroundAttachment = "fixed";
    this.setState({ mounted: true });
  }

  componentWillMount() {
    const { cookies } = this.props;
    if(window.location.hash) {
      document.body.display="none";
      let search = window.location.hash.substring(1);
      search = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
      if('access_token' in search) {
        //set cookie to save twitch token
        cookies.set('token', search.access_token, {expires: moment().add(1, 'year').toDate(), domain: process.env.REACT_APP_DOMAIN});
      }
      window.close();
    }
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

  onBreakpointChange(newBreakpoint, newCols){
  }

  resetLayout() {
    saveToLS("layouts", {});
    this.setState({ layouts: {} });
  }

  onLayoutChange(layout, layouts) {
    if(this.state.pseudos.length){
      saveToLS("layouts", layouts);
      this.setState({ layouts });
    }
    //this.props.onLayoutChange(layout);
  }

  onRemoveItem(l) {
    let pseudos = _.reject(this.state.pseudos, ( value, key ) => {return value === l.channel});
    let layout = _.reject(this.state.layout, { i: l.i });
    this.setState({ pseudos, layout});
    window.history.replaceState('','',`${window.origin}/${pseudos.join('/')}`);
    ReactGA.pageview(window.location.pathname);
  }

  addPseudo(event){
    const pseudo = this.state.input.trim().toLowerCase()
    event.preventDefault();
    if(pseudo.length > 0) {
      this.addFollow(pseudo);
      this.setState({input: ''});
    }
  }

  onResize(layout, oldLayoutItem, layoutItem, placeholder, e, element) {
    element.style.cursor = "se-resize";
  }

  showOverlay() {
    this.setState({showOverlay:true})
  }
  hideOverlay() {
    this.setState({showOverlay:false})
  }

  handleEdit() {
    this.setState(prevState => ({
      isEditMode: !prevState.isEditMode
    }));
  }

  onDragStart(layout, oldItem, newItem, placeholder, e, element) {
    this.showOverlay();
    element.style.cursor = "grabbing";
  }

  onDragStop(layout, oldItem, newItem, placeholder, e, element) {
    this.hideOverlay();
    element.style.cursor = "grab";
  }

  onToogleCollapse() {
    this.setState(prevState => ({
      isCollapse: !prevState.isCollapse
    }));
    if(this.state.isCollapse && this.state.isAuth) {this.getFollowedStream()}
  }

  handleWindow() {
    this.setState(prevState => ({
      opened: !prevState.opened
    }));
  }

  async getTwitchUser(){
    return (await axios.get(`https://api.twitch.tv/helix/users`, {
      headers: {
        'Authorization': `Bearer ${this.props.cookies.get('token')}`,
        'Client-ID': process.env.REACT_APP_TWITCH_CLIENTID
      }
    })).data;
  }

  async revokeTwitchToken(token) {
    await axios.post(`https://id.twitch.tv/oauth2/revoke?client_id=${process.env.REACT_APP_TWITCH_CLIENTID}&token=${token}`)
  }

  async logout() {
    const { cookies } = this.props;
    await this.revokeTwitchToken(cookies.get('token'))
    this.setState({isAuth: false, streams: [], user: {}});
    cookies.remove('token', {domain: process.env.REACT_APP_DOMAIN});
  }

  async handleClosePopup() {
    if(this.props.cookies.get('token')){
      this.setState({opened: false, isAuth: this.props.cookies.get('token').length > 0, user: (await this.getTwitchUser()).data[0]});
      this.getFollowedStream();
    } else {
      this.setState({opened: false})
    }
  }

  getFollowedStream() {
    axios.get(`https://api.twitch.tv/kraken/streams/followed`, {
      headers: {
        'Authorization': `OAuth ${this.props.cookies.get('token')}`,
        'Client-ID': process.env.REACT_APP_TWITCH_CLIENTID
      }
    } ).then(res => {
        const streams = _.orderBy(res.data.streams, 'channel.name');
        this.setState({ streams });
      })
  }

  addFollow(name){
    const pseudos = this.state.pseudos;
    if(!_.includes(this.state.pseudos, name)) {
      window.history.replaceState('','',`${window.location}${window.location.href.slice(-1) === '/' ? '' : '/'}${name}`);
      pseudos.push(name);
      let layout = this.generateLayout(pseudos)
      this.setState({pseudos, layout});
      ReactGA.pageview(window.location.pathname);
    }
  }

  render() {
    const { opened, isEditMode, input, pseudos, isCollapse, showOverlay, layout, layouts, isAuth, streams, user } = this.state
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
          in={this.state.isCollapse}
          classNames="header"
          timeout={300}
        >
          <header>
            <nav>
              <form onSubmit={this.addPseudo}>
                <SearchBox placeholder="Search a channel" queryCallback={(query)=>this.setState({input: query})} input={input}/>
                <button type="submit" disabled={input.length <= 0 || pseudos.find((v,k) => v === input)}><FontAwesomeIcon icon="plus" /></button>
              </form>

              <button onClick={this.resetLayout}><FontAwesomeIcon icon="layer-group" title="reset layout"/></button>
              <button onClick={this.onToogleCollapse} className="collapse-btn"><FontAwesomeIcon icon={isCollapse ? "angle-double-right" : "angle-double-left"} /></button>
              {isAuth ? <button onClick={this.onToogleCollapse} className="img-profile" style={{backgroundImage: `url(${user.profile_image_url})`, backgroundSize: '24px 24px'}}></button> : <button onClick={this.handleWindow} title="connect your twitch account"><FontAwesomeIcon icon={["fab","twitch"]} /></button>}
              <button onClick={this.handleEdit}><FontAwesomeIcon icon="edit" color={!isEditMode ? "lightgrey" : ''} /></button>
            </nav>

            {(!_.isEmpty(streams) && isEditMode) &&
            <nav className="streams">
                <p style={{textAlign: "center", background: "#b34646", cursor: "default", height: "24px"}}><button onClick={this.logout} title="Logout" style={{position: "absolute",left: 0}}><FontAwesomeIcon icon="sign-out-alt" /></button><span style={{lineHeight: "24px"}}>{user.display_name}</span></p>
                {_.map(streams, (v,k) => {
                  return (
                    <p key={k} onClick={this.addFollow.bind(this, v.channel.name)} title={`${v.channel.status} - ${v.game} - ${v.channel.broadcaster_language}${v.channel.mature ? " - 🔞" : ""}`}>
                      <img alt="logo" height={22} src={v.channel.logo} /> {v.channel.display_name} <FontAwesomeIcon icon="clock" color="lightgrey" title={`live depuis ${moment.utc(moment()-moment(v.created_at)).format("HH[h et ]mm[m]")}`} />{/*v.channel.partner && <FontAwesomeIcon icon="handshake" color="#BA55D3" title="partner" size="xs" />*/}
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
            onBreakpointChange={this.onBreakpointChange}
            onResizeStart={this.showOverlay}
            onResizeStop={this.hideOverlay}
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
          <Welcome isAuth={isAuth} user={user} handleWindow={this.handleWindow} logout={this.logout}/>
        }
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

export default observer(withCookies(App));
