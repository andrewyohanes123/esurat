import React, { Component } from 'react'
import Link from 'react-router-dom/Link';
import Req from '../modules/Req';
import App from '../App';

export default class UserMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      auth_user : {}
    }

    this.logout = this.logout.bind(this);
    this.loadProfile = this.loadProfile.bind(this);
  }

  componentWillMount() {
    const user = localStorage.getItem('auth');
    this.setState({auth_user : JSON.parse(user)});
  }

  loadProfile = () => {
    Req.get(`/api/get_profile/${this.state.auth_user.id}`, {
      headers : {
        'x-access-token' : localStorage.getItem('x-access-token')
      }
    }).then(resp => {
      localStorage.setItem('auth', JSON.stringify(resp.data));
      this.setState({auth_user : resp.data});
    });
  }

  logout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('x-access-token');
    App.setState({loggedin : false});
  }

  render() {
    const {auth_user} = this.state;
    const imgAPI = `${window.location.protocol}//${window.location.hostname}:8080/api/images/`
    return (
      <React.Fragment>
        <li className="nav-item dropdown">
          <a href="javascript:void(0)" className="nav-link dropdown-toggle" data-toggle="dropdown" id="user">{auth_user.nama_depan} {auth_user.nama_belakang}</a>
          <div className="dropdown-menu dropdown-menu-right" aria-labelledby="#">
            <Link to="/dashboard/profile" className="dropdown-item">
              <div className="row">
                <div className="col-sm-3 pl-0 pr-0">
                    <img src={`${imgAPI}foto_profil/${auth_user.foto_profil}`} alt="" className="w-100 rounded-circle"/>
                </div>
                <div className="col-sm-9">
                  <strong>{auth_user.username}</strong>
                  <div className="dropdown-message small">{auth_user.jabatan}</div>
                </div>
              </div>
            </Link>
            <div className="dropdown-divider"></div>
            <Link onClick={this.logout} to="/" className="dropdown-item"><i className="fa fa-sign-out fa-xs"></i>&nbsp;Logout</Link>
          </div>
        </li>
      </React.Fragment>
    )
  }
}
