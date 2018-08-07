import React, { Component } from 'react'

export default class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      auth_user : {},
      id_surat : 0
    }
  }

  render() {
    return (
      <React.Fragment>
        {this.props.children}        
      </React.Fragment>
    )
  }
}
