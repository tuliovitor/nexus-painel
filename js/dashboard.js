/* ==========================================
   NEXUS PAINEL — Dashboard JavaScript
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- LOAD USER DATA FROM LOCALSTORAGE ---------- */
  (function loadUserData() {
    var stored = localStorage.getItem('nexus_user');
    if (stored) {
      try {
        var user = JSON.parse(stored);
        var sidebarName = document.querySelector('.sidebar-user-name');
        var sidebarHandle = document.querySelector('.sidebar-user-handle');
        var headerTitle = document.querySelector('.dashboard-header-left h2');
        var sidebarAvatar = document.querySelector('.sidebar-avatar');

        if (sidebarName && user.name) sidebarName.textContent = user.name;
        if (sidebarHandle && user.handle) sidebarHandle.textContent = user.handle;
        if (headerTitle && user.name) headerTitle.innerHTML = 'Ol&aacute;, ' + user.name.split(' ')[0];

        // Avatar photo
        if (sidebarAvatar && user.avatar) {
          var letter = sidebarAvatar.firstChild;
          if (letter && letter.nodeType === 3) {
            sidebarAvatar.innerHTML = '';
          } else if (letter) {
            sidebarAvatar.innerHTML = '';
          }
          var img = document.createElement('img');
          img.src = user.avatar;
          img.alt = user.name;
          img.style.cssText = 'width:100%;height:100%;border-radius:50%;object-fit:cover;';
          sidebarAvatar.appendChild(img);
        }
      } catch (e) {}
    }
  })();

  /* ---------- MOBILE SIDEBAR TOGGLE ---------- */
  (function mobileSidebar() {
    var btn = document.getElementById('mobileMenuBtn');
    var overlay = document.getElementById('sidebarOverlay');
    var sidebar = document.querySelector('.dashboard-sidebar');

    if (!btn || !sidebar) return;

    function toggleSidebar(open) {
      if (open === undefined) {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
      } else if (open) {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
      } else {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
      }
    }

    btn.addEventListener('click', function () {
      toggleSidebar();
    });

    if (overlay) {
      overlay.addEventListener('click', function () {
        toggleSidebar(false);
      });

      // Close sidebar on link click
      sidebar.querySelectorAll('.sidebar-link').forEach(function (link) {
        link.addEventListener('click', function () {
          if (window.innerWidth < 768) {
            toggleSidebar(false);
          }
        });
      });
    }
  })();

  /* ---------- DATE DISPLAY ---------- */
  var dateDisplay = document.getElementById('dateDisplay');
  if (dateDisplay) {
    var days = ['Domingo', 'Segunda-feira', 'Ter&ccedil;a-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'S&aacute;bado'];
    var months = ['janeiro', 'fevereiro', 'mar&ccedil;o', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    var now = new Date();
    dateDisplay.innerHTML = days[now.getDay()] + ', ' + now.getDate() + ' de ' + months[now.getMonth()] + ' de ' + now.getFullYear();
  }

  /* ---------- WEEKLY CHART (Dashboard) ---------- */
  var weeklyCanvas = document.getElementById('weeklyChart');
  if (weeklyCanvas && typeof Chart !== 'undefined') {
    new Chart(weeklyCanvas, {
      type: 'line',
      data: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'S&aacute;b', 'Dom'],
        datasets: [
          {
            label: 'Visualiza&ccedil;&otilde;es',
            data: [4200, 5100, 3800, 6200, 4500, 7800, 6900],
            borderColor: '#8B42FF',
            backgroundColor: 'rgba(139, 66, 255, 0.08)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#8B42FF',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Seguidores',
            data: [120, 180, 90, 240, 160, 310, 280],
            borderColor: '#4ADE80',
            backgroundColor: 'rgba(74, 222, 128, 0.05)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#4ADE80',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#6B6B76', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#6B6B76', font: { size: 11 }, maxTicksLimit: 5 }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  /* ---------- GROWTH CHART (Comunidade) ---------- */
  var growthCanvas = document.getElementById('growthChart');
  if (growthCanvas && typeof Chart !== 'undefined') {
    new Chart(growthCanvas, {
      type: 'bar',
      data: {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
        datasets: [
          {
            label: 'Novos seguidores',
            data: [85, 102, 68, 134, 96, 127],
            backgroundColor: function (context) {
              var chart = context.chart;
              var meta = chart.getDatasetMeta(0);
              if (!meta || !meta.data) return '#8B42FF';
              var index = context.dataIndex;
              return index === meta.data.length - 1 ? '#8B42FF' : 'rgba(255,255,255,0.15)';
            },
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#6B6B76', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#6B6B76', font: { size: 11 }, maxTicksLimit: 4 }
          }
        }
      }
    });
  }

  /* ---------- FILTER PILLS ---------- */
  var filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      var parent = this.parentElement;
      parent.querySelectorAll('.filter-pill').forEach(function (p) {
        p.classList.remove('active');
      });
      this.classList.add('active');
    });
  });

  /* ---------- LIVE STUDIO ---------- */
  var liveToggleBtn = document.getElementById('liveToggleBtn');
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

  function formatTime(s) {
    var h = String(Math.floor(s / 3600)).padStart(2, '0');
    var m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    var sec = String(s % 60).padStart(2, '0');
    return h + ':' + m + ':' + sec;
  }

  function startTimer() {
    seconds = 0;
    if (liveTimer) liveTimer.textContent = formatTime(0);
    timerInterval = setInterval(function () {
      seconds++;
      if (liveTimer) liveTimer.textContent = formatTime(seconds);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function updateLiveUI(isOn) {
    var offlineImg = document.getElementById('liveOfflineImg');
    var fallback = document.getElementById('liveFallback');

    if (isOn) {
      if (liveStatusText) liveStatusText.textContent = 'LIVE ON';
      if (liveBadge) liveBadge.className = 'live-preview-badge pulse-red';
      if (viewerCount) viewerCount.textContent = Math.floor(Math.random() * 200 + 50);
      if (chatViewerCount) chatViewerCount.textContent = viewerCount ? viewerCount.textContent : '0';
      if (liveToggleBtn) {
        liveToggleBtn.innerHTML = '<i class="bi bi-stop-circle"></i> Live Off';
        liveToggleBtn.className = 'btn-danger btn-sm';
      }
      if (offlineImg) offlineImg.style.display = 'none';
      if (fallback) fallback.style.display = 'none';
      startTimer();
    } else {
      if (liveStatusText) liveStatusText.textContent = 'LIVE OFF';
      if (liveBadge) liveBadge.className = 'live-preview-badge';
      if (viewerCount) viewerCount.textContent = '0';
      if (chatViewerCount) chatViewerCount.textContent = '0';
      if (liveToggleBtn) {
        liveToggleBtn.innerHTML = '<i class="bi bi-play-circle"></i> Live On';
        liveToggleBtn.className = 'btn-secondary btn-sm';
      }
      if (offlineImg) offlineImg.style.display = 'block';
      if (fallback) fallback.style.display = 'flex';
      stopTimer();
      if (liveTimer) liveTimer.textContent = '00:00:00';
    }
  }

  if (liveToggleBtn) {
    liveToggleBtn.addEventListener('click', function () {
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

              // Update control statuses
              var camStatus = document.getElementById('cameraStatus');
              if (camStatus) camStatus.className = 'live-control-status on';
              var micStatus = document.getElementById('microphoneStatus');
              if (micStatus) micStatus.className = 'live-control-status on';
            })
            .catch(function () {
              // Fallback: UI only, no camera
              if (liveVideo) liveVideo.classList.remove('active');
              if (liveOfflineImg) liveOfflineImg.style.display = 'block';
              updateLiveUI(true);
            });
        } else {
          // No getUserMedia support
          if (liveVideo) liveVideo.classList.remove('active');
          if (liveOfflineImg) liveOfflineImg.style.display = 'block';
          updateLiveUI(true);
        }
      } else {
        // Stop webcam
        if (stream) {
          stream.getTracks().forEach(function (track) { track.stop(); });
          stream = null;
        }
        if (liveVideo) {
          liveVideo.srcObject = null;
          liveVideo.classList.remove('active');
        }
        if (liveOfflineImg) liveOfflineImg.style.display = 'block';
        updateLiveUI(false);

        // Reset control statuses
        var statuses = document.querySelectorAll('.live-control-status');
        statuses.forEach(function (el) {
          if (el.id !== 'connectionStatus') {
            el.className = 'live-control-status off';
          }
        });
      }
    });
  }

  // End live button
  if (endLiveBtn) {
    endLiveBtn.addEventListener('click', function () {
      if (isLiveOn) {
        // Simulate ending
        if (stream) {
          stream.getTracks().forEach(function (track) { track.stop(); });
          stream = null;
        }
        if (liveVideo) {
          liveVideo.srcObject = null;
          liveVideo.classList.remove('active');
        }
        if (liveOfflineImg) liveOfflineImg.style.display = 'block';
        isLiveOn = false;
        updateLiveUI(false);

        var statuses = document.querySelectorAll('.live-control-status');
        statuses.forEach(function (el) { el.className = 'live-control-status off'; });
      }
    });
  }

  /* ---------- CHAT SEND ---------- */
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

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener('click', function () {
      sendChatMessage(chatInput.value);
      chatInput.value = '';
    });

    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        sendChatMessage(chatInput.value);
        chatInput.value = '';
      }
    });
  }

  /* ---------- CONTROL TOGGLES (Live Studio) ---------- */
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

  /* ========== MODAL NOVA LIVE ========== */
  (function initNovaLiveModal() {
    var overlay    = document.getElementById('novaLiveModal');
    if (!overlay) return;

    var closeBtn   = document.getElementById('modalCloseBtn');
    var cancelBtn  = document.getElementById('modalCancelBtn');
    var submitBtn  = document.getElementById('modalSubmitBtn');
    var submitText = document.getElementById('modalSubmitText');

    var inpTitle = document.getElementById('ml-title');
    var inpCat   = document.getElementById('ml-cat');
    var inpDate  = document.getElementById('ml-date');
    var inpTime  = document.getElementById('ml-time');
    var inpDesc  = document.getElementById('ml-desc');

    var errTitle = document.getElementById('ml-title-err');
    var errDate  = document.getElementById('ml-date-err');
    var errTime  = document.getElementById('ml-time-err');

    document.querySelectorAll('button').forEach(function (btn) {
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
      setTimeout(function () {
        if (inpTitle) inpTitle.focus();
      }, 260);
    }

    function closeModal() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      resetForm();
    }

    function resetForm() {
      if (inpTitle) inpTitle.value = '';
      if (inpCat)   inpCat.value   = '';
      if (inpDate)  inpDate.value  = '';
      if (inpTime)  inpTime.value  = '';
      if (inpDesc)  inpDesc.value  = '';
      var firstRadio = overlay.querySelector('input[name="ml-status"]');
      if (firstRadio) firstRadio.checked = true;
      [errTitle, errDate, errTime].forEach(function (el) {
        if (el) el.style.display = 'none';
      });
      [inpTitle, inpDate, inpTime].forEach(function (el) {
        if (el) el.classList.remove('error');
      });
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

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    if (closeBtn)  closeBtn.addEventListener('click',  closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        if (!validate()) return;

        var statusRadio = overlay.querySelector('input[name="ml-status"]:checked');
        var payload = {
          title:    inpTitle ? inpTitle.value.trim() : '',
          category: inpCat   ? inpCat.value.trim()   : '',
          date:     inpDate  ? inpDate.value          : '',
          time:     inpTime  ? inpTime.value          : '',
          status:   statusRadio ? statusRadio.value   : 'agendada',
          desc:     inpDesc  ? inpDesc.value.trim()   : ''
        };

        submitBtn.disabled = true;
        if (submitText) submitText.textContent = 'Criando...';

        setTimeout(function () {
          submitBtn.disabled = false;
          if (submitText) submitText.textContent = 'Criar live';
          closeModal();

          var toast = document.createElement('div');
          toast.style.cssText = [
            'position:fixed','bottom:24px','right:24px','z-index:9999',
            'background:#13131A','border:1px solid rgba(74,222,128,0.3)',
            'color:#F5F5F7','padding:14px 20px','border-radius:12px',
            'font-size:0.88rem','display:flex','align-items:center','gap:10px',
            'box-shadow:0 8px 30px rgba(0,0,0,0.5)',
            'animation:fadeIn 0.3s ease'
          ].join(';');
          toast.innerHTML =
            '<i class="bi bi-check-circle-fill" style="color:#4ADE80;font-size:1.1rem;"></i>' +
            '<span>Live <strong>' + payload.title + '</strong> criada!</span>';
          document.body.appendChild(toast);
          setTimeout(function () { toast.remove(); }, 3500);
        }, 800);
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

  /* ---------- TOAST UTILITY ---------- */
  function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.id = 'toastContainer';
      document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    var icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-info-circle-fill';
    toast.innerHTML = '<i class="bi ' + icon + '"></i> ' + escapeHtml(message);
    container.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }

  /* ---------- COMMUNITY TOASTS (Notificar todos / Gift sub) ---------- */
  (function communityToasts() {
    var notifyBtn = document.querySelector('.dashboard-header .btn-secondary .bi-megaphone');
    var giftBtn = document.querySelector('.dashboard-header .btn-primary .bi-gift');

    if (notifyBtn) {
      notifyBtn.parentElement.addEventListener('click', function () {
        showToast('Notifica&ccedil;&atilde;o enviada para todos os seguidores!', 'success');
      });
    }
    if (giftBtn) {
      giftBtn.parentElement.addEventListener('click', function () {
        showToast('Presenteie um sub para a comunidade!', 'info');
      });
    }
  })();

  /* ---------- AVATAR UPLOAD (Config page) ---------- */
  (function avatarUpload() {
    var avatarInput = document.getElementById('avatarUpload');
    if (!avatarInput) return;

    avatarInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        var dataUrl = e.target.result;

        // Save to localStorage
        var stored = localStorage.getItem('nexus_user');
        if (stored) {
          try {
            var user = JSON.parse(stored);
            user.avatar = dataUrl;
            localStorage.setItem('nexus_user', JSON.stringify(user));
          } catch (err) {}
        }

        // Update sidebar avatar
        var sidebarAvatar = document.querySelector('.sidebar-avatar');
        if (sidebarAvatar) {
          sidebarAvatar.innerHTML = '';
          var img = document.createElement('img');
          img.src = dataUrl;
          img.alt = 'Avatar';
          img.style.cssText = 'width:100%;height:100%;border-radius:50%;object-fit:cover;';
          sidebarAvatar.appendChild(img);
        }

        showToast('Foto de perfil atualizada!', 'success');
      };
      reader.readAsDataURL(file);
    });
  })();

});
