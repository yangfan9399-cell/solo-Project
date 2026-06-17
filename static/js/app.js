const App = (() => {
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
  const csrftoken = getCookie('csrftoken');

  async function loadTrendChart(container, days = 30, poolId = null) {
    const canvas = container.querySelector('canvas');
    if (!canvas || !window.Chart) return;
    const params = new URLSearchParams({ days });
    if (poolId) params.set('pool_id', poolId);
    try {
      const res = await fetch(`/api/trend-data/?${params.toString()}`);
      const data = await res.json();
      if (canvas._chart) canvas._chart.destroy();
      canvas._chart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: '平均浓度(°Bé)',
              data: data.conc_avg,
              borderColor: '#0ea5e9',
              backgroundColor: 'rgba(14,165,233,.12)',
              borderWidth: 2.5,
              fill: true,
              tension: 0.35,
              pointRadius: 3,
              pointHoverRadius: 5,
              yAxisID: 'y'
            },
            {
              label: '每日收盐(吨)',
              data: data.daily_yield,
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245,158,11,.1)',
              borderWidth: 2,
              fill: false,
              tension: 0.35,
              pointRadius: 3,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'top', labels: { font: { size: 12 }, boxWidth: 14, padding: 18 } },
            tooltip: { backgroundColor: 'rgba(15,23,42,.92)', padding: 12, titleFont: { size: 13 }, bodyFont: { size: 12 } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 45, minRotation: 0 } },
            y: {
              type: 'linear', position: 'left',
              title: { display: true, text: '浓度(°Bé)', font: { size: 11 } },
              grid: { color: 'rgba(0,0,0,.05)' },
              ticks: { font: { size: 11 } },
              suggestedMin: 20, suggestedMax: 32
            },
            y1: {
              type: 'linear', position: 'right',
              title: { display: true, text: '收盐(吨)', font: { size: 11 } },
              grid: { display: false },
              ticks: { font: { size: 11 } }
            }
          }
        }
      });
    } catch (e) {
      console.error('Trend chart load failed:', e);
    }
  }

  function initGroupCompareChart() {
    const canvas = document.getElementById('group-compare-chart');
    const dataEl = document.getElementById('group-compare-data');
    if (!canvas || !dataEl || !window.Chart) return;
    let data;
    try {
      data = JSON.parse(dataEl.textContent);
    } catch (e) {
      console.error('Group compare data parse failed:', e);
      return;
    }
    if (canvas._chart) canvas._chart.destroy();
    canvas._chart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: '平均浓度(°Bé)',
            type: 'bar',
            data: data.avg_conc,
            backgroundColor: 'rgba(14,165,233,.7)',
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            label: '收盐量(吨)',
            type: 'line',
            data: data.total_yield,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.35,
            yAxisID: 'y1',
            pointRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 12 }, boxWidth: 14, padding: 16 } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: {
            type: 'linear', position: 'left',
            title: { display: true, text: '浓度(°Bé)' },
            suggestedMin: 20, suggestedMax: 32,
            grid: { color: 'rgba(0,0,0,.05)' }
          },
          y1: {
            type: 'linear', position: 'right',
            title: { display: true, text: '产量(吨)' },
            grid: { display: false }
          }
        }
      }
    });
  }

  function initPoolMap() {
    const map = document.getElementById('pool-map');
    if (!map) return;
    const data = JSON.parse(document.getElementById('pool-map-data')?.textContent || '[]');
    const tooltip = document.getElementById('pool-tooltip');

    data.forEach(p => {
      const cell = document.createElement('div');
      cell.className = 'pool-cell';
      const conc = p.latest_conc;
      let concClass = '';
      if (conc != null) {
        if (conc >= 24 && conc <= 30) concClass = 'conc-good';
        else if (conc >= 22 && conc <= 31) concClass = 'conc-warn';
        else concClass = 'conc-danger';
      }
      cell.classList.add(`status-${p.status}`);
      if (concClass) cell.classList.add(concClass);
      if (p.has_anomaly) cell.classList.add('has-alert');
      cell.style.left = p.x + '%';
      cell.style.top = p.y + '%';
      cell.innerHTML = `
        <div class="pool-label">${p.code}</div>
        <div class="pool-conc">${conc != null ? conc + '°Bé' : '-'}</div>
        <div class="pool-date">${p.latest_date || '无数据'}</div>
      `;
      cell.addEventListener('click', () => window.location.href = `/pools/${p.id}/`);
      cell.addEventListener('mouseenter', (e) => {
        if (tooltip) {
          const rect = cell.getBoundingClientRect();
          const mapRect = map.getBoundingClientRect();
          tooltip.innerHTML = `<strong>${p.code} ${p.name}</strong><br>池组: ${p.group} | 面积: ${p.area}亩<br>状态: ${p.status}<br>浓度: ${conc || '-'}°Bé`;
          tooltip.style.left = (rect.left - mapRect.left + rect.width / 2) + 'px';
          tooltip.style.top = (rect.top - mapRect.top - 10) + 'px';
          tooltip.classList.add('show');
        }
      });
      cell.addEventListener('mouseleave', () => tooltip && tooltip.classList.remove('show'));
      map.appendChild(cell);
    });
  }

  function initDashboardTrend() {
    const container = document.getElementById('trend-chart');
    if (container) loadTrendChart(container, 30);
    const btns = document.querySelectorAll('[data-trend-days]');
    let activePool = null;
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn');
        });
        btn.classList.add('btn-primary');
        btn.classList.remove('btn');
        loadTrendChart(container, parseInt(btn.dataset.trendDays), activePool);
      });
    });
  }

  function initPoolDetailTrend() {
    const container = document.getElementById('pool-trend-chart');
    if (!container) return;
    const poolId = container.dataset.poolId;
    loadTrendChart(container, 30, poolId);
    document.querySelectorAll('[data-pool-trend-days]').forEach(btn => {
      btn.addEventListener('click', () => loadTrendChart(container, parseInt(btn.dataset.poolTrendDays), poolId));
    });
  }

  function initConfirmDialogs() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-confirm]');
      if (!btn) return;
      e.preventDefault();
      const msg = btn.dataset.confirm || '确定要执行此操作吗？';
      if (confirm(msg)) {
        const href = btn.getAttribute('href');
        const form = btn.closest('form');
        if (form) form.submit();
        else if (href) window.location.href = href;
      }
    });
  }

  function initVersionCompare() {
    document.querySelectorAll('[data-toggle-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.toggleDiff);
        if (target) target.classList.toggle('hidden');
      });
    });
  }

  function initAutoDismiss() {
    setTimeout(() => {
      document.querySelectorAll('.alert-msg').forEach(m => {
        m.style.transition = 'opacity .3s';
        m.style.opacity = '0';
        setTimeout(() => m.remove(), 300);
      });
    }, 5000);
  }

  function initModal() {
    document.querySelectorAll('[data-modal-open]').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = document.getElementById(btn.dataset.modalOpen);
        if (m) m.classList.add('active');
      });
    });
    document.querySelectorAll('[data-modal-close], .modal-overlay').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el || el.hasAttribute('data-modal-close')) {
          const m = el.closest('.modal-overlay') || document.getElementById(el.dataset.modalClose || '');
          if (m) m.classList.remove('active');
        }
      });
    });
  }

  function initExportButtons() {
    document.querySelectorAll('[data-export]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.export;
        const qs = window.location.search;
        const map = {
          csv: '/export/csv/',
          excel: '/export/excel/',
          summary: '/export/summary/'
        };
        window.location.href = (map[type] || '') + qs;
      });
    });
  }

  function init() {
    document.addEventListener('DOMContentLoaded', () => {
      initPoolMap();
      initDashboardTrend();
      initGroupCompareChart();
      initPoolDetailTrend();
      initConfirmDialogs();
      initVersionCompare();
      initAutoDismiss();
      initModal();
      initExportButtons();
    });
  }

  return { init, loadTrendChart, csrftoken };
})();

App.init();
