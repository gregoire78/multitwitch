import React, { Component } from 'react';
import _ from "lodash";
import { WidthProvider, Responsive } from "react-grid-layout";
import './App.css';
import '../node_modules/react-resizable/css/styles.css';
import '../node_modules/react-grid-layout/css/styles.css'

const ResponsiveReactGridLayout = WidthProvider(Responsive);
const originalLayouts = getFromLS("layouts") || {};

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

    this.state = {
      layouts: JSON.parse(JSON.stringify(originalLayouts)),
      pseudos: _.compact(window.location.pathname.split("/")),
      input: '',
      showOverlay: false,
    };

    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.resetLayout = this.resetLayout.bind(this);
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
    this.addPseudo = this.addPseudo.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.showOverlay = this.showOverlay.bind(this);
    this.hideOverlay = this.hideOverlay.bind(this);
  }

  componentWillMount() {
  }

  generateDOM() {
   const layout = this.generateLayout(this.state.pseudos);
    return _.map(layout, (l,k) => {
      return (
        <div key={k} data-grid={l} style={{ padding: 5 }}>
          <iframe
            title={k}
            style={{
              height: "calc(100%)",
              width: "calc(100%)"
            }}
            src={`https://embed.twitch.tv?channel=${l.channel}&playsinline=true&theme=dark&referrer=${window.location.href}`}
            frameBorder="0"
            scrolling="no"
            allowFullScreen={true}
          />
          <div className="overlay" style={{width:'100%', height:'100%', position: "absolute", top:0, right:0, display: this.state.showOverlay?"block":"none"}}></div>
          {/*<iframe frameborder="0"
            scrolling="no"
            id="chat_embed"
            src={`https://www.twitch.tv/embed/${l.channel}/chat?darkpopout`}
            height="100%"
            width="250">
          </iframe>*/}
        </div>
      );
    });
  }

  generateLayout(pseudos) {
    //const p = this.props;
    return _.map(pseudos, function(item, i) {
      const w = 6;
      const h = 14;
      return {
        x: Math.floor((i * 12/2) % 12),
        y: Math.floor(i / 6),
        w: w,
        h: h,
        i: i.toString(),
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

  addPseudo(event){
    event.preventDefault();
    const pseudos = this.state.pseudos;
    if(this.state.input.length > 0) {
      window.history.replaceState('','',`${window.location}${window.location.href.slice(-1) === '/' ? '' : '/'}${this.state.input}`);
      pseudos.push(this.state.input);
      this.setState({pseudos, input: ''});
    }
  }

  handleChange(e) {
    this.setState({ input: e.target.value.toLowerCase() });
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
    console.log(element.parentElement)
  }

  showOverlay() {
    this.setState({showOverlay:true})
  }
  hideOverlay() {
    this.setState({showOverlay:false})
  }

  render() {
    return (
      <div>
        <ResponsiveReactGridLayout
          margin={[0,0]}
          containerPadding={[5,5]}
          onLayoutChange={this.onLayoutChange}
          onResize={this.onResize}
          layouts={this.state.layouts}
          onBreakpointChange={this.onBreakpointChange}
          onResizeStart={this.showOverlay}
          onResizeStop={this.hideOverlay}
          onDragStart={this.showOverlay}
          onDragStop={this.hideOverlay}
          {...this.props}
        >
          {this.generateDOM()}
        </ResponsiveReactGridLayout>
        <button onClick={this.resetLayout}>Reset Layout</button>
        <form onSubmit={this.addPseudo}>
          <input type="text" value={this.state.input} onChange={ this.handleChange } placeholder="pseudo stream"/><button type="submit" disabled={this.state.input.length <= 0}>Ajouter</button>
        </form>
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
