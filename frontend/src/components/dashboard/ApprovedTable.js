import React, { Component, Fragment } from 'react'
import moment from 'moment/min/moment-with-locales';
import { Link } from 'react-router-dom';

export default class ApprovedTable extends Component {
  componentWillMount = () => {
    document.title = `Surat Pending`;
  }

  render() {
    // const {data} = this.props;
    const imgAPI = `${window.location.protocol}//${window.location.hostname}:8080/api/images/`;
    moment.locale('id');
    const surat = this.props.data.map((surat, index) => {
      return (
        <div key={index} className="card border-primary">
          <img src={
            (surat.approved === 0) ?
            `${imgAPI}${surat.file_surat}` :
            `${imgAPI}${surat.approved_file_surat}`
            } alt={surat.file_surat} className="card-img-top"/>
          <div className="card-body">
            <h6 className="card-title mb-0"><Link to={`/dashboard/surat/review/${surat.id}`}>{surat.subjek}</Link></h6>
            <hr className="m-0 p-0"/>
            <p className="small mt-0">{surat.nama_depan} {surat.nama_belakang}</p>
          </div>
          <div className="card-footer small text-muted">{ moment(surat.tanggal).fromNow() }</div>
        </div>
      )
    });
    return (
      <Fragment>
        <div className="card-columns">
          { surat }
        </div>
      </Fragment>
    )
  }
}
