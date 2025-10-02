let pieChartInstance = null;
let barChartInstance = null;
let lineChartInstance = null;

const VIBRANT_COLORS = [
    '#FF6384',
    '#36A2EB', 
    '#FFCD56', 
    '#4BC0C0', 
    '#9966FF', 
    '#FF9F40', 
    '#22C55E', 
    '#F97316', 
    '#EC4899', 
    '#3B82F6'  
];
const COLOR_MAP = {};
let colorIndex = 0;

function getSubjectColor(subject) {
    if (!COLOR_MAP[subject]) {
        COLOR_MAP[subject] = VIBRANT_COLORS[colorIndex % VIBRANT_COLORS.length];
        colorIndex++;
    }
    return COLOR_MAP[subject];
}

function destroyChart(instance) {
    if (instance) {
        instance.destroy();
    }
}

function renderCharts(studies) {
    
    if (!studies || studies.length === 0) {
        destroyChart(pieChartInstance);
        destroyChart(barChartInstance);
        destroyChart(lineChartInstance);
        return; 
    }

    const aggregatedBySubject = studies.reduce((acc, study) => {
        const subject = study.subject;
        acc[subject] = (acc[subject] || 0) + study.duration;
        return acc;
    }, {});

    const chartLabels = Object.keys(aggregatedBySubject);
    const chartData = Object.values(aggregatedBySubject);
    const chartColors = chartLabels.map(getSubjectColor);

    const aggregatedByDay = studies.reduce((acc, study) => {
        const date = study.date; 
        acc[date] = (acc[date] || 0) + study.duration;
        return acc;
    }, {});
    
    const lineChartDataPoints = Object.keys(aggregatedByDay).sort().map(date => ({
        x: date,
        y: aggregatedByDay[date]
    }));

    const isDark = document.body.classList.contains("dark");
    const gridColor = isDark ? '#374151' : '#E5E7EB';
    const textColor = isDark ? '#E5E7EB' : '#4B5563';
    const tooltipBg = isDark ? '#1E293B' : '#FFFFFF';
    const tooltipText = isDark ? '#E5E7EB' : '#1F2937';


    // PIE CHART
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


    // BAR CHART
    const ctxBar = document.getElementById('barChart');
    destroyChart(barChartInstance);

    barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Duration (min)',
                data: chartData,
                backgroundColor: chartColors.map(color => color + 'E0'), 
                borderColor: chartColors, 
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
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


    // LINE CHART
    const ctxLine = document.getElementById('lineChart');
    destroyChart(lineChartInstance);
    
    if (lineChartDataPoints.length > 0) {
        lineChartInstance = new Chart(ctxLine, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Total Activity per Day (min)',
                    data: lineChartDataPoints,
                    borderColor: '#4F46E5',
                    backgroundColor: '#4F46E533',
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
                            stepSize: 50,
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
