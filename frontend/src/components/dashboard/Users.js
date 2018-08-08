import React, { Component, Fragment } from 'react'
import Req from '../../modules/Req';
import jquery from 'jquery';
window.$ = jquery;

export default class Users extends Component {
  constructor(props) {
    super(props);
    this.state = {
      users : [],
      total_halaman : 1,
      page : 1,
      limit : 5,
      nama_belakang : '',
      nama_depan : '',
      username : '',
      skpd : '',
      password : '',
      jabatan : '',
      user_type : 'admin',
      edit_mode : false,
      total_user : 1
    }
    this.onChange = this.onChange.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.submit = this.submit.bind(this);
    this.updateUser = this.updateUser.bind(this);
  }

  componentDidMount = () => {
    this.getUsers();
  }
  

  onChange = (ev) => {
    if (!ev.target.value) {
      ev.target.className = "form-control is-invalid";
    } else {
      ev.target.className = "form-control is-valid";
    }
    this.setState({ [ev.target.name] : ev.target.value });
  }

  getUsers = () => {
    const {limit, page} = this.state; 
    Req.get(`/api/get_user/${limit}/${page}`).then(resp => {
      this.setState({
        users : resp.data.data,
        total_halaman : resp.data.total_halaman,
        total_user : resp.data.total
      });
    });
  }

  submit = (ev) => {
    ev.preventDefault();
    let valid = false;
    const {nama_depan, nama_belakang, username, password, skpd, jabatan, user_type} = this.state
    const data = {nama_depan, nama_belakang, username, password, skpd, jabatan, user_type};
    // valid = data.map((prop, key) => {return !!prop});
    const input = jquery('input.form-control');
    for (let i = 0; i < input.length; i++) {
      if (!input[i].value && input[i].name !== 'skpd' ) {
        valid = false;
        input[i].className = "form-control is-invalid";
        // break;
      } else {
        valid = true;
      }
    }

    if (valid) {
      Req.post('/api/buat_user', data)
      .then(resp => {
        if (resp.data.affectedRows > 0) {     
          this.setState({
            edit_mode : false,
            nama_belakang : '',
            nama_depan : '',
            password : '',
            skpd : '',
            jabatan : '',
            username : '',
            user_type : 'admin'
          }, () => {
            jquery('.form-control').removeClass('is-valid is-invalid');
            this.getUsers();
          });
        }
      });
    }
  }

  updateUser = (ev) => {
    ev.preventDefault();
    const {id, nama_belakang, nama_depan, password, username, jabatan, skpd, user_type} = this.state;
    let input = jquery('input.form-control');
    let valid = false;
    for (let i = 0; i < input.length; i++) {
      if (!input[i].value && input[i].type !== 'password') {
        valid = false;
        input[i].className = "form-control is-invalid"
      } else {
        valid = true;
      }
    }

    if (valid) {
      Req.put('/api/update_user', {id, nama_belakang, nama_depan, password, username, jabatan, skpd, user_type}).then(resp => {
        if (resp.data.affectedRows > 0) {
          this.setState({
            edit_mode : false,
            nama_belakang : '',
            nama_depan : '',
            password : '',
            skpd : '',
            jabatan : '',
            username : '',
            user_type : 'admin'
          }, () => {
            jquery('.form-control').removeClass('is-valid is-invalid');
            this.getUsers();
          });        
        }
      })
    }
  }

  render() {
    document.title = "Users";
    const {users, total_halaman, page, total_user,user_type,password, nama_depan, nama_belakang, skpd, jabatan, edit_mode, username} = this.state;
    return (
      <Fragment>
        <div className="container-fluid mb-2">        
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-sm-6">
                  <form action="" className="form-group">
                    <label htmlFor="" className="control-label">Username</label>
                    <input type="text" onChange={this.onChange} name="username" placeholder="Username" value={username} className="form-control"/>
                    <label htmlFor="" className="control-label">Password</label>
                    <input name="password" type="password" onChange={this.onChange} value={password} placeholder="Password" className="form-control"/>
                    <label htmlFor="" className="control-label">Nama depan</label>
                    <input type="text" onChange={this.onChange} name="nama_depan" placeholder="Nama depan" value={nama_depan} className="form-control"/>
                    <label htmlFor="" className="control-label">Nama belakang</label>
                    <input type="text" onChange={this.onChange} name="nama_belakang" placeholder="Nama belakang" value={nama_belakang} className="form-control"/>
                    <label htmlFor="" className="control-label">Jabatan</label>
                    <input type="text" onChange={this.onChange} name="jabatan" placeholder="Jabatan" value={jabatan} className="form-control"/>                  
                    <label htmlFor="" className="control-label">SKPD</label>
                    <input type="text" onChange={this.onChange} name="skpd" placeholder="SKPD" value={skpd} className="form-control"/>                  
                    <label htmlFor="" className="control-label">Tipe</label>
                    <select name="user_type" multiple={false} value={user_type} onChange={this.onChange} id="" className="form-control">
                      <option value="admin">Administrator</option>
                      <option value="pimpinan">Pimpinan</option>
                      <option value="skpd">SKPD</option>
                    </select>
                    <hr/>
                    { edit_mode === false &&
                    <button onClick={this.submit} className="btn btn-success"><i className="fa fa-plus-square fa-lg"></i>&nbsp;Tambah</button>}
                    {
                      edit_mode === true &&
                      <Fragment>
                        <button onClick={
                          () => {
                            this.setState({
                              edit_mode : false,
                              nama_belakang : '',
                              nama_depan : '',
                              password : '',
                              skpd : '',
                              jabatan : '',
                              username : '',
                              user_type : 'admin'
                            }, () => {
                              jquery('.form-control').removeClass('is-valid is-invalid');
                            });
                          }
                        } className="btn btn-outline-danger btn-sm"><i className="fa fa-ban fa-sm"></i>&nbsp;Batal</button>
                        <button onClick={this.updateUser} className="btn btn-outline-success btn-sm"><i className="fa fa-save fa-sm"></i>&nbsp;Simpan</button>
                      </Fragment>
                    }
                  </form>
                </div>
                <div className="col-sm-12">
                  <div className="table-responsive">
                    <table className="table table-sm table-striped table-hover table-bordered">
                      <thead className="thead-dark">
                        <tr>
                          <th>No.</th>
                          <th>Nama depan</th>
                          <th>Nama belakang</th>
                          <th>Username</th>
                          <th>Jabatan</th>                          
                          <th>SKPD</th>
                          <th>Tipe user</th>
                          <th>Edit/Hapus</th>
                        </tr>                        
                      </thead>
                      <tbody>
                        {
                          (users.length) ? users.map((user, index) => {
                            return (
                              <tr key={user.id}>
                                <td>{index + 1}</td>
                                <td>{user.nama_depan}</td>
                                <td>{user.nama_belakang}</td>
                                <td>{user.username}</td>
                                <td>{user.jabatan}</td>
                                <td>{user.skpd}</td>
                                <td className="text-capitalize">{(user.user_type === 'skpd') ? user.user_type.toUpperCase() : user.user_type}</td>
                                <td>
                                  <div className="btn-group btn-group-sm">
                                    <button onClick={() => {
                                      user.password = '';
                                      (!user.skpd) ? user.skpd = '' : user.skpd
                                      this.setState({
                                        ...user, edit_mode : true
                                      })
                                    }} className="btn btn-outline-warning btn-sm"><i className="fa fa-edit fa-sm"></i></button>
                                    <button className="btn btn-outline-danger btn-sm"><i className="fa fa-trash fa-sm"></i></button>
                                  </div>
                                </td>
                              </tr>
                            )
                          }) : <tr>
                            <td colSpan="8" className="text-center text-muted small" >Loading...</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  <div className="btn-group btn-group-sm">
                    <button onClick={
                      () => {
                        this.setState({
                          page : 1
                        }, () => {
                          this.getUsers();
                        });
                      }              
                    } className="btn btn-outline-primary btn-dark"><i className="fa fa-angle-double-left"></i></button>
                    <button onClick={
                      () => {
                        this.setState({
                          page : (page === 1) ? 1 : page - 1
                        }, () => {
                          this.getUsers();
                        });
                      }
                    } className="btn btn-outline-secondary btn-dark"><i className="fa fa-chevron-left"></i></button>
                    <button onClick={
                      () => {
                        this.setState({
                          page : (page === total_halaman) ? total_halaman : page + 1
                        }, () => {
                          this.getUsers();
                        });
                      }
                    } className="btn btn-outline-secondary btn-dark"><i className="fa fa-chevron-right"></i></button>
                    <button onClick={
                      () => {
                        this.setState({
                          page : total_halaman
                        }, () => {
                          this.getUsers();
                        });
                      }
                    } className="btn btn-outline-primary btn-dark"><i className="fa fa-angle-double-right"></i></button>
                  </div>
                  <div className="float-right">
                    <kbd>{page}/{total_halaman}</kbd> halaman
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    )
  }
}
