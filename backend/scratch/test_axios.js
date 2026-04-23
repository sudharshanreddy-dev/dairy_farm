const axios = require('axios');

const baseURL = 'http://localhost:3000/api';
const instance = axios.create({ baseURL });

console.log('Case 1: Leading slash');
console.log('Result:', instance.getUri({ url: '/auth/register' }));

console.log('Case 2: No leading slash');
console.log('Result:', instance.getUri({ url: 'auth/register' }));

const baseURLTrailing = 'http://localhost:3000/api/';
const instanceTrailing = axios.create({ baseURL: baseURLTrailing });

console.log('Case 3: Trailing slash in baseURL, No leading slash in URL');
console.log('Result:', instanceTrailing.getUri({ url: 'auth/register' }));
