import React, { Component } from 'react';
import { WidthProvider, Responsive } from "react-grid-layout";
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { faTwitch, faGithub } from '@fortawesome/free-brands-svg-icons';

library.add(faTwitch, faSignOutAlt, faGithub);
const ResponsiveReactGridLayout = WidthProvider(Responsive);

export default class Welcome extends Component {
    render() {
        const { isAuth, user } = this.props;
        return (
            <ResponsiveReactGridLayout
                className="layout"
                isResizable={true}
                onDragStart={(layout, oldItem, newItem, placeholder, e, element) => { element.style.cursor = "grabbing"; }}
                onDragStop={(layout, oldItem, newItem, placeholder, e, element) => { element.style.cursor = "grab"; }}
                compactType={null}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                preventCollision={true}
                cols={{ lg: 12, md: 12, sm: 6, xs: 6, xxs: 6 }}>
                <div key="welcome" className="welcome" data-grid={{ x: 3, y: 1, w: 6, h: 3, minH: 3, minW: 6 }}>
                    <h1>Welcome to MultiTwitch.co</h1>
                    <p>
                        In MultiTwitch.co you can watch a multi streams of <a href="https://twitch.tv/" target="_blank" rel="noopener noreferrer" style={{ fontSize: "1em" }}>twitch.tv</a>.
                    </p>
                    <p>Simply add the channel ID in <i>"Search a channel"</i> input at the top of the page or in the url. <br /><i>(ex: <a href={`${window.location.origin}/peteur_pan/psykaoz`}>multitwitch.co/peteur_pan/psykaoz/other_channel_id</a>)</i></p>
                    <p style={{ textAlign: "center" }}>or</p>
                    <p>You can also connect your twitch account to watch live of followed channels.</p>
                    <p>
                        {!isAuth ?
                            <button onClick={this.props.handleWindow} title="Login to your twitch account"><FontAwesomeIcon icon={["fab", "twitch"]} /> Connect your Twitch account</button>
                            :
                            <>Congratulation <span style={{ background: "rgb(130, 107, 173)" }}><img src={user.profile_image_url} alt="" style={{ height: "21px", verticalAlign: "top", backgroundColor: "black" }} /> {user.display_name} </span>&nbsp;you are connected ! <button onClick={this.props.logout}>logout <FontAwesomeIcon icon="sign-out-alt" /></button></>}
                    </p>
                    <small>Created by Grégoire Joncour - <a href="https://github.com/gregoire78/multitwitch" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={["fab", "github"]} /> view the project on github</a> - &copy; 2019-{new Date().getFullYear()} multitwitch.co</small>
                </div>
            </ResponsiveReactGridLayout>
            /*<div className="main-welcome">
                <div className="welcome">
                    <h1>Welcome to MultiTwitch.co</h1>
                    <p>
                        In MultiTwitch.co you can watch a multi streams of twitch.tv.
                        </p>
                    <p>Simply add the channel ID in <i>"channel twitch"</i> input at the top of the page. (ex: peteur_pan)</p>
                    <p style={{ textAlign: "center" }}>or</p>
                    <p>You can also connect your twitch account to watch live of followed channels.</p>
                    <button>Connect my Twitch account</button>
                </div>
            </div>*/
        )
    }
}