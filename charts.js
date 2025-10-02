let pieChartInstance = null;
let barChartInstance = null;
let lineChartInstance = null;

// PALET WARNA CERAH DAN VIBRANT untuk Pie/Bar Charts
const VIBRANT_COLORS = [
    '#FF6384', // Merah Muda Cerah
    '#36A2EB', // Biru Langit Cerah
    '#FFCD56', // Kuning Cerah
    '#4BC0C0', // Cyan/Aqua Cerah
    '#9966FF', // Ungu Terang
    '#FF9F40', // Oranye Cerah
    '#22C55E', // Hijau Neon
    '#F97316', 
    '#EC4899', 
    '#3B82F6'  
];
const COLOR_MAP = {};
let colorIndex = 0;

// Fungsi untuk membuat warna konsisten menggunakan palet cerah yang telah ditentukan
function getSubjectColor(subject) {
    if (!COLOR_MAP[subject]) {
        COLOR_MAP[subject] = VIBRANT_COLORS[colorIndex % VIBRANT_COLORS.length];
        colorIndex++;
    }
    return COLOR_MAP[subject];
}

// Helper untuk safely destroy old chart instances
function destroyChart(instance) {
    if (instance) {
        instance.destroy();
    }
}

/**
 * Renders all charts (Pie, Bar, Line) based on the provided study data.
 * Dipanggil dari app.js setiap kali data diperbarui.
 * @param {Array<Object>} studies - Array of study records.
 */
function renderCharts(studies) {
    
    // --- 1. Data Aggregation and Preparation ---
    if (!studies || studies.length === 0) {
        destroyChart(pieChartInstance);
        destroyChart(barChartInstance);
        destroyChart(lineChartInstance);
        return; 
    }

    // Agregasi Durasi per Subjek untuk Pie/Bar Charts
    const aggregatedBySubject = studies.reduce((acc, study) => {
        const subject = study.subject;
        acc[subject] = (acc[subject] || 0) + study.duration;
        return acc;
    }, {});

    const chartLabels = Object.keys(aggregatedBySubject);
    const chartData = Object.values(aggregatedBySubject);
    const chartColors = chartLabels.map(getSubjectColor);

    // Agregasi Durasi per Hari untuk Line Chart
    const aggregatedByDay = studies.reduce((acc, study) => {
        const date = study.date; 
        acc[date] = (acc[date] || 0) + study.duration;
        return acc;
    }, {});
    
    const lineChartDataPoints = Object.keys(aggregatedByDay).sort().map(date => ({
        x: date,
        y: aggregatedByDay[date]
    }));

    // Determine Theme Colors
    const isDark = document.body.classList.contains("dark");
    const gridColor = isDark ? '#374151' : '#E5E7EB';
    const textColor = isDark ? '#E5E7EB' : '#4B5563';
    const tooltipBg = isDark ? '#1E293B' : '#FFFFFF';
    const tooltipText = isDark ? '#E5E7EB' : '#1F2937';


    // =======================================================
    // 2. PIE CHART (Time Distribution by Activity)
    // =======================================================
    const ctxPie = document.getElementById('pieChart');
    destroyChart(pieChartInstance);

    pieChartInstance = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
                borderColor: isDark ? '#1E293B' : '#FFFFFF',
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: textColor }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1) + '%';
                            return `${label}: ${value} min (${percentage})`;
                        }
                    },
                    backgroundColor: tooltipBg,
                    titleColor: tooltipText,
                    bodyColor: tooltipText,
                }
            }
        }
    });


    // =======================================================
    // 3. BAR CHART (Total Duration Per Activity)
    // =======================================================
    const ctxBar = document.getElementById('barChart');
    destroyChart(barChartInstance);

    barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Duration (min)',
                data: chartData,
                // Menggunakan chartColors yang cerah dengan sedikit transparansi
                backgroundColor: chartColors.map(color => color + 'E0'), 
                borderColor: chartColors, 
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bars
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: textColor },
                    title: { display: true, text: 'Duration (min)', color: textColor }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: tooltipBg,
                    titleColor: tooltipText,
                    bodyColor: tooltipText,
                }
            }
        }
    });


    // =======================================================
    // 4. LINE CHART (Activity Duration Over Time)
    // =======================================================
    const ctxLine = document.getElementById('lineChart');
    destroyChart(lineChartInstance);
    
    if (lineChartDataPoints.length > 0) {
        lineChartInstance = new Chart(ctxLine, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Total Activity per Day (min)',
                    data: lineChartDataPoints,
                    borderColor: '#4F46E5', // Warna primer
                    backgroundColor: '#4F46E533', // Area di bawah garis
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: '#4F46E5',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            tooltipFormat: 'eee, MMM dd',
                            displayFormats: {
                                day: 'MMM dd' 
                            }
                        },
                        grid: { 
                            color: gridColor,
                            drawOnChartArea: true,
                            drawTicks: true
                        },
                        ticks: { 
                            color: textColor,
                            maxRotation: 45, 
                            minRotation: 45
                        },
                        title: { display: true, text: 'Date', color: textColor }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { 
                            color: gridColor,
                            lineWidth: 1, 
                            tickBorderDash: [5, 5] 
                        },
                        ticks: { 
                            color: textColor,
                            stepSize: 50, // Scaling yang bersih
                            callback: function(value) {
                                 return value + ' min';
                            }
                        },
                        title: { display: true, text: 'Duration (min)', color: textColor }
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        titleColor: tooltipText,
                        bodyColor: tooltipText,
                        callbacks: {
                            title: (context) => context[0].label,
                            label: (context) => ` ${context.dataset.label}: ${context.parsed.y} min`
                        }
                    }
                }
            }
        });
    }
}