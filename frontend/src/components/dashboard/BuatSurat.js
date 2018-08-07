import React, { Component } from 'react';
import Link from 'react-router-dom/Link';
import $ from 'jquery';
import Req from '../../modules/Req';
import socket from '../../modules/socket';
window.jQuery = $;
window.$ = $;

export default class BuatSurat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nomor_surat : "",
      subjek : "",
      file_surat : [],
      encoded : null,
      skpd : JSON.parse(localStorage.getItem('auth')).skpd,
      user_id : JSON.parse(localStorage.getItem('auth')).id,
      tujuan : "",
      deskripsi : ""
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.getFile = this.getFile.bind(this);
  }

  onChange (ev) {
    const target = ev.target;
    const val = target.value;
    const name = target.name;

    if (!val) {
      target.className = 'form-control is-invalid';
    } else {
      target.className = 'form-control is-valid';
    }
    this.setState({
      [name] : val
    })
  }

  getFile(ev) {
    let file_surat = ev.target.files[0];
    const image = ['png', 'jpeg', 'jpg', 'bmp'];
    let compatible = false;
    for (let i = 0; i < image.length; i++) {
      if (file_surat.type.match(image[i])) compatible = true;
    }
    if (compatible === true)
    {
      this.setState({
        file_surat
      }, () => {
        document.querySelector('input[type="file"]').className = "form-control";
      });
    }
    else
    {
      document.querySelector('input[type="file"]').className = "form-control is-invalid";
      document.querySelector('input[type="file"]').value = "";
    }
  }

  onSubmit = (ev) => {
    ev.preventDefault();
    const formData = new FormData();
    const {nomor_surat, subjek, tujuan, deskripsi, file_surat, skpd, user_id} = this.state;
    const user = JSON.parse(localStorage.getItem('auth'));
    formData.append('nomor_surat', nomor_surat);
    formData.append('subjek', subjek);
    formData.append('tujuan', tujuan);
    formData.append('deskripsi', deskripsi);
    formData.append('file_surat', file_surat);
    formData.append('skpd', skpd);
    formData.append('user_id', user_id);
    let input = $('input.form-control[type="text"]');
    const fileInput = document.querySelector('input[type="file"]');
    for (let i = 0; i < input.length; i++) {
      if (!input[i].value) {
        input[i].className += " is-invalid";
      }
    }
    if (!!input[0].value && !!input[1].value && !!input[2].value && !fileInput.files.length)
    {
      this.fileSurat.click();
    }
    else if (!!input[0].value && !!input[1].value && !!input[2].value) {
      Req.post('/api/buat_surat', formData, {
        headers: {
          'x-access-token' : localStorage.getItem('x-access-token')
        }
      }).then((resp) => {
        if (resp.data.affectedRows) 
        {
          this.setState({
            nomor_surat : "",
            subjek : "",
            file_surat : "",
            skpd : JSON.parse(localStorage.getItem('auth')).skpd,
            user_id : JSON.parse(localStorage.getItem('auth')).id,
            tujuan : "",
            deskripsi : ""
          });
          $('input.form-control').removeClass("is-invalid is-valid");
          document.querySelector('input[type="file"]').value = "";
          socket.emit('surat baru', user);
        }
      });
    }
  }

  render() {    
    document.title = "Buat surat baru";
    const {nomor_surat, subjek, tujuan, deskripsi, file_surat, encoded} = this.state;
    return (
      <div className="container-fluid">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/dashboard"><i className="fa fa-dashboard fa-lg"></i>&nbsp;Dashboard</Link></li>
          <li className="breadcrumb-item text-muted"><i className="fa fa-envelope fa-lg"></i>&nbsp;Surat</li>
          <li className="breadcrumb-item text-muted"><i className="fa fa-envelope-o fa-lg"></i>&nbsp;Buat Surat</li>
        </ol>
        <div className="card mb-3">
          <div className="card-header">
            <i className="fa fa-envelope-o fa-lg"></i>&nbsp;
            Buat surat baru
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <form onSubmit={this.onSubmit} action="" className="form-group">
                  <label htmlFor="" className="control-label">Nomor surat</label>
                  <input type="text" name="nomor_surat" onChange={this.onChange} value={nomor_surat} className="form-control" placeholder="Nomor surat"/>
                  <label htmlFor="" className="control-label">Subjek</label>
                  <input type="text" placeholder="Subjek surat" name="subjek" value={subjek} onChange={this.onChange} className="form-control"/>
                  <label htmlFor="" className="control-label">Tujuan</label>
                  <input type="text" placeholder="Tujuan surat" name="tujuan" value={tujuan} onChange={this.onChange} className="form-control"/>
                  <label htmlFor="" className="control-label">File surat</label>
                  <input type="file" name="file_surat" id="" onChange={this.getFile} ref={(fileSurat) => { this.fileSurat = fileSurat }} className="form-control"/>
                  <div className="invalid-feedback"><i className="fa fa-exclamation-circle fa-lg"></i>&nbsp;Pilih file pilih atau file gambar yang valid</div>
                  <label htmlFor="" className="control-label">Deskripsi</label>
                  <textarea placeholder="Subjek surat" name="deskripsi" value={deskripsi} onChange={this.onChange} className="form-control"/>
                  <hr/>
                  <button type="submit" onClick={this.onSubmit} className="btn btn-success"><i className="fa fa-envelope fa-lg"></i>&nbsp;Buat</button>
                </form>
              </div>
              <div className="col-md-6">
                {/* <p><i className="fa fa-chevron-right fa-lg"></i>&nbsp;Preview surat</p>
                <hr/>
                <img src={
                  encoded
                } title="Preview" alt="" className="img-fluid"/> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
