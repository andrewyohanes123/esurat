import React, { Component, Fragment } from 'react'
import moment from 'moment';
import UserMenu from './UserMenu';
import NotificationSKPD from './NotificationSKPD';
import Notification from './Notification';
import {NavLink} from 'react-router-dom';
import socket from '../modules/socket';
import Req from '../modules/Req';
import $ from 'jquery';
// import '../assets/js/sb-admin.min.js';
window.jQuery = $;
window.$ = $;

export default class Sidebar extends Component {  
  constructor(props) {
    super(props);
    this.state = {
      auth : JSON.parse(localStorage.getItem('auth')),
      notif : [],
      notifSKPD : [],
      notification : {
        nama_depan : "",
        nama_belakang : ""
      }
    }
    this.notifCheck = this.notifCheck.bind(this);
  }
  componentWillMount () {
    const {nama_depan, nama_belakang} = this.state.auth
    document.title = nama_depan + " " + nama_belakang;
  }

  componentWillMount() {
    if (this.state.auth.user_type === 'pimpinan')
    {
      this.notifCheck();
    }
    else if (this.state.auth.user_type === 'skpd')
    {
      this.notifSKPD();
    }
  }

  notifCheck = () => {
    Req.get('/api/cek_notifikasi', {
      headers : {
        'x-access-token' : localStorage.getItem('x-access-token')
      }
    }).then((resp) => {
      const notif = resp.data
      this.setState({ notif });
    });
  }

  notifSKPD = () => {
    const {id} = this.state.auth;
    Req.get(`/api/cek_notifikasi_skpd/${id}`, {
      headers : {
        'x-access-token' : localStorage.getItem('x-access-token')
      }
    }).then((resp) => {
      const notifSKPD = resp.data;
      this.setState({ notifSKPD });
    });
  }



  render() {    
    const {skpd, user_type} = this.state.auth;
    const {notification} = this.state;
    let user = {
      nama_depan : "",
      nama_belakang : ""
    };
    socket.emit('login', this.state.auth);
    socket.on('surat baru', (msg) => {
      user = msg;
      this.setState({ notification : msg });
      $('.notif').css('display', 'flex');
      setTimeout(() => {
        $('.notif').fadeOut();
      }, 4000);
      this.notifCheck();
    });
    socket.on('approve surat', (msg) => {
      user = msg;
      this.setState({ notification : msg.approved_by });
      this.notifSKPD();
      $('.notif').css('display', 'flex');
      setTimeout(() => {
        $('.notif').fadeOut();
      }, 4000);
    });
    return (
      <Fragment>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top" id="mainNav">        
          <a href="javascript:void(0)" className="navbar-brand">eSurat</a>
          <button className="navbar-toggler" data-toggle="collapse" data-target="#navbar">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbar">
            <ul className="navbar-nav ml-auto">
              { user_type === 'pimpinan' &&
                <Fragment>
                  <Notification notifCheck={this.notifCheck} notif={this.state.notif}/>
                </Fragment>
              }
              {
                user_type === 'skpd' &&
                <Fragment> 
                  <NotificationSKPD notif={this.state.notifSKPD} />
                </Fragment>
              }
              <UserMenu />
            </ul>
            <ul className="navbar-nav navbar-sidenav" id="exampleAccordion">
              {user_type !== 'admin' && <li className="nav-item">
                <NavLink exact to="/dashboard" className="nav-link" data-toggle="tooltip" data-placement="right" data-original-title="Dashboard">
                  <i className="fa fa-dashboard fa-lg"></i>&nbsp;
                  <span className="nav-link-text">Dashboard</span>
                </NavLink>
              </li>}
              {skpd !== null && user_type !== 'admin' &&
                (<li className="nav-item">              
                <NavLink exact className="nav-link" to="/dashboard/surat/buat">
                  <i className="fa fa-envelope-o fa-lg"></i>&nbsp;
                  Buat surat
                </NavLink>
                </li>)
              }
              {user_type !== 'admin' && <li className="nav-item">
                <a href="javascript:void(0)" className="nav-link nav-link-collapse collapsed" data-toggle="collapse" href="#surat" data-parent="#exampleAccordion">
                  <span className="nav-link-text"><i className="fa fa-envelope fa-lg"></i>&nbsp;Surat</span>
                </a>
                <ul className="sidenav-second-level collapse" id="surat">
                  <li><NavLink to="/dashboard/surat/approved"><i className="fa fa-check-square fa-sm"></i>&nbsp;Approve</NavLink></li>
                  <li><NavLink to="/dashboard/surat/pending"><i className="fa fa-times fa-sm"></i>&nbsp;Pending</NavLink></li>
                </ul>
              </li>}
              { user_type === 'admin' && 
                <li className="nav-item">
                  <NavLink className="nav-link" to="/dashboard/users">
                    <i className="fa fa-user-circle-o fa-lg"></i>&nbsp;Users
                  </NavLink>
                </li>
              }
            </ul>
          </div>
        </nav>
        { (user_type === 'pimpinan') ?
          <div className="notif">
            <div className="notif-icon"><i className="fa fa-bell"></i></div>
            <div className="notif-body">{notification.nama_depan} {notification.nama_belakang} mengirim surat baru</div>
          </div>
          :
          <div className="notif">
            <div className="notif-icon"><i className="fa fa-bell"></i></div>
            <div className="notif-body">{notification.nama_depan} {notification.nama_belakang} menerima surat {notification.nomor_surat}</div>
        </div>
        }
        <div className="content-wrapper">
          {this.props.children}          
        </div>
        <footer className="sticky-footer">
          <div className="container">
            <div className="text-center"><small>Copyright &copy; Andrew Yohanes { moment().format("YYYY") }</small></div>
          </div>
        </footer>
      </Fragment>
    )
  }
}
