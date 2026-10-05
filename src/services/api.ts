import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://api.hopeescalapro.com.br',
  timeout: 70000,
});