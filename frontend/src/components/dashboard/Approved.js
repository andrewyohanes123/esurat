import React, { Component } from 'react'
import Link from 'react-router-dom/Link';
import Req from '../../modules/Req';
import ApprovedTable from './ApprovedTable';
import socket from '../../modules/socket';
import jquery from 'jquery';

export default class Approved extends Component {
  constructor(props) {
    super(props);

    this.state = {
      surat : [],
      limit : 12,
      current_page : 1,
      user : JSON.parse(localStorage.getItem('auth')),
      total_halaman : 1,
      query : ''
    }
    this.getSurat = this.getSurat.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  componentWillMount = () => {
    document.title = "Surat | Surat approve"
  }

  componentDidMount = () => {
    jquery(window).on('scroll', this.scroll);
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
    const {user, limit, current_page, surat, query} = this.state;
    Req.get(`/api/get_approved_surat/${user.id}/${user.user_type}/${current_page}/${limit}`, {
      headers : {
        'x-access-token' : localStorage.getItem('x-access-token')
      },
      params : {
        q : query
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

  onChange = (ev) => {
    this.setState({ query : ev.target.value }, () => {
      this.getSurat();
    });
  }

  render() {
    socket.emit('login', this.state.user);
    if (this.state.user.user_type === 'pimpinan') {
      socket.on('surat baru', (msg) => this.getSurat());
    } else if (this.state.user.user_type === 'skpd') {
      socket.on('approve surat', (msg) => this.getSurat());
    }
    const {query} = this.state;
    return (
      <div className="container-fluid">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/dashboard"><i className="fa fa-dashboard fa-lg"></i>&nbsp;Dashboard</Link></li>
          <li className="breadcrumb-item text-muted"><i className="fa fa-envelope fa-lg"></i>&nbsp;Surat</li>
          <li className="breadcrumb-item text-muted"><i className="fa fa-check-square fa-lg"></i>&nbsp;Approved</li>
        </ol>
        <div className="card border-primary mb-3">
          <div className="card-header border-primary">
            <div className="row">
              <div className="col-sm-8 mb-0 text-muted"><i className="fa fa-check-square fa-lg"></i> Approve</div>
              <div className="col-sm-4">
                <div className="input-group input-group-sm">
                  <input type="text" onChange={this.onChange} value={query} className="form-control" placeholder="Cari surat"/>
                  <div className="input-group-append"><button className="btn btn-success"><i className="fa fa-search fa-lg"></i>&nbsp;Cari</button></div>
                </div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {
              (this.state.surat.length > 0) ?
              <ApprovedTable data={this.state.surat} /> :
              <p className="text-center text-muted mb-0">{
                !query ? `Tidak ada surat yang diapprove` : `Surat yang dicari tidak ada. key : ${query}`
              }</p>
            }
          </div>
          <div className="card-footer"></div>
        </div>
      </div>
    )
  }
}
