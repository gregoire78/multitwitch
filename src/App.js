import React, { Component } from 'react';
import _ from "lodash";
import { WidthProvider, Responsive } from "react-grid-layout";
import './App.css';

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
      input: ''
    };

    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.resetLayout = this.resetLayout.bind(this);
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
    this.addPseudo = this.addPseudo.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentWillMount() {
  }

  generateDOM() {
   const layout = this.generateLayout(this.state.pseudos);
    return _.map(layout, function(l,k) {
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

  addPseudo(){
    const pseudos = this.state.pseudos;
    pseudos.push(this.state.input);
    window.history.replaceState('','',`${window.location}/${this.state.input}`);
    this.setState({pseudos, input: ''});
  }

  handleChange(e) {
    this.setState({ input: e.target.value });
  }

  onResize(layout, oldLayoutItem, layoutItem, placeholder) {
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
          {...this.props}
        >
          {this.generateDOM()}
        </ResponsiveReactGridLayout>
        <button onClick={this.resetLayout}>Reset Layout</button>
        <input type="text" value={this.state.input} onChange={ this.handleChange }/><button onClick={this.addPseudo}>Ajouter</button>
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
