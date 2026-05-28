const axios = require('axios');
axios.get('http://localhost:8080/api/v1/players?limit=1').then(r => {
  console.log('Player data:', JSON.stringify(r.data.data[0], null, 2));
}).catch(e => console.error(e.message));
