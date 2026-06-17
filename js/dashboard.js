/* ==========================================
   NEXUS PAINEL — Dashboard JavaScript v2
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {

  var page = window.location.pathname.split('/').pop();
  var user = getUser();

  /* ---------- USER DATA ---------- */
  function getUser() {
    try { return JSON.parse(localStorage.getItem('nexus_user')) || {}; }
    catch (e) { return {}; }
  }

  function renderUser() {
    var freshUser = getUser();
    if (freshUser && freshUser.id) user = freshUser;
    var sidebarName = document.querySelector('.sidebar-user-name');
    var sidebarHandle = document.querySelector('.sidebar-user-handle');
    var sidebarAvatar = document.querySelector('.sidebar-avatar');
    var headerTitle = document.querySelector('.dashboard-header-left h2');

    if (sidebarName && user.nome) sidebarName.textContent = user.nome;
    if (sidebarHandle && user.username) sidebarHandle.textContent = '@' + user.username;
    if (headerTitle && user.nome) headerTitle.innerHTML = 'Ol&aacute;, ' + user.nome.split(' ')[0];

    if (sidebarAvatar) {
      if (user.avatar) {
        var img = document.createElement('img');
        img.src = user.avatar;
        img.alt = user.nome || 'Avatar';
        img.style.cssText = 'width:100%;height:100%;border-radius:50%;object-fit:cover;';
        sidebarAvatar.innerHTML = '';
        sidebarAvatar.appendChild(img);
      } else {
        var initial = user.nome ? user.nome.trim().charAt(0).toUpperCase() : '?';
        sidebarAvatar.innerHTML = initial + '<span class="online-dot"></span>';
      }
    }
  }

  /* ---------- MOBILE SIDEBAR ---------- */
  (function () {
    var btn = document.getElementById('mobileMenuBtn');
    var overlay = document.getElementById('sidebarOverlay');
    var sidebar = document.querySelector('.dashboard-sidebar');
    if (!btn || !sidebar) return;
    function toggle(open) {
      sidebar.classList.toggle('open', open);
      if (overlay) overlay.classList.toggle('active', open);
    }
    btn.addEventListener('click', function () { toggle(); });
    if (overlay) {
      overlay.addEventListener('click', function () { toggle(false); });
      sidebar.querySelectorAll('.sidebar-link').forEach(function (l) {
        l.addEventListener('click', function () { if (window.innerWidth < 768) toggle(false); });
      });
    }
  })();

  /* ---------- DATE ---------- */
  var dateDisplay = document.getElementById('dateDisplay');
  if (dateDisplay) {
    var d = new Date();
    var days = ['Domingo','Segunda-feira','Ter&ccedil;a-feira','Quarta-feira','Quinta-feira','Sexta-feira','S&aacute;bado'];
    var months = ['janeiro','fevereiro','mar&ccedil;o','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    dateDisplay.innerHTML = days[d.getDay()] + ', ' + d.getDate() + ' de ' + months[d.getMonth()] + ' de ' + d.getFullYear();
  }

  /* ---------- HELPER ---------- */
  function escapeHtml(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function showToast(msg, type) {
    type = type || 'info';
    var c = document.getElementById('toastContainer');
    if (!c) {
      c = document.createElement('div');
      c.className = 'toast-container';
      c.id = 'toastContainer';
      document.body.appendChild(c);
    }
    var t = document.createElement('div');
    t.className = 'toast ' + type;
    var icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-info-circle-fill';
    t.innerHTML = '<i class="bi ' + icon + '"></i> ' + escapeHtml(msg);
    c.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transform = 'translateX(40px)';
      t.style.transition = 'all 0.3s ease';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 3000);
  }

  /* ==================================================================
     DASHBOARD PAGE
     ================================================================== */
  if (page === 'dashboard.html' || page === '') {
    renderUser();
    loadDashboardData();

    function loadDashboardData() {
      if (!user.id) return;

      apiGet('/metricas?usuario_id=' + user.id).then(function (data) {
        var t = data.totais || {};
        setText('totalViews',    formatNum(t.total_views));
        setText('totalFollowers', formatNum(t.total_followers));
        setText('totalHours',    t.total_hours ? t.total_hours.toFixed(1) + 'h' : '0h');
        setText('avgViewers',   formatNum(t.avg_viewers));

        var diarias = data.diarias || [];
        if (diarias.length > 0) {
          initWeeklyChart(diarias);
        }
      }).catch(function (err) {
        console.warn('Erro ao carregar métricas:', err);
      });

      // Top viewers
      apiGet('/membros?usuario_id=' + user.id).then(function (membros) {
        renderTopViewers(membros.slice(0, 5));
      }).catch(function () {});

      // Recent lives
      apiGet('/transmissoes?usuario_id=' + user.id).then(function (lives) {
        renderRecentLives(lives.slice(0, 3));
      }).catch(function () {});

      // AO VIVO badge — check localStorage (set by Live Studio toggles)
      var aoVivoCache = localStorage.getItem('nexus_live_on') === 'true';
      var badge = document.querySelector('.badge.badge-red.pulse-red');
      if (badge) {
        badge.style.display = aoVivoCache ? 'inline-flex' : 'none';
      }
    }

    function setText(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    }

    function formatNum(n) {
      if (!n) return '0';
      if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
      return String(n);
    }

    function initWeeklyChart(diarias) {
      var canvas = document.getElementById('weeklyChart');
      if (!canvas || typeof Chart === 'undefined') return;

      var labels = diarias.map(function (d) {
        var parts = d.data.split('-');
        return parts[2];
      });

      var views = diarias.map(function (d) { return d.visualizacoes; });
      var followers = diarias.map(function (d) { return d.novos_seguidores; });

      new Chart(canvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            { label: 'Visualiza&ccedil;&otilde;es', data: views, borderColor: '#8B42FF',
              backgroundColor: 'rgba(139,66,255,0.08)', borderWidth: 2, pointRadius: 3,
              pointBackgroundColor: '#8B42FF', tension: 0.4, fill: true },
            { label: 'Seguidores', data: followers, borderColor: '#4ADE80',
              backgroundColor: 'rgba(74,222,128,0.05)', borderWidth: 2, pointRadius: 3,
              pointBackgroundColor: '#4ADE80', tension: 0.4, fill: true }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#6B6B76', font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6B6B76', font: { size: 11 }, maxTicksLimit: 5 } }
          },
          interaction: { intersect: false, mode: 'index' }
        }
      });
    }

    function renderTopViewers(membros) {
      var list = document.querySelector('.top-viewers-list');
      if (!list) return;
      list.innerHTML = '';
      membros.forEach(function (m, i) {
        var bg = ['#5B2EFF', '#7D2EFF', '#A95EFF', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.06)'];
        list.innerHTML +=
          '<div class="top-viewer-item">' +
            '<div class="top-viewer-avatar" style="background:' + (bg[i] || bg[4]) + ';">' +
              (m.nome ? m.nome.charAt(0).toUpperCase() : '?') +
            '</div>' +
            '<div class="top-viewer-info">' +
              '<strong>' + escapeHtml(m.nome || m.username) + '</strong>' +
              '<span>' + formatNum(m.seguidores) + ' seguidores</span>' +
            '</div>' +
          '</div>';
      });
    }

    function renderRecentLives(lives) {
      var list = document.getElementById('recentLivesList');
      if (!list) return;
      list.innerHTML = '';
      if (lives.length === 0) {
        list.innerHTML = '<div class="card" style="padding:24px;text-align:center;color:var(--text-tertiary);">Nenhuma transmiss&atilde;o recente.</div>';
        return;
      }
      lives.forEach(function (l) {
        var label = l.status === 'ao_vivo' ? '<span class="badge badge-red pulse-red" style="font-size:0.7rem;">AO VIVO</span>' : '';
        list.innerHTML +=
          '<div class="recent-live-item">' +
            '<div class="recent-live-thumb" style="background:rgba(139,66,255,0.1);"></div>' +
            '<div class="recent-live-info">' +
              '<strong>' + escapeHtml(l.titulo || 'Live sem t&iacute;tulo') + '</strong> ' + label +
              '<span>' + (l.data_inicio ? new Date(l.data_inicio).toLocaleDateString('pt-BR') : '') + '</span>' +
            '</div>' +
          '</div>';
      });
    }
  }

  /* ==================================================================
     AGENDAMENTOS PAGE
     ================================================================== */
  if (page === 'agendamentos.html') {
    renderUser();
    loadAgendamentos();

    var currentFilter = 'todas';
    var agendamentosData = [];

    // Filter pills
    document.querySelectorAll('.filter-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        document.querySelectorAll('.filter-pill').forEach(function (p) { p.classList.remove('active'); });
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter') || 'todas';
        renderCards();
      });
    });

    function loadAgendamentos() {
      if (!user.id) return;
      apiGet('/agendamentos?usuario_id=' + user.id).then(function (data) {
        agendamentosData = data;
        renderCards();
      }).catch(function (err) {
        console.warn('Erro ao carregar agendamentos:', err);
      });
    }

    function renderCards() {
      var container = document.getElementById('agendamentosContainer');
      if (!container) return;

      var filtered = agendamentosData;
      if (currentFilter !== 'todas') {
        filtered = agendamentosData.filter(function (a) { return a.status === currentFilter; });
      }

      document.querySelectorAll('.filter-pill').forEach(function (pill) {
        var f = pill.getAttribute('data-filter') || 'todas';
        var count = f === 'todas' ? agendamentosData.length : agendamentosData.filter(function (a) { return a.status === f; }).length;
        var span = pill.querySelector('span');
        if (span) span.textContent = count;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div class="card-empty">Nenhum agendamento encontrado.</div>';
        return;
      }

      var cores = { agendada: '#4ADE80', rascunho: '#FB923C', planejamento: '#60A5FA', cancelada: '#F87171' };
      var labels = { agendada: 'AGENDADA', rascunho: 'RASCUNHO', planejamento: 'PLANEJAMENTO', cancelada: 'CANCELADA' };

      container.innerHTML = '';
      filtered.forEach(function (a) {
        var cor = cores[a.status] || '#6B6B76';

        var statusEmoji = a.status === 'agendada' ? '🟢' : a.status === 'rascunho' ? '🟡' : '🔵';
        var emojiCategoria = '🎮';
        if (a.categoria) {
          var cat = a.categoria.toLowerCase();
          if (cat.indexOf('just') !== -1 || cat.indexOf('chat') !== -1) emojiCategoria = '💬';
          else if (cat.indexOf('rpg') !== -1) emojiCategoria = '⚔️';
          else if (cat.indexOf('fps') !== -1 || cat.indexOf('shoot') !== -1) emojiCategoria = '🔫';
          else if (cat.indexOf('moba') !== -1) emojiCategoria = '🏆';
        }

        container.innerHTML +=
          '<div class="schedule-card-premium" data-id="' + a.id + '">' +
            '<div class="sc-top">' +
              '<span class="sc-badge" style="background:' + cor + '18;color:' + cor + ';border-color:' + cor + '44;">' +
                statusEmoji + ' ' + labels[a.status] +
              '</span>' +
              '<span class="sc-date"><i class="bi bi-calendar3"></i> ' + formatDate(a.data) + ' <i class="bi bi-clock"></i> ' + a.hora.slice(0, 5) + '</span>' +
            '</div>' +
            '<h3 class="sc-title">' + escapeHtml(a.titulo) + '</h3>' +
            (a.categoria ? '<span class="sc-cat-badge"><i class="bi bi-tag"></i> ' + escapeHtml(a.categoria) + '</span>' : '') +
            (a.descricao ? '<p class="sc-desc">' + escapeHtml(a.descricao) + '</p>' : '') +
            '<div class="sc-actions">' +
              '<button class="sc-btn sc-btn-primary schedule-status-btn" data-id="' + a.id + '" data-status="agendada"><i class="bi bi-calendar-check"></i> Agendar</button>' +
              '<button class="sc-btn sc-btn-accent schedule-status-btn" data-id="' + a.id + '" data-status="planejamento"><i class="bi bi-diagram-3"></i> Planejamento</button>' +
              '<button class="sc-btn sc-btn-secondary schedule-status-btn" data-id="' + a.id + '" data-status="rascunho"><i class="bi bi-pencil"></i> Rascunho</button>' +
              '<button class="sc-btn sc-btn-danger schedule-delete-btn" data-id="' + a.id + '"><i class="bi bi-trash3"></i> Excluir</button>' +
            '</div>' +
          '</div>';
      });

      // Status change buttons
      container.querySelectorAll('.schedule-status-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-id');
          var status = this.getAttribute('data-status');
          apiPut('/agendamentos/' + id + '/status', { status: status })
            .then(function () {
              showToast('Status alterado para ' + status, 'success');
              loadAgendamentos();
            })
            .catch(function (err) { showToast(err.message, 'error'); });
        });
      });

      // Delete buttons
      container.querySelectorAll('.schedule-delete-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!confirm('Excluir este agendamento?')) return;
          var id = this.getAttribute('data-id');
          apiDel('/agendamentos/' + id)
            .then(function () {
              showToast('Agendamento exclu&iacute;do', 'success');
              loadAgendamentos();
            })
            .catch(function (err) { showToast(err.message, 'error'); });
        });
      });
    }

    function formatDate(dataStr) {
      var datePart = (dataStr || '').split('T')[0];
      if (!datePart) return dataStr || '';
      var parts = datePart.split('-');
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    // Quick action buttons on dashboard that link to agendamentos
    document.querySelectorAll('[data-action="nova-live"]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        // If on agendamentos page, open modal; otherwise navigate
        if (page === 'agendamentos.html') {
          // The modal open is handled by the button reference below
        } else {
          window.location.href = 'agendamentos.html';
        }
      });
    });
  }

  /* ==================================================================
     MODAL NOVA LIVE (shared between dashboard and agendamentos)
     ================================================================== */
  (function initNovaLiveModal() {
    var overlay = document.getElementById('novaLiveModal');
    if (!overlay) return;

    var closeBtn = document.getElementById('modalCloseBtn');
    var cancelBtn = document.getElementById('modalCancelBtn');
    var submitBtn = document.getElementById('modalSubmitBtn');
    var submitText = document.getElementById('modalSubmitText');

    var inpTitle = document.getElementById('ml-title');
    var inpCat = document.getElementById('ml-cat');
    var inpDate = document.getElementById('ml-date');
    var inpTime = document.getElementById('ml-time');
    var inpDesc = document.getElementById('ml-desc');

    var errTitle = document.getElementById('ml-title-err');
    var errDate = document.getElementById('ml-date-err');
    var errTime = document.getElementById('ml-time-err');

    // Open modal from any "Nova live" button
    document.querySelectorAll('.btn-primary').forEach(function (btn) {
      if (btn.textContent.replace(/\s+/g, ' ').trim().includes('Nova live')) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          openModal();
        });
      }
    });

    function openModal() {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { if (inpTitle) inpTitle.focus(); }, 260);
    }

    function closeModal() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      resetForm();
    }

    function resetForm() {
      if (inpTitle) inpTitle.value = '';
      if (inpCat) inpCat.value = '';
      if (inpDate) inpDate.value = '';
      if (inpTime) inpTime.value = '';
      if (inpDesc) inpDesc.value = '';
      var firstRadio = overlay.querySelector('input[name="ml-status"]');
      if (firstRadio) firstRadio.checked = true;
      [errTitle, errDate, errTime].forEach(function (el) { if (el) el.style.display = 'none'; });
      [inpTitle, inpDate, inpTime].forEach(function (el) { if (el) el.classList.remove('error'); });
    }

    function validate() {
      var ok = true;
      if (!inpTitle || !inpTitle.value.trim()) {
        if (inpTitle) inpTitle.classList.add('error');
        if (errTitle) errTitle.style.display = 'flex';
        ok = false;
      }
      if (!inpDate || !inpDate.value) {
        if (inpDate) inpDate.classList.add('error');
        if (errDate) errDate.style.display = 'flex';
        ok = false;
      }
      if (!inpTime || !inpTime.value) {
        if (inpTime) inpTime.classList.add('error');
        if (errTime) errTime.style.display = 'flex';
        ok = false;
      }
      return ok;
    }

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        if (!validate()) return;

        var statusRadio = overlay.querySelector('input[name="ml-status"]:checked');
        var payload = {
          usuario_id: user.id,
          titulo: inpTitle ? inpTitle.value.trim() : '',
          categoria: inpCat ? inpCat.value.trim() : '',
          data: inpDate ? inpDate.value : '',
          hora: inpTime ? inpTime.value : '',
          descricao: inpDesc ? inpDesc.value.trim() : '',
          status: statusRadio ? statusRadio.value : 'agendada'
        };

        submitBtn.disabled = true;
        if (submitText) submitText.textContent = 'Criando...';

        apiPost('/agendamentos', payload)
          .then(function () {
            submitBtn.disabled = false;
            if (submitText) submitText.textContent = 'Criar live';
            closeModal();
            showToast('Live <strong>' + escapeHtml(payload.titulo) + '</strong> criada!', 'success');
            // Reload agendamentos if on that page
            if (page === 'agendamentos.html') {
              loadAgendamentos();
            }
          })
          .catch(function (err) {
            submitBtn.disabled = false;
            if (submitText) submitText.textContent = 'Criar live';
            showToast(err.message, 'error');
          });
      });
    }

    [inpTitle, inpDate, inpTime].forEach(function (inp, i) {
      if (!inp) return;
      inp.addEventListener('input', function () {
        this.classList.remove('error');
        var errs = [errTitle, errDate, errTime];
        if (errs[i]) errs[i].style.display = 'none';
      });
    });
  })();

  /* ==================================================================
     COMUNIDADE PAGE
     ================================================================== */
  if (page === 'comunidade.html') {
    renderUser();
    loadComunidade();

    function loadComunidade() {
      if (!user.id) return;

      apiGet('/membros?usuario_id=' + user.id).then(function (membros) {
        var total = membros.length;
        var seguidores = membros.reduce(function (s, m) { return s + (m.seguidores || 0); }, 0);
        var horas = membros.reduce(function (s, m) { return s + (m.horas_assistidas || 0); }, 0);

        setText('totalFollowers', formatNum(seguidores));
        setText('totalMembers', membros.length);
        setText('totalHoursWatched', horas.toFixed(0) + 'h');

        // Engagement rate
        var eng = membros.length > 0 ? ((membros.filter(function (m) { return m.nivel === 'VIP' || m.nivel === 'MOD'; }).length / membros.length) * 100).toFixed(1) : '0';
        setText('engagementRate', eng + '%');

        renderMembersTable(membros);
      }).catch(function () {});

      // Level distribution
      apiGet('/membros/niveis?usuario_id=' + user.id).then(function (niveis) {
        renderLevels(niveis);
        initGrowthChart(niveis);
      }).catch(function () {});
    }

    function renderMembersTable(membros) {
      var tbody = document.querySelector('.members-table tbody');
      if (!tbody) return;

      var searchInput = document.getElementById('memberSearch');
      var filterPills = document.querySelectorAll('.members-filter .filter-pill');

      function renderFiltered() {
        var busca = searchInput ? searchInput.value.toLowerCase() : '';
        var filtro = document.querySelector('.members-filter .filter-pill.active');
        var nivelFiltro = filtro ? filtro.getAttribute('data-filter') || 'todos' : 'todos';

        var filtered = membros.filter(function (m) {
          if (nivelFiltro !== 'todos' && m.nivel !== nivelFiltro) return false;
          if (busca && m.nome.toLowerCase().indexOf(busca) === -1 && m.username.toLowerCase().indexOf(busca) === -1) return false;
          return true;
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-tertiary);">Nenhum membro encontrado.</td></tr>';
          return;
        }

        filtered.forEach(function (m) {
          var badgeColor = { VIP: 'badge-purple', MOD: 'badge-green', SUB: 'badge-yellow', NEW: 'badge-gray' };
          tbody.innerHTML +=
            '<tr>' +
              '<td><div class="member-cell">' +
                '<div class="member-avatar" style="background:var(--nexus-purple);">' + m.nome.charAt(0).toUpperCase() + '</div>' +
                '<div><strong>' + escapeHtml(m.nome) + '</strong><span style="font-size:0.8rem;color:var(--text-tertiary);">@' + escapeHtml(m.username) + '</span></div>' +
              '</div></td>' +
              '<td><span class="badge ' + (badgeColor[m.nivel] || 'badge-gray') + '">' + m.nivel + '</span></td>' +
              '<td>' + formatNum(m.seguidores) + '</td>' +
              '<td>' + (m.horas_assistidas || 0).toFixed(1) + 'h</td>' +
              '<td>' + (m.ultima_visita ? new Date(m.ultima_visita).toLocaleDateString('pt-BR') : '-') + '</td>' +
            '</tr>';
        });
      }

      if (searchInput) {
        searchInput.addEventListener('input', renderFiltered);
      }

      filterPills.forEach(function (pill) {
        pill.addEventListener('click', function () {
          filterPills.forEach(function (p) { p.classList.remove('active'); });
          this.classList.add('active');
          renderFiltered();
        });
      });

      renderFiltered();
    }

    function renderLevels(niveis) {
      var container = document.querySelector('.level-distribution');
      if (!container) return;

      var total = niveis.VIP + niveis.MOD + niveis.SUB + niveis.NEW || 1;
      var cores = { VIP: '#8B42FF', MOD: '#4ADE80', SUB: '#FBBF24', NEW: '#6B6B76' };
      var labels = { VIP: 'VIP', MOD: 'MOD', SUB: 'SUB', NEW: 'NEW' };

      container.innerHTML = '';
      ['VIP', 'MOD', 'SUB', 'NEW'].forEach(function (nivel) {
        var pct = ((niveis[nivel] || 0) / total * 100).toFixed(0);
        container.innerHTML +=
          '<div class="level-bar-item">' +
            '<div class="level-bar-label"><span>' + labels[nivel] + '</span><span>' + (niveis[nivel] || 0) + '</span></div>' +
            '<div class="level-bar-track"><div class="level-bar-fill" style="width:' + pct + '%;background:' + (cores[nivel] || '#6B6B76') + ';"></div></div>' +
          '</div>';
      });
    }

    function initGrowthChart(niveis) {
      var canvas = document.getElementById('growthChart');
      if (!canvas || typeof Chart === 'undefined') return;

      var values = [niveis.VIP || 0, niveis.MOD || 0, niveis.SUB || 0, niveis.NEW || 0];

      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: ['VIP', 'MOD', 'SUB', 'NEW'],
          datasets: [{
            label: 'Membros',
            data: values,
            backgroundColor: ['#8B42FF', '#4ADE80', '#FBBF24', '#6B6B76'],
            borderRadius: 4,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#6B6B76', font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6B6B76', font: { size: 11 }, maxTicksLimit: 4 } }
          }
        }
      });
    }

    // Gift Sub button
    var giftBtn = document.getElementById('giftSubBtn');
    if (giftBtn) {
      giftBtn.addEventListener('click', function () {
        var nome = user.nome || 'Streamer';
        var viewerCount = parseInt(document.getElementById('totalMembers')?.textContent || '342');
        var sorteio = Math.floor(Math.random() * viewerCount) + 1;
        showToast('Gift sub enviado para ' + sorteio + ' espectadores!', 'success');
      });
    }

    // Notificar Todos button
    var notifyBtn = document.getElementById('notifyAllBtn');
    if (notifyBtn) {
      notifyBtn.addEventListener('click', function () {
        showToast('Notificação enviada para todos os seguidores!', 'success');
      });
    }
  }

  /* ==================================================================
     LIVE STUDIO PAGE
     ================================================================== */
  if (page === 'live-studio.html') {
    renderUser();
    initLiveStudio();

    function initLiveStudio() {
      var toggleBtn = document.getElementById('liveToggleBtn');
      var liveVideo = document.getElementById('liveVideo');
      var liveOfflineImg = document.getElementById('liveOfflineImg');
      var liveStatusText = document.getElementById('liveStatusText');
      var liveBadge = document.getElementById('liveBadge');
      var viewerCount = document.getElementById('viewerCount');
      var chatViewerCount = document.getElementById('chatViewerCount');
      var liveTimer = document.getElementById('liveTimer');
      var endLiveBtn = document.getElementById('endLiveBtn');

      var isLiveOn = false;
      var stream = null;
      var timerInterval = null;
      var seconds = 0;
      var currentTransmissaoId = null;

      function formatTime(s) {
        var h = String(Math.floor(s / 3600)).padStart(2, '0');
        var m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        var sec = String(s % 60).padStart(2, '0');
        return h + ':' + m + ':' + sec;
      }

      function startTimer() {
        seconds = 0;
        if (liveTimer) liveTimer.textContent = '00:00:00';
        timerInterval = setInterval(function () {
          seconds++;
          if (liveTimer) liveTimer.textContent = formatTime(seconds);
        }, 1000);
      }

      function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      function updateLiveUI(on) {
        var offlineImg = document.getElementById('liveOfflineImg');
        var fallback = document.getElementById('liveFallback');

        if (on) {
          localStorage.setItem('nexus_live_on', 'true');
          if (liveStatusText) liveStatusText.textContent = 'LIVE ON';
          if (liveBadge) liveBadge.className = 'live-preview-badge pulse-red';
          if (viewerCount) viewerCount.textContent = Math.floor(Math.random() * 200 + 50);
          if (chatViewerCount) chatViewerCount.textContent = viewerCount ? viewerCount.textContent : '0';
          if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="bi bi-stop-circle"></i> Live Off';
            toggleBtn.className = 'btn-danger btn-sm';
          }
          if (offlineImg) offlineImg.style.display = 'none';
          if (fallback) fallback.style.display = 'none';
          startTimer();
        } else {
          localStorage.setItem('nexus_live_on', 'false');
          if (liveStatusText) liveStatusText.textContent = 'LIVE OFF';
          if (liveBadge) liveBadge.className = 'live-preview-badge';
          if (viewerCount) viewerCount.textContent = '0';
          if (chatViewerCount) chatViewerCount.textContent = '0';
          if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="bi bi-play-circle"></i> Live On';
            toggleBtn.className = 'btn-secondary btn-sm';
          }
          if (offlineImg) offlineImg.style.display = 'block';
          if (fallback) fallback.style.display = 'flex';
          stopTimer();
          if (liveTimer) liveTimer.textContent = '00:00:00';
        }
      }

      if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
          isLiveOn = !isLiveOn;

          if (isLiveOn) {
            // Start webcam
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                .then(function (mediaStream) {
                  stream = mediaStream;
                  if (liveVideo) {
                    liveVideo.srcObject = stream;
                    liveVideo.classList.add('active');
                  }
                  if (liveOfflineImg) liveOfflineImg.style.display = 'none';
                  updateLiveUI(true);

                  // Iniciar transmissão na API
                  if (user.id) {
                    apiPost('/transmissoes/iniciar', { usuario_id: user.id, titulo: 'Live pelo painel' })
                      .then(function (t) {
                        currentTransmissaoId = t.id;
                      }).catch(function () {});
                  }
                })
                .catch(function () {
                  if (liveVideo) liveVideo.classList.remove('active');
                  if (liveOfflineImg) liveOfflineImg.style.display = 'block';
                  updateLiveUI(true);
                });
            } else {
              if (liveVideo) liveVideo.classList.remove('active');
              if (liveOfflineImg) liveOfflineImg.style.display = 'block';
              updateLiveUI(true);
            }
          } else {
            // Stop webcam
            if (stream) {
              stream.getTracks().forEach(function (t) { t.stop(); });
              stream = null;
            }
            if (liveVideo) {
              liveVideo.srcObject = null;
              liveVideo.classList.remove('active');
            }
            if (liveOfflineImg) liveOfflineImg.style.display = 'block';
            updateLiveUI(false);

            // Encerrar na API
            if (currentTransmissaoId) {
              apiPut('/transmissoes/' + currentTransmissaoId + '/encerrar', {})
                .then(function () { currentTransmissaoId = null; })
                .catch(function () {});
            }

            var statuses = document.querySelectorAll('.live-control-status');
            statuses.forEach(function (el) {
              if (el.id !== 'connectionStatus') el.className = 'live-control-status off';
            });
          }
        });
      }

      // End live button
      if (endLiveBtn) {
        endLiveBtn.addEventListener('click', function () {
          if (isLiveOn) {
            if (stream) {
              stream.getTracks().forEach(function (t) { t.stop(); });
              stream = null;
            }
            if (liveVideo) {
              liveVideo.srcObject = null;
              liveVideo.classList.remove('active');
            }
            if (liveOfflineImg) liveOfflineImg.style.display = 'block';
            isLiveOn = false;
            updateLiveUI(false);

            if (currentTransmissaoId) {
              apiPut('/transmissoes/' + currentTransmissaoId + '/encerrar', {})
                .then(function () { currentTransmissaoId = null; })
                .catch(function () {});
            }

            document.querySelectorAll('.live-control-status').forEach(function (el) { el.className = 'live-control-status off'; });
          }
        });
      }

      // Chat
      var chatInput = document.getElementById('chatInput');
      var chatSendBtn = document.getElementById('chatSendBtn');
      var chatMessages = document.getElementById('chatMessages');

      function sendChatMessage(text) {
        if (!text.trim() || !chatMessages) return;
        var now = new Date();
        var time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        var msg = document.createElement('div');
        msg.className = 'chat-message';
        msg.innerHTML =
          '<div class="chat-message-header">' +
            '<span class="chat-message-name" style="color:var(--nexus-purple-light);">Voc&ecirc;</span>' +
            '<span class="chat-message-time">' + time + '</span>' +
          '</div>' +
          '<div class="chat-message-text">' + escapeHtml(text) + '</div>';
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      if (chatSendBtn && chatInput) {
        chatSendBtn.addEventListener('click', function () {
          sendChatMessage(chatInput.value);
          if (currentTransmissaoId && user.id) {
            apiPost('/transmissoes/' + currentTransmissaoId + '/chat', { usuario_id: user.id, mensagem: chatInput.value }).catch(function () {});
          }
          chatInput.value = '';
        });
        chatInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            chatSendBtn.click();
          }
        });
      }

      // Control toggles
      document.querySelectorAll('.live-control-item').forEach(function (item) {
        item.addEventListener('click', function () {
          var statusEl = this.querySelector('.live-control-status');
          if (!statusEl) return;
          if (statusEl.classList.contains('on')) {
            statusEl.className = 'live-control-status off';
          } else {
            statusEl.className = 'live-control-status on';
          }
        });
      });

      // Fullscreen button
      var fullscreenBtn = document.getElementById('liveFullscreenBtn');
      var livePreview = document.getElementById('livePreview');
      if (fullscreenBtn && livePreview) {
        fullscreenBtn.addEventListener('click', function () {
          if (!document.fullscreenElement) {
            var el = livePreview;
            if (el.requestFullscreen) {
              el.requestFullscreen();
            } else if (el.webkitRequestFullscreen) {
              el.webkitRequestFullscreen();
            } else if (el.msRequestFullscreen) {
              el.msRequestFullscreen();
            }
            fullscreenBtn.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
          } else {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
              document.msExitFullscreen();
            }
            fullscreenBtn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
          }
        });
        document.addEventListener('fullscreenchange', function () {
          if (!document.fullscreenElement) {
            fullscreenBtn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
          }
        });
      }
    }
  }

  /* ==================================================================
     CONFIGURAÇÕES PAGE
     ================================================================== */
  if (page === 'configuracoes.html') {
    renderUser();
    loadConfig();

    function loadConfig() {
      if (!user.id) return;

      // Load user profile
      apiGet('/auth/me?user_id=' + user.id).then(function (u) {
        var nome = document.getElementById('configName');
        var username = document.getElementById('configUsername');
        var email = document.getElementById('configEmail');
        var bio = document.getElementById('configBio');
        if (nome) nome.value = u.nome || '';
        if (username) username.value = u.username || '';
        if (email) email.value = u.email || '';
        if (bio) bio.value = u.bio || '';

        // Update config avatar preview from localStorage (not API)
        var configPreview = document.getElementById('configAvatarPreview');
        if (configPreview) {
          if (user.avatar) {
            configPreview.innerHTML = '<img src="' + user.avatar + '" alt="Avatar">';
          } else {
            configPreview.textContent = user.nome ? user.nome.trim().charAt(0).toUpperCase() : 'L';
          }
        }
      }).catch(function () {});

      // Load stream config
      apiGet('/config?usuario_id=' + user.id).then(function (c) {
        var q = document.getElementById('configQuality');
        var b = document.getElementById('configBitrate');
        var s = document.getElementById('configServer');
        if (q) q.value = c.qualidade || '1080p';
        if (b) b.value = String(c.bitrate || 6000);
        if (s) s.value = c.servidor_ingest || 'S&atilde;o Paulo';
      }).catch(function () {});
    }

    // Avatar upload
    var avatarInput = document.getElementById('avatarUpload');
    if (avatarInput) {
      avatarInput.addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
          // Compress image client-side to max 400x400
          var img = new Image();
          img.onload = function () {
            var MAX = 400;
            var w = img.width, h = img.height;
            if (w > MAX || h > MAX) {
              if (w > h) { h = h * MAX / w; w = MAX; }
              else { w = w * MAX / h; h = MAX; }
            }
            var canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            var dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            saveAvatar(dataUrl);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    function saveAvatar(dataUrl) {
      var stored = localStorage.getItem('nexus_user');
      if (stored) {
        try {
          var u = JSON.parse(stored);
          u.avatar = dataUrl;
          localStorage.setItem('nexus_user', JSON.stringify(u));
        } catch (err) {}
      }
      var sidebarAvatar = document.querySelector('.sidebar-avatar');
      if (sidebarAvatar) {
        sidebarAvatar.innerHTML = '';
        var img = document.createElement('img');
        img.src = dataUrl;
        img.alt = 'Avatar';
        img.style.cssText = 'width:100%;height:100%;border-radius:50%;object-fit:cover;';
        sidebarAvatar.appendChild(img);
      }
      apiPut('/auth/profile', { user_id: user.id, avatar: dataUrl }).catch(function () {});
      showToast('Foto de perfil atualizada!', 'success');
    }

    // Save profile
    var saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', function () {
        var nome = document.getElementById('configName');
        var username = document.getElementById('configUsername');
        var bio = document.getElementById('configBio');

        apiPut('/auth/profile', {
          user_id: user.id,
          nome: nome ? nome.value : undefined,
          username: username ? username.value : undefined,
          bio: bio ? bio.value : undefined
        }).then(function () {
          var stored = localStorage.getItem('nexus_user');
          if (stored) {
            try {
              var u = JSON.parse(stored);
              if (nome) u.nome = nome.value;
              if (username) u.username = username.value;
              if (bio) u.bio = bio.value;
              localStorage.setItem('nexus_user', JSON.stringify(u));
            } catch (e) {}
          }
          showToast('Perfil atualizado!', 'success');
          renderUser();
        }).catch(function (err) {
          showToast(err.message, 'error');
        });
      });
    }

    // Save stream config
    var saveStreamBtn = document.getElementById('saveStreamBtn');
    if (saveStreamBtn) {
      saveStreamBtn.addEventListener('click', function () {
        var qualidade = document.getElementById('configQuality');
        var bitrate = document.getElementById('configBitrate');
        var servidor = document.getElementById('configServer');

        apiPut('/config', {
          usuario_id: user.id,
          qualidade: qualidade ? qualidade.value : undefined,
          bitrate: bitrate ? parseInt(bitrate.value) : undefined,
          servidor_ingest: servidor ? servidor.value : undefined
        }).then(function () {
          showToast('Configura&ccedil;&otilde;es salvas!', 'success');
        }).catch(function (err) {
          showToast(err.message, 'error');
        });
      });
    }

    // Stream key regenerate
    var regenKeyBtn = document.getElementById('regenStreamKey');
    if (regenKeyBtn) {
      regenKeyBtn.addEventListener('click', function () {
        if (!confirm('Gerar nova chave de stream? A chave anterior ser&aacute; invalidada.')) return;
        apiPost('/config/regenerate-key', { usuario_id: user.id })
          .then(function (res) {
            var keyEl = document.getElementById('streamKeyValue');
            if (keyEl) keyEl.textContent = res.stream_key;
            showToast('Nova chave gerada!', 'success');
          }).catch(function (err) { showToast(err.message, 'error'); });
      });
    }

    // Change password
    var changePwdBtn = document.getElementById('changePwdBtn');
    if (changePwdBtn) {
      changePwdBtn.addEventListener('click', function () {
        var atual = document.getElementById('pwdCurrent');
        var nova = document.getElementById('pwdNew');
        var confirm = document.getElementById('pwdConfirm');

        if (!atual || !nova || !confirm) return;
        if (nova.value.length < 8) { showToast('Nova senha deve ter 8+ caracteres', 'error'); return; }
        if (nova.value !== confirm.value) { showToast('Senhas n&atilde;o conferem', 'error'); return; }

        apiPut('/config/change-password', {
          usuario_id: user.id,
          senha_atual: atual.value,
          nova_senha: nova.value
        }).then(function () {
          showToast('Senha alterada com sucesso!', 'success');
          atual.value = '';
          nova.value = '';
          confirm.value = '';
        }).catch(function (err) {
          showToast(err.message, 'error');
        });
      });
    }

    // Toggle switches
    document.querySelectorAll('.toggle-switch input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var map = {
          'notifFollowers': 'notif_seguidores',
          'notifGifts': 'notif_gift',
          'notifReminder': 'notif_lembrete',
          'notifReport': 'notif_relatorio'
        };
        var field = map[this.id];
        if (field && user.id) {
          var payload = { usuario_id: user.id };
          payload[field] = this.checked ? 1 : 0;
          apiPut('/config', payload).catch(function () {});
        }
      });
    });
  }
});
