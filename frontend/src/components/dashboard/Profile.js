import React, { Component } from 'react'
import Link from 'react-router-dom/Link';
import Req from '../../modules/Req';
// import defaultPic from '../../assets/img/Piano.png';
import '../../assets/css/style.css';

export default class componentName extends Component {
  constructor(props) {
    super(props);

    const {id,nama_depan, nama_belakang, jabatan, skpd, username, foto_profil} = JSON.parse(localStorage.getItem('auth'));

    this.state = {
      id,
      nama_depan,
      nama_belakang ,
      jabatan,
      skpd,
      username,
      password : '',
      foto_profil,
      baseURL : `${window.location.protocol}//${window.location.hostname}:8080/api/images`,
      upload_progress : 0
    };

    this.onChange = this.onChange.bind(this);
    this.simpanPerubahan = this.simpanPerubahan.bind(this);
    this.loadProfile = this.loadProfile.bind(this);
    this.uploadFoto = this.uploadFoto.bind(this);
  }

  onChange = (ev) => {
    const target = ev.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name] : value
    });
  }

  componentWillMount() {
    const {nama_belakang, nama_depan} = this.state;
    document.title = `Profile | ${nama_depan} ${nama_belakang}`;
    this.loadProfile();
  }

  simpanPerubahan = (ev) => {
    ev.preventDefault();
    Req.put('/api/update_user', this.state, {
      headers : {
        'x-access-token' : localStorage.getItem('x-access-token')
      }
    }).then((resp) => {
      console.log(resp.data);
    })
  }

  loadProfile = () => {
    Req.get(`/api/get_profile/${this.state.id}`, {
      headers : {
        'x-access-token' : localStorage.getItem('x-access-token')
      }
    }).then(resp => {
      localStorage.setItem('auth', JSON.stringify(resp.data));
      const {id,nama_depan, nama_belakang, jabatan, skpd, username, foto_profil} = resp.data;
      this.setState({ 
        id,
        nama_depan,
        nama_belakang ,
        jabatan,
        skpd,
        username,
        foto_profil,
       });
    });
  }

  uploadFoto = (event) => {
    const file = event.target.files[0];
    let FD = new FormData();
    FD.append('foto_profil', file);
    FD.append('id', this.state.id);
    Req.put(`/api/update_profil/`, FD,{
      headers : {
        'x-access-token' : localStorage.getItem('x-access-token')
      },
      onUploadProgress : prog => {
        let progress = Math.round(prog.loaded / prog.total * 100)
        if (progress < 100)
        {
          this.setState({
            upload_progress : progress
          });
        }
        else
        {
          this.setState({
            upload_progress : 0
          });
        }
      }
    }).then(resp => {
      if (resp.data.affectedRows > 0) this.loadProfile();
    })
  }

  render() {
    const {baseURL,foto_profil, nama_depan, password, nama_belakang, jabatan, skpd, username} = this.state;
    return (
      <div className="container-fluid">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/dashboard"><i className="fa fa-dashboard fa-lg"></i>&nbsp;Dashboard</Link></li>
          <li className="breadcrumb-item text-muted"><i className="fa fa-"></i>&nbsp;{nama_depan} {nama_belakang}</li>
        </ol>
        <div className="card mb-2">
          <div className="card-header">
            <i className="fa fa-user-circle-o fa-lg"></i>&nbsp;
            {nama_depan} {nama_belakang}
          </div>
          <div className="card-body">
            <div className="row justify-content-center">
              <div className="col-md-6">
                <form action="" className="form-group">
                  <label htmlFor="" className="control-label">Username</label>
                  <input type="text" onChange={this.onChange} name="username" placeholder="Username" value={username} className="form-control"/>
                  <label htmlFor="" className="control-label">Password</label>
                  <input type="password" onChange={this.onChange} value={password} placeholder="Password" className="form-control"/>
                  <label htmlFor="" className="control-label">Nama depan</label>
                  <input type="text" onChange={this.onChange} name="nama_depan" placeholder="Nama depan" value={nama_depan} className="form-control"/>
                  <label htmlFor="" className="control-label">Nama belakang</label>
                  <input type="text" onChange={this.onChange} name="nama_belakang" placeholder="Nama belakang" value={nama_belakang} className="form-control"/>
                  <label htmlFor="" className="control-label">Jabatan</label>
                  <input type="text" onChange={this.onChange} name="jabatan" placeholder="Jabatan" value={jabatan} className="form-control"/>
                  { skpd != null &&
                    <React.Fragment>
                      <label htmlFor="" className="control-label">SKPD</label>
                      <input type="text" onChange={this.onChange} name="skpd" placeholder="Nama depan" value={skpd} className="form-control"/>
                    </React.Fragment>
                  }
                  <hr/>
                  <button onClick={this.simpanPerubahan} className="btn btn-success"><i className="fa fa-save fa-lg"></i>&nbsp;Simpan</button>
                </form>
              </div>
              <div className="col-md-6">
                <img src={`${baseURL}/foto_profil/${foto_profil}`} alt="" onClick={() => {this.profilePic.click()}} className="img-fluid profile w-50 rounded img-thumbnail"/>
                <input type="file" onChange={this.uploadFoto} style={{display : 'none'}} ref={(profilePic) => {this.profilePic = profilePic}} className="small w-50"/>
                {
                  this.state.upload_progress > 0 &&
                  <React.Fragment>
                    <div className="progress">
                      <div className={ `progress-bar` } style={{width : `${this.state.upload_progress}%`}}>{this.state.upload_progress}</div>
                    </div>
                  </React.Fragment>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
