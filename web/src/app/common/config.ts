/**
 * Endereço da API. O site chama sempre "/api" no próprio endereço e o ng serve repassa para
 * http://127.0.0.1:8090 (proxy.conf.json). Assim o cookie de sessão é do mesmo site e não precisa de CORS.
 */
export const API = '/api';
