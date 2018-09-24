import React, { Component } from 'react'
import socket from '../modules/socket';
import moment from 'moment/min/moment-with-locales';
import '../assets/css/style.css';
import Link from 'react-router-dom/Link';

export default class NotificationSKPD extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notif_baru : false
    }
    moment.locale('id');
  }

  render() {
    socket.emit('login', JSON.parse(localStorage.getItem('auth')));
    socket.on('tolak surat', (data) => {
      this.setState({ notif_baru : true });
    });
    let action = 'menerima';
    const notifs = this.props.notif.map((item, index) =>
      <React.Fragment key={item.id}>
        <Link to={`/dashboard/surat/review/${item.id}`} className="dropdown-item">
          <strong>{item.nama_depan} {item.nama_belakang} {(item.ditolak === 1) ? 'menolak' : 'menerima'} surat</strong>
          <span className="float-right small text-muted">{ moment(item.tanggal_approved).format('DD MMM YYYY') }</span>
          <div className="dropdown-message small">{item.subjek}</div>
        </Link>
        <div className="dropdown-divider m-0"></div>
      </React.Fragment>
    );
    return (
      <React.Fragment>
        <li className="nav-item dropdown">
          <a href="javascript:void(0)" data-toggle="dropdown" className="nav-link dropdown-toggle" id="notification">
            <i className="fa fa-bell fa-lg"></i>
            { this.state.notif_baru &&
              <span className="indicator text-danger d-none d-lg-block"><i className="fa fa-fw fa-circle"></i></span>
            }
          </a>
          <div className="dropdown-menu dropdown-menu-right">
            <h6 className="dropdown-header">Surat baru :</h6>
            <div className="dropdown-divider"></div>
            { (this.props.notif.length) ?
              notifs : 
              <a href="javascript:void(0)" className="dropdown-item text-center disabled">
                Tidak ada pemberitahuan
              </a>
            }
            <div className="dropdown-divider"></div>
            <div className="dropdown-item small">Lihat semua</div>
          </div>
        </li>
      </React.Fragment>
    )
  }
}
