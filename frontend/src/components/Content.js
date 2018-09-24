import React, { Component, Fragment } from 'react'
import { Link } from 'react-router-dom';
import Req from '../modules/Req';
import Chart from 'chart.js';
import jquery from 'jquery';

export default class Content extends Component {
  constructor(props) {
    super(props);

    this.state = {
      jumlah_surat : [
        { jumlah : 0, approved : 0},
        { jumlah : 0, approved : 1},
      ],
      chart : {},
      approved : 0,
      pending : 0,
      ditolak : 0
    };
    // this.getJlhSurat = this.getJlhSurat.bind(this);
    this.getJlhApproved = this.getJlhApproved.bind(this);
    this.getJlhPending = this.getJlhPending.bind(this);
    this.getJlhDitolak = this.getJlhDitolak.bind(this);
  }

  componentDidMount = () => {
    // this.getJlhSurat();
    this.getJlhApproved();
    this.getJlhDitolak();
    this.getJlhPending();
  }

  getJlhSurat = () => {
    const user = JSON.parse(localStorage.getItem('auth'));
    Req.get(`/api/jumlah_surat/${user.user_type}/${user.id}`, {
      headers: {
        'x-access-token' : localStorage.getItem('x-access-token')
      }
    }).then((resp) => {
      if (resp.data[0].approved && resp.data.length === 1) {
        resp.data.push({
          approved : 0, jumlah : 0
        })
      } else if (!resp.data[0].approved && resp.data.length === 1) {
        resp.data.push({
          approved : 0, jumlah : 0
        })
        resp.data.reverse();
      }
      this.setState({
        jumlah_surat : resp.data
      });
    });
  }

  getJlhApproved = () => {
    const user = JSON.parse(localStorage.getItem('auth'));
    Req.get(`/api/cek_jlh_surat_approved/${user.user_type}/${user.id}`).then(resp => {
      this.setState({
        approved : resp.data.jumlah
      });
    });
  }

  getJlhPending = () => {
    const user = JSON.parse(localStorage.getItem('auth'));
    Req.get(`/api/cek_jlh_surat_blm_approved/${user.user_type}/${user.id}`).then(resp => {
      this.setState({
        pending : resp.data.jumlah
      });
    });
  }

  getJlhDitolak = () => {
    const user = JSON.parse(localStorage.getItem('auth'));
    Req.get(`/api/cek_jlh_surat_ditolak/${user.user_type}/${user.id}`).then(resp => {
      this.setState({
        ditolak : resp.data.jumlah
      });
    });
  }

  render() {
    document.title = "Dashboard";
    const {jumlah_surat} = this.state;
    return (
      <Fragment>
        <div className="container-fluid">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><i className="fa fa-dashboard fa-lg"></i>&nbsp;Dashboard</li>
          </ol>
          <hr/>
          <div className="row">
            <div className="col-md-3 mb-2">
              <div className="card text-white bg-primary h-100 o-hidden">
              <div className="card-body">
                <div className="mr-5 z-4">{ this.state.approved } surat yang terapprove</div>
                <div className="card-body-icon"><i className="fa fa-check-square fa-lg"></i></div>
                </div>
                <div className="card-footer">
                <Link to="/dashboard/surat/approved" className="small text-white">
                  <i className="fa fa-chevron-right fa-lg"></i>&nbsp;
                  Detail
                </Link>
                </div>
              </div>
            </div>
            {/*  */}
            <div className="col-md-3 mb-2">
              <div className="card text-white bg-warning h-100 o-hidden">
                <div className="card-body">
                  <div className="mr-5 z-4">{ this.state.pending } surat pending</div>
                  <div className="card-body-icon"><i className="fa fa-times fa-lg"></i></div>
                </div>
                <div className="card-footer">
                <Link to="/dashboard/surat/pending" className="small text-white">
                  <i className="fa fa-chevron-right fa-lg"></i>&nbsp;
                  Detail
                </Link>
                </div>
              </div>
              {/*  */}
            </div>
            <div className="col-md-3 mb-2">
              <div className="card text-white bg-danger h-100 o-hidden">
                <div className="card-body">
                  <div className="mr-5 z-4">{ this.state.ditolak } surat yang ditolak</div>
                  <div className="card-body-icon"><i className="fa fa-ban fa-lg"></i></div>
                </div>
                <div className="card-footer">
                <Link to="/dashboard/surat/ditolak" className="small text-white">
                  <i className="fa fa-chevron-right fa-lg"></i>&nbsp;
                  Detail
                </Link>
                </div>
              </div>
              {/*  */}
            </div>
            {/*  */}
            <div className="col-md-4">
              
            </div>
          </div>
        </div>
      </Fragment>
    )
  }
}
