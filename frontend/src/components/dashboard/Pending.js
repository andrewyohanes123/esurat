import React, { Component } from 'react'
import Link from 'react-router-dom/Link';
import Req from '../../modules/Req';
import PendingTable from './PendingTable';
import socket from '../../modules/socket';
import jquery from 'jquery';

export default class Pending extends Component {
  constructor(props) {
    super(props);

    this.state = {
      surat : [],
      limit : 12,
      current_page : 1,
      user : JSON.parse(localStorage.getItem('auth')),
      total_halaman : 1
    }
    this.getSurat = this.getSurat.bind(this);
    this.scroll = this.scroll.bind(this);
    this.removeSurat = this.removeSurat.bind(this);
  }

  componentWillMount = () => {
    document.title = "Surat | Surat pending"
  }

  componentWillMount = () => {
    jquery(window).on('scroll', this.scroll)
    this.getSurat();
  }

  scroll = (ev) => {
    const {current_page, total_halaman} = this.state;
    const scrollHeight = jquery(document).height();
    const scrollPos = jquery(window).height() + jquery(window).scrollTop();
    if ((scrollHeight - scrollPos) / scrollHeight <= 0.2) {
      this.setState({
        current_page : (total_halaman  === current_page) ? current_page : current_page + 1
      }, () => {
        if (total_halaman !== current_page) this.getSurat();
      });
    }
  }

  getSurat() {
    const {user, limit, current_page, surat} = this.state;
    Req.get(`/api/get_surat_pending/${user.id}/${user.user_type}/${current_page}/${limit}`, {
      headers : {
        'x-access-token' : localStorage.getItem('x-access-token')
      }
    }).then(resp => {
      if (current_page > 1) {
        (resp.data.data.length) ? 
        resp.data.data.map(srt => {
          surat.push(srt);
        })
        : surat;
        this.setState({
          surat, total_halaman : resp.data.total_halaman
        });
      } else {
        this.setState({
          surat : resp.data.data, 
          total_halaman : resp.data.total_halaman
        });
      }
    });
  }

  removeSurat = (id) => {
    Req.delete(`/api/hapus_surat/${id}`).then((resp) => {
      if (resp.data.affectedRows > 0) {
        this.getSurat();
      }
    });
  }

  render() {
    socket.emit('login', this.state.user);
    if (this.state.user.user_type === 'pimpinan') {
      socket.on('surat baru', (msg) => this.getSurat());
    } else if (this.state.user.user_type === 'skpd') {
      socket.on('approve surat', (msg) => this.getSurat());
    }
    const {total_halaman, current_page, limit} = this.state;
    const halaman = (total_halaman > 1) ? (((current_page + 3) < total_halaman) ? (current_page + 3) : total_halaman) : 1;
    return (
      <div className="container-fluid">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/dashboard"><i className="fa fa-dashboard fa-lg"></i>&nbsp;Dashboard</Link></li>
          <li className="breadcrumb-item text-muted"><i className="fa fa-envelope fa-lg"></i>&nbsp;Surat</li>
          <li className="breadcrumb-item text-muted"><i className="fa fa-times fa-lg"></i>&nbsp;Pending</li>
        </ol>
        <div className="card m-2">
          <div className="card-header">
            <div className="row">
              <div className="col-sm-8 mb-0 text-muted"><i className="fa fa-check-square fa-lg"></i> Approve</div>
              <div className="col-sm-4">
                <div className="input-group input-group-sm">
                  <input type="text" className="form-control" placeholder="Cari surat"/>
                  <div className="input-group-append"><button className="btn btn-success"><i className="fa fa-search fa-lg"></i>&nbsp;Cari</button></div>
                </div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {
              (this.state.surat.length > 0) ?
              <PendingTable removeSurat={this.removeSurat} data={this.state.surat} />
               :
              <p className="text-center text-muted mb-0">Tidak ada surat pending</p>
            }
          </div>
          <div className="card-footer">
            <nav>
              <ul className="pagination">
                <li className={
                  (current_page === 1 ) ?
                  'page-item disabled' : 'page-item'
                }>
                  <span className="page-link"><i className="fa fa-chevron-left fa-lg"></i></span>
                </li>
                {
                  Array.apply(current_page, Array(halaman)).map((x, i) => {
                    return (
                      (current_page === (i + 1)) ?
                      <li key={i} className="page-item active">
                        <span className="page-link">
                        { (i + 1) }
                        </span>
                      </li> : 
                      <li key={i} className="page-item">
                        <a href="javascript:void(0)" className="page-link">
                        {(i + 1)}
                        </a>
                      </li>
                    )
                  })
                }
                <li className={
                  (current_page === total_halaman ) ?
                  'page-item disabled' : 'page-item'
                }>
                  <span className="page-link"><i className="fa fa-chevron-right fa-lg"></i></span>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    )
  }
}
