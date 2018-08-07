import axios from 'axios';

console.log(localStorage.getItem('x-access-token'));

export default axios.create({
  baseURL : `${window.location.protocol}//${window.location.hostname}:8080`,
  headers : {
    'x-access-token' : localStorage.getItem('x-access-token')
  }
});