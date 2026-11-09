// github issues aktualisieren
//
// modul durch ki ersetzen (neuer branch)
// -> direkt testen mit playwright

/**
 * Data class representing a single BMI tracking record.
 */
class BmiTracking {
    /**
     * @param {string|Date} date - The date when BMI was tracked
     * @param {number} bmi - The Body Mass Index value
     * @param {number} [weightKg] - Weight in kg (optional)
     * @param {number} [heightCm] - Height in cm (optional)
     */
    constructor(date, bmi, weightKg = null, heightCm = null) {
        this.date = typeof date === 'string' ? new Date(date) : date;
        this.bmi = Number(bmi);
        this.weightKg = weightKg !== null ? Number(weightKg) : null;
        this.heightCm = heightCm !== null ? Number(heightCm) : null;
    }

    get formattedDate() {
        if (isNaN(this.date.getTime())) {
            return 'Invalid Date';
        }
        return this.date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    get formattedBmi() {
        return this.bmi.toFixed(1);
    }

    get category() {
        if (this.bmi < 18.5) return 'Underweight';
        if (this.bmi < 25.0) return 'Normal';
        if (this.bmi < 30.0) return 'Overweight';
        return 'Obese';
    }

    get categoryCssClass() {
        if (this.bmi < 18.5) return 'badge-underweight';
        if (this.bmi < 25.0) return 'badge-normal';
        if (this.bmi < 30.0) return 'badge-overweight';
        return 'badge-obese';
    }
}

/**
 * Stub service providing mock tracking data for the dashboard.
 */
class BmiTrackingStubService {
    /**
     * Returns recent BMI tracking records.
     * @returns {BmiTracking[]}
     */
    static getRecentTrackings() {
        return [
            new BmiTracking('2026-10-10', 25.4, 81.5, 179),
            new BmiTracking('2026-10-14', 25.1, 80.4, 179),
            new BmiTracking('2026-10-18', 24.7, 79.2, 179),
            new BmiTracking('2026-10-22', 24.3, 77.9, 179),
            new BmiTracking('2026-10-26', 23.8, 76.3, 179)
        ];
    }
}

/**
 * Initializes and renders the dashboard with tracking data.
 */
function initDashboard() {
    const trackings = BmiTrackingStubService.getRecentTrackings();

    renderOverviewStats(trackings);
    renderTrackingsTable(trackings);
    renderChart(trackings);
}

/**
 * Renders high-level summary statistics.
 * @param {BmiTracking[]} trackings
 */
function renderOverviewStats(trackings) {
    if (!trackings || trackings.length === 0) return;

    const latest = trackings[trackings.length - 1];
    const previous = trackings.length > 1 ? trackings[trackings.length - 2] : null;

    const latestBmiEl = document.getElementById('latest-bmi');
    const latestCategoryEl = document.getElementById('latest-category');
    const latestDateEl = document.getElementById('latest-date');
    const trackingCountEl = document.getElementById('tracking-count');
    const bmiTrendEl = document.getElementById('bmi-trend');
    const bmiChangeEl = document.getElementById('bmi-change');

    if (latestBmiEl) latestBmiEl.textContent = latest.formattedBmi;
    if (latestCategoryEl) {
        latestCategoryEl.textContent = latest.category;
        latestCategoryEl.className = `badge ${latest.categoryCssClass}`;
    }
    if (latestDateEl) latestDateEl.textContent = latest.formattedDate;
    if (trackingCountEl) trackingCountEl.textContent = `${trackings.length} trackings recorded`;

    if (previous && bmiTrendEl && bmiChangeEl) {
        const diff = latest.bmi - previous.bmi;
        const sign = diff > 0 ? '+' : '';
        bmiTrendEl.textContent = diff < 0 ? 'Decreasing' : diff > 0 ? 'Increasing' : 'Stable';
        bmiChangeEl.textContent = `${sign}${diff.toFixed(1)} since last entry`;
    }
}

/**
 * Populates the table of recent trackings.
 * @param {BmiTracking[]} trackings
 */
function renderTrackingsTable(trackings) {
    const tbody = document.getElementById('recent-trackings-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Show newest first in table
    const sortedTrackings = [...trackings].reverse();

    sortedTrackings.forEach((entry) => {
        const row = document.createElement('tr');

        const dateCell = document.createElement('td');
        dateCell.textContent = entry.formattedDate;
        row.appendChild(dateCell);

        const bmiCell = document.createElement('td');
        const bmiStrong = document.createElement('strong');
        bmiStrong.textContent = entry.formattedBmi;
        bmiCell.appendChild(bmiStrong);
        row.appendChild(bmiCell);

        const categoryCell = document.createElement('td');
        const categoryBadge = document.createElement('span');
        categoryBadge.className = `badge ${entry.categoryCssClass}`;
        categoryBadge.textContent = entry.category;
        categoryCell.appendChild(categoryBadge);
        row.appendChild(categoryCell);

        const weightCell = document.createElement('td');
        weightCell.textContent = entry.weightKg !== null ? `${entry.weightKg} kg` : '–';
        row.appendChild(weightCell);

        tbody.appendChild(row);
    });
}

/**
 * Renders the BMI progression chart.
 * @param {BmiTracking[]} trackings
 */
function renderChart(trackings) {
    const canvas = document.getElementById('myChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const labels = trackings.map((t) => t.formattedDate);
    const bmiValues = trackings.map((t) => t.bmi);

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'BMI History',
                    data: bmiValues,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: Math.floor(Math.min(...bmiValues) - 2),
                    max: Math.ceil(Math.max(...bmiValues) + 2),
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'BMI'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Tracked Date'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ` BMI: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

// Export for module/test environments if supported
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BmiTracking, BmiTrackingStubService, initDashboard };
}