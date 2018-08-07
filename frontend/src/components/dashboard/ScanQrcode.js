import React, { Component } from 'react'
import QrReader from 'react-qr-reader';

export default class ScanQrcode extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasil : ''
    }

    this.onRead = this.onRead.bind(this);
  }

  onRead = (data) => {
    console.log(data);
    this.setState({
      hasil : data
    });
  }

  onErr = (err) => {
    console.log(err);
  }

  render() {
    return (
      <div>
        <QrReader 
        delay={200}
        onScan={this.onRead}
        onError={this.onErr}
        style={{width : '100%'}}
        />
        <p>{this.state.hasil}</p>
      </div>
    )
  }
}
