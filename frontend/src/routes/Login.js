import React, { Component, Fragment } from 'react'
import Req from '../modules/Req';
// import axios from 'axios';
import $ from 'jquery';
import socket from '../modules/socket';
window.jQuery = $;
window.$ = $;

export default class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {
      username : '',
      password : ''
    };

    // axios.defaults.baseURL = `${window.location.protocol}//${window.location.hostname}:8080`;

    this.updateUsername = this.updateUsername.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.login = this.login.bind(this);
    this.props.login(false);
  }

  updateUsername = (event) => {
    this.setState({username : event.target.value});
  }

  updatePassword = (event) => {
    this.setState({password : event.target.value});
  }

  login = (ev) => {
    ev.preventDefault();
    const {username, password} = this.state;
    if (!username && !password) {
      let username = document.querySelector('input[type="text"]');
      let password = document.querySelector('input[type="password"]');

      username.className = "form-control is-invalid";
      password.className = "form-control is-invalid";
    } else {
      Req.post('/api/login', this.state).then((resp) => {
        if (!resp.data.msg)
        {
          localStorage.setItem('x-access-token', resp.data.token);
          Req.defaults.headers = {
            'x-access-token' : resp.data.token
          }
          localStorage.setItem('auth', JSON.stringify(resp.data));
          socket.emit('login', resp.data);
          this.props.login(true);
        }
        else
        {
          $('#alert').slideToggle();
          setTimeout(() => {
            $('#alert').slideToggle();
          }, 2500);
          this.props.login(false);
        }
      });
    }
  }

  render() {
    document.title = "Login eSurat"
    let {username, password} = this.state;
    return (
      <Fragment>
        <div className="mb-4"></div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-4">
              <div className="card o-hidden">
                <div className="card-header">
                  <p className="mb-0">eSurat</p>
                </div>
                <div className="card-body p-3">
                  <div className="card-body-icon text-dark"><i className="fa fa-sign-in fa-lg"></i></div>
                  <form action="" className="form-group">
                    <label htmlFor="username" className="mb-0 control-label">Username</label>
                    <input type="text" placeholder="Username" id="username" value={username} onChange={this.updateUsername} className="form-control"/>
                    <label htmlFor="password" className="control-label mb-0">Password</label>
                    <input type="password" placeholder="Password" id="password" value={password} onChange={this.updatePassword} className="form-control"/>
                    <hr/>
                    <button type="submit" onClick={this.login} className="btn btn-success btn-sm">Login</button>
                    <div className="alert alert-danger" id="alert">User tidak ada</div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    )
  }
}
