import { useEffect } from "react";
import { withCookies } from "react-cookie";
import { useHistory } from "react-router-dom";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

function Redirect({ cookies }) {
  const history = useHistory();
  useEffect(() => {
    let search = window.location.hash.substring(1);
    if (search != "") {
      search = JSON.parse(
        '{"' +
          decodeURI(search)
            .replace(/"/g, '\\"')
            .replace(/&/g, '","')
            .replace(/=/g, '":"') +
          '"}'
      );
      if ("access_token" in search) {
        //set cookie to save twitch token
        cookies.set("token", search.access_token, {
          expires: dayjs()
            .add(dayjs.duration({ months: 1 }))
            .toDate(),
          domain: window.location.hostname,
        });
      }
    }
    if (window.opener && window.opener !== window) {
      window.close();
    }
    history.replace("/");
  }, [cookies, history]);
  return null;
}

Redirect.propTypes = {
  cookies: PropTypes.any,
};

export default withCookies(Redirect);
