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
      surat: [{
        subjek: "Loading...",
        file_surat: 'loading.png',
        nama_depan: "...",
        nama_belakang: "...",
        tanggal: Date.now(),
        approved: 0
      }],
      track: [],
      subjek: "",
      nomor_surat: '',
      edit_mode: false,
      deskripsi: '',
      tolak: false,
      image_edit: "",
      deskripsi_penolakan : ""
    };

    this.getSurat = this.getSurat.bind(this);
    this.approveSurat = this.approveSurat.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  componentWillMount = () => {
    this.getSurat();
  }

  getSurat = () => {
    const { id } = this.props;
    const { file_surat } = this.state.surat;
    Req.get(`/api/get_surat_by_id/${id}`, {
      headers: {
        'x-access-token': localStorage.getItem('x-access-token')
      }
    }).then(resp => {
      this.setState({
        surat: resp.data,
        qrcode: ''
      });
    });
  }

  approveSurat = () => {
    $('#loading').fadeIn();
    const { subjek, id } = this.state.surat[0];
    const action_by = JSON.parse(localStorage.getItem('auth')).id;
    window.tracking.ColorTracker.registerColor('black', (r, g, b) => {
      if (r < 10 && g < 10 && b < 10) {
        return true;
      }
      return false;
    });
    const color = new window.tracking.ColorTracker('black');
    const imgs = document.querySelectorAll('img.card-img.rounded-0');
    const images = document.getElementsByClassName('card-img rounded-0');
    const { track, surat } = this.state;
    let i = -1;
    color.on('track', (ev) => {
      i++;
      let img = document.getElementById(`img0`);
      let target = imgs[i].alt;

      if (ev.data.length) {
        let { x, y, width, height } = ev.data[0];

        track[i] = {
          target,
          x: Math.round((img.offsetLeft + x - 10) / images[i].width * 100),
          y: Math.round((img.offsetTop + y - 10) / images[i].height * 100),
          height: Math.round((height + 20) / images[i].height * 100),
          width: Math.round((width + 20) / images[i].width * 100)
        };
      } else {
        track[i] = {
          target,
          x: 0,
          y: 0,
          height: 0,
          width: 0
        };
      }

      this.setState({
        track
      }, () => {
        if (track.length === imgs.length) {
          const data = {
            subjek, id, action_by, track: this.state.track
          };
          Req.post('/api/approve_surat', data, {
            headers: {
              'x-access-token': localStorage.getItem('x-access-token')
            }
          }).then(resp => {
            if (resp.data.affectedRows) {
              socket.emit('approve surat', { surat: this.state.surat, action_by: JSON.parse(localStorage.getItem('auth')) });
              $('#loading').fadeOut();
              this.getSurat();
              $('#done').fadeIn();
              setTimeout(() => {
                $('#done').fadeOut();
              }, 2500);
            }
          });
        }
      });
    });

    for (let i = 0; i < imgs.length; i++) {
      window.tracking.track(`#${imgs[i].id}`, color);
    }
  }

  tolakSurat = () => {
    const { id } = this.state.surat[0];
    const {deskripsi_penolakan} = this.state;
    const action_by = JSON.parse(localStorage.getItem('auth')).id;
    const data = {
      action_by, deskripsi_penolakan
    }
    Req.put(`/api/tolak_surat/${id}`, data).then(resp => {
      if (resp.data.result.affectedRows > 0) {
        socket.emit('ditolak surat', { surat: this.state.surat, action_by: JSON.parse(localStorage.getItem('auth')) });
        this.setState({
          tolak : false,
          deskripsi_penolakan : ''
        }, () => {
          this.getSurat();
        })
      }
    })
  }

  onChange = (ev) => {
    this.setState({ [ev.target.name]: ev.target.value });
  }

  render() {
    const { surat, track, nomor_surat, subjek, deskripsi } = this.state;
    const imgAPI = `${window.location.protocol}//${window.location.hostname}:8080/api/images/`;
    const auth = JSON.parse(localStorage.getItem('auth'));
    socket.emit('login', auth);
    const { id } = this.props;
    document.title = `${surat[0].subjek} | ${surat[0].nama_depan} ${surat[0].nama_belakang}`;
    if (auth.user_type === 'pimpinan') {
      Req.put(`/api/update_baca_surat/${id}`, null, {
        headers: {
          'x-access-token': localStorage.getItem('x-access-token')
        }
      }).then((resp) => {
        if (resp.data.affectedRows > 0) {
          socket.emit('baca surat', surat);
        }
      });
    }
    let img = ''
    // window.onload = () => {
    //   console.log(img.offsetTop);
    // }
    let status = ''
    if (surat[0].approved === 1 && surat[0].ditolak === 0) {
      status = (<li className="breadcrumb-item text-muted"><Link to="/dashboard/surat/pending/"><i className="fa fa-check-square fa-lg"></i>&nbsp;Approve</Link></li>)
    } else if (surat[0].approved === 0 && surat[0].ditolak === 1) {
      status = (<li className="breadcrumb-item text-muted"><Link to="/dashboard/surat/ditolak/"><i className="fa fa-ban fa-lg"></i>&nbsp;Ditolak</Link></li>)
    } else if (surat[0].approved === 0 && surat[0].ditolak === 0) {
      status = (<li className="breadcrumb-item text-muted"><Link to="/dashboard/surat/pending/"><i className="fa fa-times fa-lg"></i>&nbsp;Pending</Link></li>)
    }
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
            status
          }
          <li className="breadcrumb-item text-muted"><i className="fa fa-envelope-o fa-lg"></i>&nbsp;{surat[0].subjek}</li>
        </ol>
        <div className="card mb-3 p-0 m-0 0-hidden">
          <div className="row">
            <div style={{ maxHeight: 'calc(100vh - (65px))', overflow: 'auto' }} className="col-sm-9 m-0 pr-0 position-relative">
              {
                surat.map((img, index) => {
                  return (
                    <Images {...img} img={index} func={() => this.setState({ image_edit: `img${index}` })} key={index} />
                  )
                })
              }
            </div>
            <div className="col-sm-3 pl-0">
              <div className="card-body m-0 p-1 pl-2 position-relative">
                {auth.user_type === 'skpd' && this.state.edit_mode === false && <button className="btn btn-outline-dark btn-sm position-absolute" style={{
                  right: 5,
                  top: 5
                }} onClick={() => this.setState({
                  edit_mode: true,
                  subjek: surat[0].subjek,
                  nomor_surat: surat[0].nomor_surat,
                  deskripsi: surat[0].deskripsi
                })} ><i className="fa fa-edit fa-sm"></i></button>}
                <InfoSurat edit_mode={this.state.edit_mode} {...surat[0]} />
                {this.state.edit_mode === true &&
                  <Fragment>
                    <label htmlFor="" className="control-label">Nomor surat</label>
                    <input type="text" name="nomor_surat" value={nomor_surat} onChange={this.onChange} placeholder="Nomor surat" className="form-control" />
                    <label htmlFor="" className="control-label">Subjek surat</label>
                    <input placeholder="Subjek surat" name="subjek" value={subjek} onChange={this.onChange} type="text" className="form-control" />
                    <br />
                    <button onClick={() => {
                      Req.put(`/api/surat/update/${surat[0].id}`, {
                        subjek, nomor_surat, deskripsi
                      }).then(resp => {
                        if (resp.data.affectedRows) {
                          this.setState({
                            edit_mode: false,
                            subjek: '',
                            nomor_surat: '',
                            deskripsi: ''
                          })
                          this.getSurat();
                        }
                      })
                    }} className="btn btn-outline-dark btn-sm"><i className="fa fa-save fa-lg"></i>&nbsp;Simpan</button>
                    <button onClick={() => this.setState({
                      edit_mode: false,
                      subjek: '',
                      nomor_surat: '',
                      deskripsi: ''
                    })} className="btn btn-outline-danger btn-sm"><i className="fa fa-save fa-lg"></i>&nbsp;Batal</button>
                  </Fragment>
                }
              </div>
              {auth.user_type === 'pimpinan' &&
                <div className="btn-group w-100">
                {surat[0].approved === 0 && surat[0].ditolak === 0 &&
                  <button className="btn btn-outline-secondary border-left-0 border-right-0 rounded-0 w-100" onClick={this.approveSurat}><i className="fa fa-check-square fa-lg"></i>&nbsp;Approve</button>
                }
                  { surat[0].ditolak === 0 && <button onClick={() => this.setState({ tolak: true })} className="btn btn-outline-danger border-right-0 rounded-0 w-100"><i className="fa fa-ban fa-lg"></i>&nbsp;Tolak</button>}
                </div>
              }
              <div className="card-body m-0 p-1 pl-2 border-top">
                {this.state.edit_mode === false && <p className="text-justify p-2">
                  {surat[0].deskripsi}
                </p>}
                {surat[0].ditolak === 1 && <p>Keterangan ditolak : {surat[0].deskripsi_penolakan}</p>}
                {this.state.edit_mode === true &&
                  <textarea name="deskripsi" value={deskripsi} onChange={this.onChange} rows="5" className="form-control" />
                }
                {this.state.tolak &&
                  <Fragment>
                    <textarea name="" value={this.state.deskripsi_penolakan} onChange={this.onChange} name="deskripsi_penolakan" className="form-control" placeholder="Alasan penolakan surat" id="" rows="5"></textarea>
                    <button onClick={() => this.setState({ tolak: false })} className="btn btn-outline-secondary btn-sm mt-2"><i className="fa fa-exclamation fa-md"></i>&nbsp;Batal</button>
                    <button onClick={this.tolakSurat} className="btn btn-outline-success btn-sm mt-2"><i className="fa fa-check fa-lg"></i>&nbsp;Lanjutkan</button>
                  </Fragment>}
              </div>
            </div>
          </div>
        </div>
        <EditSurat getSurat={this.getSurat} img={this.state.image_edit} />
      </div>
    )
  }
}

const Images = (img) => {
  const imgAPI = `${window.location.protocol}//${window.location.hostname}:8080/api/images/`;
  return (
    <div style={{ position: 'relative', padding: 0, margin: 0 }} >
      <button className="btn btn-outline-secondary btn-sm edit-btn" onClick={() => img.func()} data-toggle="modal" data-target="#canvasModal" ><i className="fa fa-edit fa-lg"></i></button>
      <img crossOrigin="anonymous" src={
        (img.approved === 1) ? `${imgAPI}approved_file/${img.approved_file}` :
          `${imgAPI}file_surat/${img.file_surat}`
      }
        alt={img.file_surat}
        onError={(err) => {
          const image = document.getElementById(`img${img.img}`);
          image.src = `${imgAPI}file_surat/loading.png`;
          $('#loading').fadeIn();
          setTimeout(() => {
            image.src = (img.approved === 1) ? (img.approved_file === null) ? this.getSurat() : `${imgAPI}approved_file/${img.approved_file}` :
              `${imgAPI}file_surat/${img.file_surat}`
            $('#loading').fadeOut();
          }, 5000);
        }}
        title={img.subjek} id={`img${img.img}`} className="card-img rounded-0 border-right" />
    </div>
  )
}

const InfoSurat = (surat) => {
  return (
    <Fragment>
      {surat.edit_mode === false && <Fragment>
        <h5 className="mt-4 mb-0">{surat.subjek}</h5>
        <p className="text-muted small"><i className="fa fa-user fa-l"></i>&nbsp;{surat.nama_depan} {surat.nama_belakang} | {moment(surat.tanggal).fromNow()}</p>
        <h6 className="small">Nomor : {surat.nomor_surat}</h6>
      </Fragment>}
    </Fragment>
  )
}

class EditSurat extends Component {
  state = {
    x: 50,
    y: 550
  }

  componentDidUpdate = () => {
    // const canvas = 
    const canvas = document.getElementById('imgCanvas');
    const ctx = canvas.getContext('2d');
    const img = document.getElementById('img0');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);
  }

  componentDidUpdate = () => {
    console.log(this.props.img);
    if (this.props.img !== '') {
      const { img } = this.props;
      const canvas = document.getElementById('imgCanvas');
      const ctx = canvas.getContext('2d');
      const image = document.getElementById(img + '');
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0, image.width, image.height);
    }

    window.addEventListener('drag', (ev) => {
      console.log(ev);
    })
  }

  kotak = (x, y) => {
    console.log(x, y)
    x = (x === undefined) ? this.state.x : x;
    y = (y === undefined) ? this.state.y : y;
    const { img } = this.props;
    const image = document.getElementById(img + '');
    const width = Math.round(image.width / (100 / 11));
    const height = width;
    const canvas = document.getElementById('imgCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, image.width, image.height);
    ctx.drawImage(image, 0, 0, image.width, image.height);
    ctx.beginPath();
    ctx.fillRect(x, y, width, height);
  }

  moveKotak = (direction) => {
    let { x, y } = this.state;
    if (direction === 'up') {
      y += -5;
      this.setState({
        y
      }, () => {
        let { x, y } = this.state;
        this.kotak(x, y);
      });
    } else if (direction === 'down') {
      y += 5;
      this.setState({
        y
      }, () => {
        let { x, y } = this.state;
        this.kotak(x, y);
      });
    } else if (direction === 'right') {
      x += 5;
      this.setState({
        x
      }, () => {
        let { x, y } = this.state;
        this.kotak(x, y);
      });
    } if (direction === 'left') {
      x += -5;
      this.setState({
        x
      }, () => {
        let { x, y } = this.state;
        this.kotak(x, y);
      });
    }
  }

  saveImg = () => {
    const canvas = document.getElementById('imgCanvas');
    const ctx = canvas.getContext('2d');
    const data = canvas.toDataURL();
    const { img } = this.props;
    const imageName = document.getElementById(img + '').alt;
    console.log(data);
    const info = {
      data, imageName
    }
    Req.post('/api/simpan_gambar', info).then(resp => {
      this.props.getSurat();
      $('#canvasModal').modal('hide');
    });
  }

  animate = () => {
    requestAnimationFrame(this.animate);
  }

  render() {
    return (
      <div id="canvasModal" className="modal fade" data-backdrop="static" data-keyboard="false">
        <div className="modal-dialog modal-lg" style={{ maxWidth: '90%' }} >
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title"><i className="fa fa-edit fa-md"></i>&nbsp;Tambah </h4>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-9">
                  <canvas id="imgCanvas" width="300" height="300" />
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-success btn-sm btn-block" onClick={() => this.kotak()} ><i className="fa fa-plus fa-md"></i>&nbsp;Tambah</button>
                  <hr />
                  <button className="btn btn-outline-primary btn-sm btn-block" onClick={() => this.moveKotak('up')}><i className="fa fa-chevron-up fa-md"></i></button>
                  <div className="btn-group btn-group-sm w-100">
                    <button className="btn btn-outline-primary btn-sm w-100" onClick={() => this.moveKotak('left')}><i className="fa fa-chevron-left fa-md"></i></button>
                    <button className="btn btn-outline-primary btn-sm w-100" onClick={() => this.moveKotak('down')}><i className="fa fa-chevron-down fa-md"></i></button>
                    <button className="btn btn-outline-primary btn-sm w-100" onClick={() => this.moveKotak('right')}><i className="fa fa-chevron-right fa-md"></i></button>
                  </div>
                  <hr />
                  <button className="btn btn-success btn-block" onClick={this.saveImg} ><i className="fa fa-save fa-md"></i>&nbsp;Simpan</button>
                </div>
              </div>
              {this.animate()}
            </div>
            <div className="modal-footer">
              <button data-dismiss="modal" className="btn btn-outline-secondary btn-sm">Batal</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}