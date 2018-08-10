import React, { Component, Fragment } from 'react';
import Req from '../../modules/Req';
import { Link } from 'react-router-dom';
import moment from 'moment/min/moment-with-locales';
import socket from '../../modules/socket';
import $ from 'jquery';
import tracking from 'tracking';
window.jQuery = $;
window.$ = $;

export default class ReviewSurat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      surat : {
        subjek : "Loading...",
        file_surat : 'loading.png',
        nama_depan : "...",
        nama_belakang : "...",
      },
      track : {},
      subjek : "",
      nomor_surat : '',
      edit_mode : false,
      deskripsi : ''
    };

    this.getSurat = this.getSurat.bind(this);
    this.approveSurat = this.approveSurat.bind(this);
    this.onChange = this.onChange.bind(this);
  }
  
  componentWillMount = () => {
    this.getSurat();
  }

  getSurat = () => {
    const {id} = this.props;
    const {file_surat} = this.state.surat;
    Req.get(`/api/get_surat_by_id/${id}`, {
      headers : {
        'x-access-token' : localStorage.getItem('x-access-token')
      }
    }).then(resp => {
      this.setState({
        surat : resp.data,
        qrcode : ''
      });
    });
  }

  approveSurat = () => {
    $('#loading').fadeIn();
    const {subjek, file_surat, id} = this.state.surat;
    const approved_by = JSON.parse(localStorage.getItem('auth')).id;
    window.tracking.ColorTracker.registerColor('black', (r, g,b) => {
      if (r < 10 && g < 10 && b < 10) {
        return true;
      }
      return false;
    });
    const color = new window.tracking.ColorTracker('black');
    color.on('track', (ev) => {
      const img = document.getElementById('img');
      const {x, y, width, height} = ev.data[0];
      ev.data[0].x = Math.round((img.offsetLeft + x - 10) / img.width * 100);
      ev.data[0].y = Math.round((img.offsetTop + y - 10) / img.height * 100) ;
      ev.data[0].height = Math.round((height + 20) / img.height * 100);
      ev.data[0].width = Math.round((width + 20) / img.width * 100);
      ev.data[0].img = {
        width : img.width,
        height : img.height
      }
      this.setState({
        track : ev.data[0]
      }, () => {
        const {track} = this.state;
        const data = {
          subjek, file_surat, id, approved_by, track
        };
        Req.post('/api/approve_surat', data,{
          headers : {
            'x-access-token' : localStorage.getItem('x-access-token')
          }
        }).then(resp => { 
          if (resp.data.affectedRows) {
            socket.emit('approve surat', {surat : this.state.surat, approved_by : JSON.parse(localStorage.getItem('auth'))});
            $('#loading').fadeOut();
            this.getSurat();
            $('#done').fadeIn();
            setTimeout(() => {
              $('#done').fadeOut();
            }, 2500);
          }
        });
      });
    });
    window.tracking.track('#img', color);
  }

  onChange = (ev) => {
    this.setState({ [ev.target.name] : ev.target.value });
  }

  render() {
    const {surat, track, nomor_surat, subjek, deskripsi} = this.state;
    const imgAPI = `${window.location.protocol}//${window.location.hostname}:8080/api/images/`;
    const auth = JSON.parse(localStorage.getItem('auth'));
    socket.emit('login', auth);
    const {id} = this.props;
    document.title = `${surat.subjek} | ${surat.nama_depan} ${surat.nama_belakang}`;
    if (auth.user_type === 'pimpinan') {
      Req.put(`/api/update_baca_surat/${id}`, null, {
        headers : {
          'x-access-token' : localStorage.getItem('x-access-token')
        }
      }).then((resp) => {
        if (resp.data.affectedRows > 0)
        {
          socket.emit('baca surat', surat);
        }
      });
    }
    let img = ''
    // window.onload = () => {
    //   console.log(img.offsetTop);
    // }
    return (
      <div className="container-fluid">
        <div id="loading" className="loading">
          <p><i className="fa fa-spinner fa-lg fa-spin"></i>&nbsp;Memproses</p>
        </div>
        <div id="done" className="loading">
          <p><i className="fa fa-check-square fa-lg"></i>&nbsp;Selesai</p>
        </div>
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/dashboard"><i className="fa fa-dashboard fa-lg"></i>&nbsp;Dashboard</Link></li>
          <li className="breadcrumb-item text-muted"><i className="fa fa-envelope fa-lg"></i>&nbsp;Surat</li>
          {
            (surat.approved === 0) ? 
            <li className="breadcrumb-item text-muted"><Link to="/dashboard/surat/pending/"><i className="fa fa-times fa-lg"></i>&nbsp;Pending</Link></li> :
            <li className="breadcrumb-item text-muted"><Link to="/dashboard/surat/approved/" ><i className="fa fa-check-square fa-lg"></i>&nbsp;Approve</Link></li>
          }
          <li className="breadcrumb-item text-muted"><i className="fa fa-envelope-o fa-lg"></i>&nbsp;{surat.subjek}</li>
        </ol>
        <div className="card mb-3 p-0 m-0 0-hidden">
          <div className="row">
            <div className="col-sm-9 m-0 pr-0 position-relative">
              <img src={
                (surat.approved === 1) ? `${imgAPI}${surat.approved_file_surat}` :
                `${imgAPI}${surat.file_surat}`
                }
                onError={(err) => {
                  const img = document.getElementById('img');
                  img.src = `${imgAPI}loading.png`;
                  $('#loading').fadeIn();
                  setTimeout(() => {
                    img.src = `${imgAPI}${surat.approved_file_surat}`;
                    $('#loading').fadeOut();
                  }, 5000);
                }}
                 title={surat.subjek} id="img" className="card-img rounded-0 border-right"/>
            </div>
            <div className="col-sm-3 pl-0">
              <div className="card-body m-0 p-1 pl-2 position-relative">
                { auth.user_type === 'skpd' && this.state.edit_mode === false && <button className="btn btn-outline-dark btn-sm position-absolute" style={{
                  right : 5,
                  top : 5
                }} onClick={() => this.setState({
                  edit_mode : true,
                  subjek : surat.subjek,
                  nomor_surat : surat.nomor_surat,
                  deskripsi : surat.deskripsi
                  })} ><i className="fa fa-edit fa-sm"></i></button>}
                {this.state.edit_mode === false && <Fragment>
                  <h5 className="mt-4 mb-0">{surat.subjek}</h5>
                  <p className="text-muted small"><i className="fa fa-user fa-l"></i>&nbsp;{surat.nama_depan} {surat.nama_belakang} | {moment(surat.tanggal).fromNow()}</p>
                  <h6 className="small">Nomor : {surat.nomor_surat}</h6>
                </Fragment>}
                { this.state.edit_mode === true &&
                  <Fragment>
                    <label htmlFor="" className="control-label">Nomor surat</label>
                    <input type="text" name="nomor_surat" value={nomor_surat} onChange={this.onChange} placeholder="Nomor surat" className="form-control"/>
                    <label htmlFor="" className="control-label">Subjek surat</label>
                    <input placeholder="Subjek surat" name="subjek" value={subjek} onChange={this.onChange} type="text" className="form-control"/>
                    <br/>
                    <button onClick={() => {
                      Req.put(`/api/surat/update/${surat.id}`, {
                        subjek, nomor_surat, deskripsi
                      }).then(resp => {
                        if (resp.data.affectedRows) {
                          this.setState({
                            edit_mode : false,
                            subjek : '',
                            nomor_surat : '',
                            deskripsi : ''
                          })
                          this.getSurat();
                        }
                      })
                    }} className="btn btn-outline-dark btn-sm"><i className="fa fa-save fa-lg"></i>&nbsp;Simpan</button>
                    <button onClick={() => this.setState({
                      edit_mode : false,
                      subjek : '',
                      nomor_surat : '',
                      deskripsi : ''
                    })} className="btn btn-outline-danger btn-sm"><i className="fa fa-save fa-lg"></i>&nbsp;Batal</button>
                  </Fragment>
                }
              </div>
              { !surat.approved && auth.user_type === 'pimpinan' && 
                <button className="btn btn-outline-secondary border-left-0 border-right-0 rounded-0 w-100" onClick={this.approveSurat}><i className="fa fa-check-square fa-lg"></i>&nbsp;Approve</button>
              }
              <div className="card-body m-0 p-1 pl-2 border-top">
                {this.state.edit_mode === false && <p className="text-justify p-2">
                  {surat.deskripsi}
                </p>}                
                { this.state.edit_mode === true &&
                  <textarea name="deskripsi" value={deskripsi} onChange={this.onChange} rows="5" className="form-control"/>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
