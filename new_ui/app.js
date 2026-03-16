// ════════════════════════════════════════════════════════════
// RISKIQ PRO - FRONTEND APPLICATION
// Dashboard Navigation, Page Management & Interactivity
// ════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
  // ══ PAGE MANAGEMENT ══
  const pages = {
    dashboard: 'page-dashboard',
    portfolio: 'page-portfolio',
    analysis: 'page-analysis',
    reports: 'page-reports',
    about: 'page-about',
    model: 'page-model'
  };

  const titles = {
    dashboard: 'Risk Assessment Overview',
    portfolio: 'Loan Portfolio',
    analysis: 'Risk Analysis',
    reports: 'Reports',
    about: 'About Model',
    model: 'Model Specifications'
  };

  // ══ INITIALIZE ══
  function initApp() {
    setupSidebar();
    setupSearch();
    loadDashboard();
    setupChart();
  }

  // ══ SIDEBAR NAVIGATION ══
  function setupSidebar() {
    const navLinks = document.querySelectorAll('.sb-link');

    navLinks.forEach(link => {
      link.addEventListener('click', function () {
        const page = this.getAttribute('data-page');
        navigateToPage(page);
      });
    });
  }

  function navigateToPage(page) {
    // Update sidebar active state
    document.querySelectorAll('.sb-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Hide all pages
    Object.values(pages).forEach(pageId => {
      const pageEl = document.getElementById(pageId);
      if (pageEl) pageEl.classList.remove('active');
    });

    // Show selected page
    const pageEl = document.getElementById(pages[page]);
    if (pageEl) pageEl.classList.add('active');

    // Update title
    document.getElementById('page-title').textContent = titles[page] || 'Dashboard';

    // Load page-specific functionality
    switch (page) {
      case 'dashboard':
        loadDashboard();
        break;
      case 'analysis':
        setupAnalysisForm();
        break;
      case 'portfolio':
        loadPortfolio();
        break;
    }
  }

  // ══ SEARCH FUNCTIONALITY ══
  function setupSearch() {
    const searchInput = document.querySelector('.tb-search input');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        const query = e.target.value.toLowerCase();
        // Filter table rows if on portfolio page
        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(query) ? '' : 'none';
        });
      });
    }
  }

  // ══ DASHBOARD FUNCTIONALITY ══
  function loadDashboard() {
    // Fetch and update KPI cards
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        updateKPIs(data);
      })
      .catch(err => console.error('Failed to load dashboard stats:', err));

    // Initialize chart if it exists
    initializeCharts();
  }

  function updateKPIs(data) {
    // Update total assessments
    if (data.total_assessments !== undefined) {
      document.getElementById('kpi-total').textContent = data.total_assessments;
    }

    // Update default rate
    if (data.default_rate !== undefined) {
      document.getElementById('kpi-rate').textContent = 
        (data.default_rate * 100).toFixed(1) + '%';
    }

    // Update average confidence
    if (data.avg_confidence !== undefined) {
      document.getElementById('kpi-confidence').textContent = 
        (data.avg_confidence * 100).toFixed(1) + '%';
    }
  }

  // ══ PORTFOLIO PAGE ══
  function loadPortfolio() {
    fetch('/api/portfolio/assessments')
      .then(res => res.json())
      .then(data => {
        populateAssessmentsTable(data);
      })
      .catch(err => console.error('Failed to load portfolio:', err));
  }

  function populateAssessmentsTable(assessments) {
    const tableBody = document.querySelector('#portfolio-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    assessments.forEach(assessment => {
      const riskClass = assessment.risk_level === 'High' ? 'badge-danger' : 'badge-success';
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${assessment.name || 'N/A'}</td>
        <td>$${(assessment.loan_amount || 0).toLocaleString()}</td>
        <td><span class="badge ${riskClass}">${assessment.risk_level}</span></td>
        <td>${(assessment.confidence * 100).toFixed(1)}%</td>
        <td>${new Date(assessment.created_at).toLocaleDateString()}</td>
      `;

      tableBody.appendChild(row);
    });
  }

  // ══ RISK ANALYSIS FORM ══
  function setupAnalysisForm() {
    const form = document.querySelector('#analysis-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      // Submit risk assessment
      fetch('/api/analysis/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(res => res.json())
        .then(result => {
          showAssessmentResult(result);
        })
        .catch(err => {
          console.error('Assessment failed:', err);
          alert('Assessment failed. Please try again.');
        });
    });
  }

  function showAssessmentResult(result) {
    // Display result in modal or card
    const resultContainer = document.querySelector('#analysis-result');
    if (resultContainer) {
      const riskClass = result.risk_level === 'High' ? 'danger' : 'success';
      resultContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-label">Risk Assessment Result</div>
          <div style="margin-top: 1rem;">
            <span class="badge badge-${riskClass}">${result.risk_level} Risk</span>
            <div style="margin-top: 1rem; font-size: 2rem; font-weight: bold; color: #f0f4f8;">
              ${(result.confidence * 100).toFixed(1)}%
            </div>
            <div style="color: #a0aec0; margin-top: 0.5rem;">Confidence Score</div>
          </div>
        </div>
      `;
    }
  }

  // ══ CHART INITIALIZATION ══
  function initializeCharts() {
    const canvas = document.querySelector('.chart-canvas');
    if (!canvas) return;

    // Fetch chart data
    fetch('/api/dashboard/risk-distribution')
      .then(res => res.json())
      .then(data => {
        drawRiskDistributionChart(canvas, data);
      })
      .catch(err => console.error('Failed to load chart data:', err));
  }

  function drawRiskDistributionChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple bar chart implementation
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear canvas
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = 'rgba(59, 124, 244, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw bars
    const barWidth = (width - padding * 2) / 2 - 20;
    const maxValue = Math.max(data.low_risk || 0, data.high_risk || 0) || 1;

    // Low risk bar
    const lowHeight = ((data.low_risk || 0) / maxValue) * (height - padding * 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.fillRect(padding + 10, height - padding - lowHeight, barWidth, lowHeight);

    // High risk bar
    const highHeight = ((data.high_risk || 0) / maxValue) * (height - padding * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.fillRect(padding + barWidth + 30, height - padding - highHeight, barWidth, highHeight);

    // Labels
    ctx.fillStyle = '#a0aec0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOW RISK', padding + 10 + barWidth / 2, height - padding + 20);
    ctx.fillText('HIGH RISK', padding + barWidth + 30 + barWidth / 2, height - padding + 20);

    // Values
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#f0f4f8';
    ctx.fillText(data.low_risk || '0', padding + 10 + barWidth / 2, height - padding - lowHeight - 10);
    ctx.fillText(data.high_risk || '0', padding + barWidth + 30 + barWidth / 2, height - padding - highHeight - 10);
  }

  // ══ UTILITY FUNCTIONS ══
  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  function formatPercentage(value) {
    return (value * 100).toFixed(1) + '%';
  }

  // ══ INITIALIZE APP ══
  initApp();

  // Make functions globally available for inline onclick handlers
  window.navigateToPage = navigateToPage;
});
