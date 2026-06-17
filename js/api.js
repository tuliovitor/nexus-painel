/* ==========================================
   NEXUS PAINEL — API Helper
   ==========================================
   API_BASE: se window.__API_BASE__ estiver definido, usa esse valor.
   Se estiver no GitHub Pages (hostname contendo github.io), usa a URL do Railway.
   Caso contrário, usa o mesmo domínio (funciona no Railway e localhost).
   ========================================== */

var API_BASE = window.__API_BASE__ || (
  location.hostname.indexOf('github.io') !== -1
    ? 'https://nexus-painel-production.up.railway.app/api'
    : location.origin + '/api'
);

function apiRequest(method, path, data) {
  var opts = {
    method: method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (data) opts.body = JSON.stringify(data);
  return fetch(API_BASE + path, opts).then(function (r) {
    return r.json().then(function (json) {
      if (!r.ok) throw new Error(json.erro || 'Erro na requisição');
      return json;
    });
  });
}

function apiGet(path)  { return apiRequest('GET', path); }
function apiPost(path, data) { return apiRequest('POST', path, data); }
function apiPut(path, data)  { return apiRequest('PUT', path, data); }
function apiDel(path)  { return apiRequest('DELETE', path); }
