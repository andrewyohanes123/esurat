import React, {Component, Fragment} from 'react';
import {Route, Switch} from 'react-router-dom';
import BrowserRouter from 'react-router-dom/BrowserRouter';
import Login from './routes/Login';
import Dashboard from './routes/Dashboard';
import Sidebar from './components/Sidebar';
import Content from './components/Content';
import Approved from './components/dashboard/Approved';
import Pending from './components/dashboard/Pending';
import Profile from './components/dashboard/Profile';
import BuatSurat from './components/dashboard/BuatSurat';
import ReviewSurat from './components/dashboard/ReviewSurat';
import ScanQrcode from './components/dashboard/ScanQrcode';
import Users from './components/dashboard/Users';
import Ditolak from './components/dashboard/Ditolak';

import Popper from 'popper.js';
import 'bootstrap/dist/js/bootstrap.bundle';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/sb-admin.css';
import './assets/css/font-awesome.css';
import './App.css';
import $ from 'jquery';
import Redirect from 'react-router-dom/Redirect';
window.jQuery = $;
window.$ = $;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedin : false
    };
    this.loggedin = this.loggedin.bind(this);
    this.check = this.check.bind(this);
  }

  componentWillMount = () => {
    var user = localStorage.getItem('auth');
    this.setState({auth_user : JSON.parse(user)});
    this.check();
  }

  componentDidMount = () => {
    this.check();
  }

  check = () => {
    if (localStorage.getItem('auth') && localStorage.getItem('x-access-token')) {
      this.setState({loggedin : true});
    } else {
      this.setState({loggedin : false});
    }
    this.setState({auth_user : JSON.parse(localStorage.getItem('auth'))});
  }

  loggedin = (condition) => {
    this.setState({loggedin : condition});
  }

  render() {
    const {loggedin, auth_user} = this.state;
    // if (loggedin) {
    //   return <Redirect to="/dashboard" />
    // }
    return (
      <Fragment>
        <BrowserRouter>
          <Switch>
            <Route path="/" exact render={
              () => {
                return (loggedin) ? (<Redirect to='/dashboard' />) : (<Login login={this.loggedin} />)
              }
            }/>
            <Route path="/dashboard" exact render={
              () => {
                const user = JSON.parse(localStorage.getItem('auth'));
                if (user.user_type === 'admin') return (<Redirect to="/dashboard/users" />)
                return (loggedin) ? (
                <Dashboard >
                  <Sidebar user={user}>
                    <Content />
                  </Sidebar>
                </Dashboard>
              ) : (<Redirect to='/' />)
              }
            } />
            <Route path="/dashboard/surat/approved" exact render={
              () => {
                return (
                <Dashboard>
                  <Sidebar user={auth_user}>
                    <Approved/>
                  </Sidebar>
                </Dashboard>
                );
              }
            }/>
            <Route path="/dashboard/surat/pending" exact render={
              () => {
                return (
                <Dashboard>
                  <Sidebar user={auth_user}>
                    <Pending/>
                  </Sidebar>
                </Dashboard>
                );
              }
            }/>
            <Route path="/dashboard/profile" exact render={
              () => {
                return (
                  <Dashboard>
                    <Sidebar user={auth_user}>
                      <Profile/>
                    </Sidebar>
                  </Dashboard>
                )
              }
            } />
            <Route path="/dashboard/surat/buat" exact render={
              () => {
                const user = JSON.parse(localStorage.getItem('auth'));
                return (user['user_type'] == 'skpd') ?
                (<Dashboard>
                  <Sidebar user={user}>
                    <BuatSurat/>
                  </Sidebar>
                </Dashboard>) : (<Redirect to="/dashboard" />)
              }
            } />
            <Route path="/dashboard/surat/review/:id" render={
              (props) => {
                const user = JSON.parse(localStorage.getItem('auth'));
                const {id} = props.match.params;
                // return (user['user_type'] == 'skpd') ?
                return (<Dashboard>
                  <Sidebar user={user}>
                    <ReviewSurat id={id} />
                  </Sidebar>
                </Dashboard>)
              }
            } />
            <Route path="/dashboard/surat/scan/qrcode" render={
              (props) => {
                const user = JSON.parse(localStorage.getItem('auth'));
                const {id} = props.match.params;
                // return (user['user_type'] == 'skpd') ?
                return (<Dashboard>
                  <Sidebar user={user}>
                    <ScanQrcode />
                  </Sidebar>
                </Dashboard>)
              }
            } />
            <Route path="/dashboard/users" render={
              () => {
                const user = JSON.parse(localStorage.getItem('auth'));
                return (user.user_type === 'admin') ? (
                  <Dashboard>
                    <Sidebar user={user}>
                      <Users />
                    </Sidebar>                    
                  </Dashboard>
                ) : (<Redirect to="/dashboard" />)
              }
            } />
            <Route path="/dashboard/surat/ditolak" exact render={
              () => {
                const user = JSON.parse(localStorage.getItem('auth'));
                return (
                  <Dashboard>
                    <Sidebar user={user}>
                      <Ditolak />
                    </Sidebar>                    
                  </Dashboard>
                )
              }
            } />
          </Switch>
        </BrowserRouter>
      </Fragment>
    );
  }
}

export default App;
