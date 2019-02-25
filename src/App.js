import React, { Component } from 'react';
import _ from "lodash";
import { WidthProvider, Responsive } from "react-grid-layout";
import Twitch from './Twitch';
import MyIcon from './Combo_Purple_RGB.svg'

import { CSSTransition } from 'react-transition-group';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faEdit, faLayerGroup, faPlus, faAngleDoubleRight, faAngleDoubleLeft } from '@fortawesome/free-solid-svg-icons'

import '../node_modules/react-resizable/css/styles.css';
import '../node_modules/react-grid-layout/css/styles.css'
import './App.css';
const ResponsiveReactGridLayout = WidthProvider(Responsive);
const originalLayouts = getFromLS("layouts") || {};
library.add(faTimes, faEdit, faLayerGroup, faPlus, faAngleDoubleRight, faAngleDoubleLeft)

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
      isCollapse: false
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
  }

  componentDidMount() {
    document.body.style.backgroundImage = "url("+MyIcon+")";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundSize = "contain";
    document.body.style.backgroundAttachment = "fixed";
    this.setState({ mounted: true });
  }

  generateDOM() {
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
  }

  render() {
    return (
      <div>
        <CSSTransition
          in={this.state.isCollapse}
          classNames="header"
          timeout={300}
        >
          <header>
            <button onClick={this.resetLayout}><FontAwesomeIcon icon="layer-group" /></button>
            <button onClick={this.handleEdit}><FontAwesomeIcon icon="edit" color={this.state.isEditMode ? "black" : "grey"} /></button>

            <form onSubmit={this.addPseudo}>
              <input type="text" value={this.state.input} onChange={ this.handleChange } placeholder="channel twitch"/>
              <button type="submit" disabled={this.state.input.length <= 0 || this.state.pseudos.find((v,k) => v === this.state.input)}><FontAwesomeIcon icon="plus" /></button>
            </form>

            <button onClick={this.onToogleCollapse}><FontAwesomeIcon icon={this.state.isCollapse ? "angle-double-right" : "angle-double-left"} /></button>
          </header>
        </CSSTransition>

        {this.state.pseudos.length > 0 ?
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
        </ResponsiveReactGridLayout> : ''}
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
