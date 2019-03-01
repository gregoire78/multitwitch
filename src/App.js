import React, { Component } from 'react';
import _ from "lodash";
import NewWindow from 'react-new-window';
import axios from 'axios';
import moment from 'moment';
import localization from 'moment/locale/fr';
import IntervalTimer from 'react-interval-timer';
import { WidthProvider, Responsive } from "react-grid-layout";
//import Twitch from './Twitch';
import MyIcon from './Combo_Purple_RGB.svg'

import { CSSTransition } from 'react-transition-group';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faEdit, faLayerGroup, faPlus, faAngleDoubleRight, faAngleDoubleLeft, faSignOutAlt, faHandshake, faClock } from '@fortawesome/free-solid-svg-icons'
import { faTwitch } from '@fortawesome/free-brands-svg-icons';

import '../node_modules/react-resizable/css/styles.css';
import '../node_modules/react-grid-layout/css/styles.css'
import './App.css';
import GridTwitch from './GridTwitch';
const ResponsiveReactGridLayout = WidthProvider(Responsive);
const originalLayouts = getFromLS("layouts") || {};
library.add(faTimes, faEdit, faLayerGroup, faPlus, faAngleDoubleRight, faAngleDoubleLeft, faTwitch, faSignOutAlt, faHandshake, faClock);
moment.locale('fr', localization);

class App extends Component {
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
      isAuth: localStorage.getItem('token'),
      streams: []
    };

    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.resetLayout = this.resetLayout.bind(this);
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
    this.addPseudo = this.addPseudo.bind(this);
    this.handleChange = this.handleChange.bind(this);
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

  componentDidMount() {
    if(window.location.hash) {
      let search = window.location.hash.substring(1);
      search = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
      localStorage.setItem('token', search.access_token)
      window.close();
    }
    if(this.state.isAuth) {
      this.getFollowedStream();
    }
    document.body.style.backgroundImage = "url("+MyIcon+")";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundSize = "contain";
    document.body.style.backgroundAttachment = "fixed";
    this.setState({ mounted: true });
  }

  /*generateDOM() {
    return _.map(this.state.layout, (l,k) => {
      return (
        <div key={l.i} data-grid={l} style={this.state.isEditMode?{padding:'5px', outline: '5px dashed #5a3a93', outlineOffset: '-5px', cursor:'grab'}:''}>
          <div className="header-player" style={{marginTop: this.state.isEditMode?"5px":"0"}}>{this.state.isEditMode?l.channel:''}</div>
          <Twitch style={{ height: "calc(100%)", width: "calc(100%)"}} channel={l.channel} targetID={`twitch-embed-${l.channel}`} layout="video-with-chat"/>
          <div className="overlay" style={{width:'100%', height:'100%', position: "absolute", top:0, right:0, display: this.state.showOverlay?"block":"none"}}></div>
          <button
            className="remove"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              cursor: "pointer",
              color: "rgba(255, 255, 255, 0.6)",
              backgroundColor: this.state.isEditMode?"#5a3a93":"transparent",
              border: "none",
              width: "20px",
              height: "20px",
              borderRadius: this.state.isEditMode?"0 0 0 8px":"0"
            }}
            onClick={this.onRemoveItem.bind(this, l)}
          >
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
      );
    });
  }*/

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
    this.setState({ layouts: {} });
  }

  onLayoutChange(layout, layouts) {
    saveToLS("layouts", layouts);
    this.setState({ layouts });
    //this.props.onLayoutChange(layout);
  }

  onRemoveItem(l) {
    let pseudos = _.reject(this.state.pseudos, ( value, key ) => {return value === l.channel});
    let layout = _.reject(this.state.layout, { i: l.i });
    this.setState({ pseudos, layout});
    window.history.replaceState('','',`${window.origin}/${pseudos.join('/')}`);
  }

  addPseudo(event){
    event.preventDefault();
    const pseudos = this.state.pseudos;
    if(this.state.input.length > 0) {
      window.history.replaceState('','',`${window.location}${window.location.href.slice(-1) === '/' ? '' : '/'}${this.state.input}`);
      pseudos.push(this.state.input);
      let layout = this.generateLayout(pseudos)
      this.setState({pseudos, input: '', layout});
    }
  }

  handleChange(e) {
    this.setState({ input: e.target.value.trim().toLowerCase() });
  }

  onResize(layout, oldLayoutItem, layoutItem, placeholder, e, element) {
    element.style.cursor = "se-resize";
    // `oldLayoutItem` contains the state of the item before the resize.
    // You can modify `layoutItem` to enforce constraints.
    /*if (layoutItem.h < 3 && layoutItem.w > 2) {
      layoutItem.w = 2;
      placeholder.w = 2;
    }

    if (layoutItem.h >= 3 && layoutItem.w < 2) {
      layoutItem.w = 2;
      placeholder.w = 2;
    }*/
    //console.log(element.parentElement)
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

  /*openPopup() {
    const width = 600, height = 600
    const left = (window.innerWidth / 2) - (width / 2)
    const top = (window.innerHeight / 2) - (height / 2)
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=wkyn43dnz5yumupaqv8vwkz1j4thi1&redirect_uri=http://localhost:3000/&response_type=token&scope=user_read`

    return window.open(url, '',
      `toolbar=no, location=no, directories=no, status=no, menubar=no,
      scrollbars=no, resizable=no, copyhistory=no, width=${width},
      height=${height}, top=${top}, left=${left}`
    )
  }*/

  handleWindow() {
    this.setState(prevState => ({
      opened: !prevState.opened
    }));
  }

  logout() {
    this.setState({isAuth: false, streams: []});
    localStorage.removeItem('token');
  }

  handleClosePopup() {
    this.setState({opened: false, isAuth: localStorage.getItem('token') && true});
    this.getFollowedStream();
  }

  getFollowedStream() {
    axios.get(`https://api.twitch.tv/kraken/streams/followed`, {
      headers: {
        'Authorization': `OAuth ${localStorage.getItem('token')}`,
        'Client-ID': 'wkyn43dnz5yumupaqv8vwkz1j4thi1'
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
    }
  }

  render() {
    const { opened, isEditMode, input, pseudos, isCollapse, showOverlay, layout, layouts, isAuth, streams } = this.state
    return (
      <>
        { opened &&
          <NewWindow
            onUnload={this.handleClosePopup.bind(this)}
            url={`https://id.twitch.tv/oauth2/authorize?client_id=wkyn43dnz5yumupaqv8vwkz1j4thi1&redirect_uri=https://twitch.gregoirejoncour.xyz/&response_type=token&scope=user_read`}
            features={ { left: (window.innerWidth / 2) - (600 / 2), top: (window.innerHeight / 2) - (600 / 2), width: 600, height: 600 } }
          >
            <h5>Here is a textbox. Type something in it and see it mirror to the parent.</h5>
          </NewWindow>
        }

        <CSSTransition
          in={this.state.isCollapse}
          classNames="header"
          timeout={300}
        >
          <header>
            <nav>
              <button onClick={this.resetLayout}><FontAwesomeIcon icon="layer-group" /></button>
              <button onClick={this.handleEdit}><FontAwesomeIcon icon="edit" color={isEditMode ? "lightgrey" : ''} /></button>

              <form onSubmit={this.addPseudo}>
                <input type="text" value={input} onChange={ this.handleChange } placeholder="channel twitch"/>
                <button type="submit" disabled={input.length <= 0 || pseudos.find((v,k) => v === input)}><FontAwesomeIcon icon="plus" /></button>
              </form>

              {!isAuth ?
              <button onClick={this.handleWindow} title="Login to twitch account"><FontAwesomeIcon icon={["fab","twitch"]} /></button> :
              <button onClick={this.logout} title="Logout"><FontAwesomeIcon icon="sign-out-alt" /></button>
              }
              <button onClick={this.onToogleCollapse}><FontAwesomeIcon icon={isCollapse ? "angle-double-right" : "angle-double-left"} /></button>
            </nav>

            {(!_.isEmpty(streams) && isEditMode) &&
            <nav className="streams">
                <p style={{textAlign: "center", background: "#b34646", cursor: "default"}}>ON AIR</p>
                {_.map(streams, (v,k) => {
                  return (
                    <p key={k} onClick={this.addFollow.bind(this, v.channel.name)} title={`${v.channel.status} - ${v.game} - ${v.channel.broadcaster_language}${v.channel.mature ? " - 🔞" : ""}`}>
                      <img alt="logo" height={22} src={v.channel.logo} /> {v.channel.display_name} <FontAwesomeIcon icon="clock" color="lightgrey" title={`live depuis ${moment.utc(moment()-moment(v.created_at)).format("HH[h et ]mm[min]")}`} />{/*v.channel.partner && <FontAwesomeIcon icon="handshake" color="#BA55D3" title="partner" size="xs" />*/}
                    </p>
                  )
                })}
            </nav>}
            <IntervalTimer
              timeout={10000}
              callback={this.getFollowedStream.bind(this)}
              enabled={!isCollapse && isEditMode}
              repeat={true}
            />
          </header>
        </CSSTransition>

        {pseudos.length > 0 ?
        <ResponsiveReactGridLayout
          margin={[10,10]}
          containerPadding={[10,10]}
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
          {_.map(layout, (l,k) => {
            return (
              <div key={l.i} data-grid={l} style={isEditMode && {padding:'5px', outline: '5px dashed #5a3a93', outlineOffset: '-5px'}}>
                <GridTwitch isEditMode={isEditMode} showOverlay={showOverlay} l={l} onRemoveItem={this.onRemoveItem} />
              </div>
            )
          })
          }
        </ResponsiveReactGridLayout> : ''}
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

export default App;
