import React, { Component } from 'react';
import _ from "lodash";
import { WidthProvider, Responsive } from "react-grid-layout";
import Twitch from './Twitch';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

import '../node_modules/react-resizable/css/styles.css';
import '../node_modules/react-grid-layout/css/styles.css'
import './App.css';
const ResponsiveReactGridLayout = WidthProvider(Responsive);
const originalLayouts = getFromLS("layouts") || {};
library.add(faTimes)

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
      isEditMode: false,
      mounted: false
    };

    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.resetLayout = this.resetLayout.bind(this);
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
    this.addPseudo = this.addPseudo.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.showOverlay = this.showOverlay.bind(this);
    this.hideOverlay = this.hideOverlay.bind(this);
    this.onEditChange = this.onEditChange.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragStop = this.onDragStop.bind(this);
  }

  componentDidMount() {
    this.setState({ mounted: true });
  }

  generateDOM() {
    return _.map(this.state.layout, (l,k) => {
      return (
        <div key={l.i} data-grid={l} style={this.state.isEditMode?{border:'5px solid #7354ad', outline: '5px dashed #5a3a93', outlineOffset: '-5px', cursor:'grab'}:''}>
          <div className="header-player" style={{display: this.state.isEditMode?"block":"none"}}>{l.channel}</div>
          {/*<iframe
            title={k}
            style={{
              height: "calc(100%)",
              width: "calc(100%)"
            }}
            src={`https://embed.twitch.tv?channel=${l.channel}&playsinline=true&theme=dark&chat=mobile&layout=video-with-chat&referrer=${window.location.href}`}
            frameBorder="0"
            scrolling="no"
            allowFullScreen={true}
          />*/ }
          <Twitch style={{ height: "calc(100%)", width: "calc(100%)"}} channel={l.channel} targetID={`twitch-embed-${l.channel}`}/>
          {/*<iframe frameborder="0"
            scrolling="no"
            id="chat_embed"
            src={`https://www.twitch.tv/embed/${l.channel}/chat?darkpopout`}
            height="100%"
            width="250">
          </iframe>*/}
          <div className="overlay" style={{width:'100%', height:'100%', position: "absolute", top:0, right:0, display: this.state.showOverlay?"block":"none"}}></div>
          <button
            className="remove"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              cursor: "pointer",
              backgroundColor: "#6441A4",
              border: "none"
            }}
            onClick={this.onRemoveItem.bind(this, l)}
          >
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
      );
    });
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
        channel: item
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

  onEditChange(e) {
    if(e.target.checked){
      this.setState({isEditMode: true});
    } else {
      this.setState({isEditMode: false});
    }
  }

  onDragStart(layout, oldItem, newItem, placeholder, e, element) {
    this.showOverlay();
    element.style.cursor = "grabbing";
  }

  onDragStop(layout, oldItem, newItem, placeholder, e, element) {
    this.hideOverlay();
    element.style.cursor = "grab";
  }

  render() {
    return (
      <div>
        <ResponsiveReactGridLayout
          margin={[10,10]}
          containerPadding={[10,10]}
          onLayoutChange={this.onLayoutChange}
          onResize={this.onResize}
          layouts={this.state.layouts}
          onBreakpointChange={this.onBreakpointChange}
          onResizeStart={this.showOverlay}
          onResizeStop={this.hideOverlay}
          onDragStart={this.onDragStart}
          onDragStop={this.onDragStop}
          measureBeforeMount={true}
          {...this.props}
        >
          {this.generateDOM()}
        </ResponsiveReactGridLayout>
        <button onClick={this.resetLayout}>Reset Layout</button>
        <form onSubmit={this.addPseudo}>
          <input type="text" value={this.state.input} onChange={ this.handleChange } placeholder="pseudo stream"/><button type="submit" disabled={this.state.input.length <= 0 || this.state.pseudos.find((v,k) => v === this.state.input)}>Ajouter</button>
        </form>
        <label htmlFor="edit-mode">Mode Edition</label><input onChange={this.onEditChange} type="checkbox" name="edit-mode" id="edit-mode"/>
      </div>
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
