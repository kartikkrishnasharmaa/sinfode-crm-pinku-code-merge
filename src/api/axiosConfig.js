import axios from 'axios';
const instance = axios.create({
  // baseURL: 'https://crmm.sinfode.com/api/',
  baseURL: 'https://crmtesting.sinfode.com/api/',

  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;
//  https://crmtesting.sinfode.com/api/students/create