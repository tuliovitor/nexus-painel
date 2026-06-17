/* ==========================================
   NEXUS PAINEL — API Helper
   ==========================================
   API_BASE: configuração automática.
   - Se window.__API_BASE__ estiver definido, usa esse valor (útil para GitHub Pages
     apontar para o Railway)
   - Caso contrário, usa o mesmo domínio (funciona no Railway e localhost)
   ========================================== */

var API_BASE = window.__API_BASE__ || window.location.origin + '/api';

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
