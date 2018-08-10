import React, { Component } from 'react'
import socket from 'socket.io-client';
import Req from '../modules/Req';
import moment from 'moment/min/moment-with-locales';
import '../assets/css/style.css';
import { Link } from 'react-router-dom';

export default class Notification extends Component {
  constructor(props) {
    super(props);

    const io = socket(`${window.location.protocol}//${window.location.hostname}:8080`);
    this.state = {
      surat_baru : false
    }
    moment.locale('id');
  }

  update = (id) => {
    Req.put(`/api/update_baca_surat/${id}`, {dibaca : 1}).then((resp) => {
      console.log(resp.data);
      this.props.notifCheck();
    });
  }

  render() {
    // const {notif} = this.state;
    // console.log(this.state);
    const notifs = this.props.notif.map((item, index) =>
      <React.Fragment key={item.id}>
        <Link alt={item.id} to={`/dashboard/surat/review/${item.id}`} onClick={() => {
          this.update(item.id);
        }} className={
          (!item.dibaca) ? "dropdown-item active" : "dropdown-item"
        }>
          <strong alt={item.id} >{item.nama_depan} {item.nama_belakang} mengirim surat baru</strong>
          <span alt={item.id} className={
            (item.dibaca) ? "float-right small text-muted" : "float-right small text-white"
          }>{ moment(item.tanggal).fromNow() }</span>
          <div className="dropdown-message small">{item.subjek}</div>
        </Link>
        <div className="dropdown-divider m-0"></div>
      </React.Fragment>
    );
    return (
      <React.Fragment>
        <li className="nav-item dropdown">
          <a href="javascript:void(0)" data-toggle="dropdown" className="nav-link dropdown-toggle" id="notification">
            <i className="fa fa-envelope fa-lg"></i>
            {false && <span className="indicator text-danger d-none d-lg-block"><i className="fa fa-fw fa-circle"></i></span>}
          </a>
          <div className="dropdown-menu dropdown-menu-right">
            <h6 className="dropdown-header">Surat baru :</h6>
            <div className="dropdown-divider"></div>
            {notifs}
            <div className="dropdown-divider"></div>
            <div className="dropdown-item small">Lihat semua</div>
          </div>
        </li>
      </React.Fragment>
    )
  }
}
