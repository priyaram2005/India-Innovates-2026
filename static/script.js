// =======================================
// CIVIC-AI — Enhanced Interactions
// =======================================

// ---- Global Chart Instances ----
let categoryChartInstance = null;
let priorityChartInstance = null;


// =======================================
// LOADING STATE MANAGEMENT
// =======================================
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
    document.getElementById('analyzeBtn').disabled = true;
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
    document.getElementById('analyzeBtn').disabled = false;
}


// =======================================
// INLINE FORM VALIDATION
// =======================================
function clearErrors() {
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });
}

function showFieldError(groupId) {
    document.getElementById(groupId).classList.add('error');
}

function validateForm() {
    clearErrors();
    let isValid = true;

    const complaintText = document.getElementById('complaint').value.trim();
    const daysPending = document.getElementById('days').value;

    if (!complaintText) {
        showFieldError('group-complaint');
        isValid = false;
    }

    if (daysPending === '' || daysPending === null) {
        showFieldError('group-days');
        isValid = false;
    }

    return isValid;
}


// =======================================
// ANIMATED NUMBER COUNTER
// =======================================
function animateNumber(elementId, targetValue, duration = 600) {
    const element = document.getElementById(elementId);
    const start = parseFloat(element.innerText) || 0;
    const end = parseFloat(targetValue);
    const startTime = performance.now();
    const isDecimal = String(targetValue).includes('.');

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * eased;

        element.innerText = isDecimal ? current.toFixed(2) : Math.round(current);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}


// =======================================
// SEVERITY BAR ANIMATION
// =======================================
function animateSeverityBar(score) {
    const bar = document.getElementById('severityBar');
    const percentage = Math.min((score / 10) * 100, 100);

    // Trigger re-flow for animation restart
    bar.style.width = '0%';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            bar.style.width = percentage + '%';
        });
    });
}


// =======================================
// PRIORITY BADGE RENDERING
// =======================================
function renderPriorityBadge(priority) {
    const el = document.getElementById('priority');
    const level = priority.toLowerCase();

    el.className = 'badge badge--' + level;
    el.innerHTML = '<span class="badge-dot"></span> ' + priority;
}


// =======================================
// STAGGERED CARD ENTRANCE
// =======================================
function triggerResultAnimations() {
    const cards = document.querySelectorAll('#result .metric-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(15px)';

        setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 80);
    });
}


// =======================================
// SMOOTH SCROLL TO ELEMENT
// =======================================
function scrollToElement(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    }
}


// =======================================
// PREDICT FUNCTION (Main API Call)
// =======================================
function predict() {
    if (!validateForm()) return;

    // Auto-hide export panel when starting new analysis
    const exportPanel = document.getElementById('exportPanel');
    if (exportPanel) exportPanel.classList.add('hidden');

    const complaintText = document.getElementById('complaint').value.trim();
    const locationType = document.getElementById('location_type').value;
    const daysPending = document.getElementById('days').value;

    showLoading();

    fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: complaintText,
            location_type: locationType,
            days_pending: parseInt(daysPending)
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();

        if (data.error) {
            showFieldError('group-complaint');
            return;
        }

        // Populate results
        document.getElementById('category').innerText = data.category;
        document.getElementById('department').innerText = data.department;

        // Priority badge
        renderPriorityBadge(data.priority);

        // Severity animation
        document.getElementById('severity').innerText = data.severity;
        animateSeverityBar(data.severity);

        // Show result section
        const resultSection = document.getElementById('result');
        resultSection.classList.remove('hidden');
        triggerResultAnimations();
        scrollToElement('result');

        // Refresh analytics
        loadStats();
    })
    .catch(error => {
        hideLoading();
        console.error('Prediction Error:', error);
        // Show a subtle error — not alert()
        const btn = document.getElementById('analyzeBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span>❌</span> Error — please try again';
        btn.style.background = 'var(--color-danger)';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
        }, 2500);
    });
}


// =======================================
// LOAD STATS FUNCTION
// =======================================
function loadStats() {
    fetch('/stats')
    .then(response => response.json())
    .then(data => {
        if (!data || Object.keys(data).length === 0) return;

        // Animated number counters
        animateNumber('total', data.total_complaints);
        animateNumber('avg_days', data.average_days_pending);
        animateNumber('avg_severity', data.average_severity);

        // Render charts
        renderCharts(data.category_distribution, data.priority_distribution);

        // Show stats section
        document.getElementById('stats_section').classList.remove('hidden');
    })
    .catch(error => {
        console.error('Stats Error:', error);
    });
}


// =======================================
// RENDER CHARTS (Premium Dark Theme)
// =======================================
function renderCharts(categoryData, priorityData) {

    // Destroy old charts
    if (categoryChartInstance) categoryChartInstance.destroy();
    if (priorityChartInstance) priorityChartInstance.destroy();

    // Shared dark theme defaults — WHITE text for visibility
    Chart.defaults.color = '#ffffff';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // ---- Shared custom tooltip config ----
    const tooltipConfig = {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(102, 126, 234, 0.3)',
        borderWidth: 1,
        cornerRadius: 10,
        padding: 12,
        titleFont: { size: 13, weight: '600', family: "'Inter', sans-serif" },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        displayColors: true,
        boxWidth: 10,
        boxHeight: 10,
        boxPadding: 4,
        usePointStyle: true,
    };

    // ---- Create gradient fills for doughnut ----
    const ctx1 = document.getElementById('categoryChart').getContext('2d');

    const doughnutGradients = [
        { start: '#667eea', end: '#764ba2' },   // Indigo → Purple
        { start: '#10b981', end: '#34d399' },   // Emerald → Light Green
        { start: '#f59e0b', end: '#fbbf24' },   // Amber → Yellow
        { start: '#f43f5e', end: '#fb7185' },   // Rose → Pink
        { start: '#38bdf8', end: '#7dd3fc' },   // Sky → Light Blue
        { start: '#a78bfa', end: '#c4b5fd' },   // Violet → Lavender
    ];

    const doughnutBgColors = doughnutGradients.map((g, i) => {
        const grad = ctx1.createLinearGradient(0, 0, 300, 300);
        grad.addColorStop(0, g.start);
        grad.addColorStop(1, g.end);
        return grad;
    });

    const doughnutHoverColors = doughnutGradients.map(g => g.end);
    const legendDotColors = doughnutGradients.map(g => g.start);

    // ---- Category Doughnut Chart ----
    categoryChartInstance = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: doughnutBgColors,
                hoverBackgroundColor: doughnutHoverColors,
                borderColor: 'rgba(15, 23, 42, 0.9)',
                borderWidth: 2,
                hoverOffset: 18,
                hoverBorderColor: '#ffffff',
                hoverBorderWidth: 2,
                spacing: 3,
            }]
        },
        options: {
            responsive: true,
            cutout: '65%',
            radius: '90%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000,
                easing: 'easeOutQuart',
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        pointStyleWidth: 12,
                        color: '#ffffff',
                        font: { family: "'Inter', sans-serif", size: 12, weight: '500' },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                                text: label,
                                fillStyle: legendDotColors[i] || '#667eea',
                                strokeStyle: legendDotColors[i] || '#667eea',
                                lineWidth: 0,
                                pointStyle: 'circle',
                                hidden: false,
                                index: i,
                            }));
                        }
                    }
                },
                tooltip: {
                    ...tooltipConfig,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.parsed;
                            const pct = ((value / total) * 100).toFixed(1);
                            return ` ${context.label}: ${value} (${pct}%)`;
                        }
                    }
                }
            },
        }
    });

    // ---- Create gradient fills for bars ----
    const ctx2 = document.getElementById('priorityChart').getContext('2d');

    const priorityGradientConfig = {
        'High':   { top: '#f43f5e', bottom: 'rgba(244, 63, 94, 0.15)' },
        'Medium': { top: '#f59e0b', bottom: 'rgba(245, 158, 11, 0.15)' },
        'Low':    { top: '#10b981', bottom: 'rgba(16, 185, 129, 0.15)' },
    };

    const labels = Object.keys(priorityData);

    const barGradients = labels.map(key => {
        const config = priorityGradientConfig[key] || { top: '#667eea', bottom: 'rgba(102,126,234,0.15)' };
        const grad = ctx2.createLinearGradient(0, 0, 0, 350);
        grad.addColorStop(0, config.top);
        grad.addColorStop(1, config.bottom);
        return grad;
    });

    const barBorderColors = labels.map(key => {
        const config = priorityGradientConfig[key];
        return config ? config.top : '#667eea';
    });

    const barHoverColors = labels.map(key => {
        const config = priorityGradientConfig[key];
        return config ? config.top + 'AA' : '#667eeaAA';
    });

    // ---- Priority Bar Chart ----
    priorityChartInstance = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Complaints',
                data: Object.values(priorityData),
                backgroundColor: barGradients,
                hoverBackgroundColor: barHoverColors,
                borderColor: barBorderColors,
                hoverBorderColor: '#ffffff',
                borderWidth: 2,
                borderRadius: 12,
                borderSkipped: false,
                barPercentage: 0.55,
                categoryPercentage: 0.7,
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart',
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: '#000000',
                        font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
                        padding: 8,
                    },
                    grid: {
                        color: 'rgba(73, 67, 67, 0.1)',
                        drawBorder: false,
                    },
                    border: { display: false },
                },
                x: {
                    ticks: {
                        color: 'black',
                        font: { family: "'Inter', sans-serif", size: 13, weight: '600' },
                        padding: 8,
                    },
                    grid: { display: false },
                    border: { display: false },
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    ...tooltipConfig,
                    callbacks: {
                        title: function(items) {
                            return `Priority: ${items[0].label}`;
                        },
                        label: function(context) {
                            return ` ${context.parsed.y} complaint${context.parsed.y !== 1 ? 's' : ''}`;
                        }
                    }
                }
            },
        }
    });
}


// =======================================
// KEYBOARD SHORTCUTS
// =======================================
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        predict();
    }
});


// =======================================
// AUTO LOAD STATS ON PAGE LOAD
// =======================================
window.onload = function () {
    loadStats();
};


// =======================================
// CSV EXPORT PANEL TOGGLE
// =======================================
function toggleExportPanel() {
    const panel = document.getElementById('exportPanel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        updateFilterOptions();
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}


// =======================================
// UPDATE FILTER CHECKBOXES DYNAMICALLY
// =======================================
function updateFilterOptions() {
    fetch('/export/options')
    .then(r => r.json())
    .then(data => {
        if (!data || data.total === 0) return;

        renderCheckboxGroup('filterCategory', data.categories, 'cat');
        renderCheckboxGroup('filterPriority', data.priorities, 'pri');
        renderCheckboxGroup('filterLocation', data.locations, 'loc');

        document.getElementById('exportInfo').innerText =
            `${data.total} complaint${data.total !== 1 ? 's' : ''} available for export`;
    })
    .catch(err => console.error('Filter options error:', err));
}

function renderCheckboxGroup(containerId, items, prefix) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach((item, i) => {
        const id = `${prefix}_${i}`;
        const label = document.createElement('label');
        label.className = 'filter-chip';
        label.innerHTML = `<input type="checkbox" id="${id}" value="${item}" checked>
                           <span class="chip-text">${item}</span>`;
        container.appendChild(label);
    });
}


// =======================================
// DOWNLOAD COMBINED CSV
// =======================================
function downloadCombinedCSV() {
    const filters = gatherFilters();
    const params = new URLSearchParams(filters).toString();
    window.location.href = `/export/combined?${params}`;
}


// =======================================
// DOWNLOAD SEPARATE CSVs (ZIP)
// =======================================
function downloadSeparateCSVs() {
    const filters = gatherFilters();
    const params = new URLSearchParams(filters).toString();
    window.location.href = `/export/separate?${params}`;
}


// =======================================
// GATHER FILTER VALUES
// =======================================
function gatherFilters() {
    const filters = {};

    const cats = getCheckedValues('filterCategory');
    if (cats.length) filters.categories = cats.join(',');

    const pris = getCheckedValues('filterPriority');
    if (pris.length) filters.priorities = pris.join(',');

    const locs = getCheckedValues('filterLocation');
    if (locs.length) filters.locations = locs.join(',');

    return filters;
}

function getCheckedValues(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}


// =======================================
// SELECT ALL / DESELECT ALL
// =======================================
function toggleAllFilters(select) {
    document.querySelectorAll('#exportPanel input[type="checkbox"]').forEach(cb => {
        cb.checked = select;
    });
}
