// Global State & DOM Elements
let studies = JSON.parse(localStorage.getItem("studies")) || [];

const DOM = {
    studyForm: document.getElementById("studyForm"),
    studyList: document.getElementById("studyList"),
    themeToggle: document.getElementById("themeToggle"),
    exportMenuButton: document.getElementById("exportMenuButton"),
    exportMenu: document.getElementById("exportMenu"),
    editIndexInput: document.getElementById("editIndex"),
    notification: document.getElementById("notification"),
    statTotalSessions: document.getElementById("statTotalSessions"),
    statTotalTime: document.getElementById("statTotalTime"),
    statUniqueSubjects: document.getElementById("statUniqueSubjects"),
    statAvgDuration: document.getElementById("statAvgDuration"),
    chartStatus: document.getElementById("chartStatus"),
    lineChartContainer: document.getElementById("lineChartContainer"),
    dateInput: document.getElementById('date'),
    subjectInput: document.getElementById('subject'),
    durationInput: document.getElementById('duration'),
    noteInput: document.getElementById('note'),
    submitButton: document.getElementById('submitButton')
};

// --- UTILITY FUNCTIONS ---

/**
 * Displays a temporary feedback notification.
 * @param {string} message - The message to display.
 * @param {('success'|'error')} type - The type of notification.
 */
function showNotification(message, type = 'success') {
    DOM.notification.textContent = message;
    DOM.notification.classList.remove('bg-green-500', 'bg-red-500', 'hidden', 'translate-x-full');

    DOM.notification.classList.add(type === 'success' ? 'bg-green-500' : 'bg-red-500');
    DOM.notification.classList.add('translate-x-0');

    setTimeout(() => {
        DOM.notification.classList.remove('translate-x-0');
        DOM.notification.classList.add('translate-x-full');
        setTimeout(() => {
            DOM.notification.classList.add('hidden');
        }, 300);
    }, 3000);
}

// Saves the current studies array to localStorage
function saveData() {
    localStorage.setItem("studies", JSON.stringify(studies));
}

// Calculates and updates all dashboard statistics
function calculateStats() {
    const totalSessions = studies.length;
    let totalTime = 0;
    const subjects = new Set();

    studies.forEach(study => {
        totalTime += study.duration;
        subjects.add(study.subject);
    });

    const uniqueSubjects = subjects.size;
    const avgDuration = totalSessions > 0 ? (totalTime / totalSessions).toFixed(1) : 0; 

    DOM.statTotalSessions.textContent = totalSessions;
    DOM.statTotalTime.textContent = totalTime;
    DOM.statUniqueSubjects.textContent = uniqueSubjects;
    DOM.statAvgDuration.textContent = avgDuration;
    
    // Control chart visibility (Symmetry fix: hide line chart area if no data)
    if (totalSessions === 0) {
        DOM.chartStatus.style.display = 'block';
        DOM.lineChartContainer.style.display = 'none';
    } else {
        DOM.chartStatus.style.display = 'none';
        DOM.lineChartContainer.style.display = 'block';
    }
}

// --- DATA UTILITY ---

window.exportData = function(type) {
    if (studies.length === 0) {
        showNotification("No data to export!", 'error');
        return;
    }

    let dataStr, mimeType, filename;
    
    // Map data to a clean export format
    const dataToExport = studies.map(study => ({
        Date: study.date,
        Activity: study.subject,
        'Duration (min)': study.duration,
        Notes: study.note || ''
    }));

    if (type === 'json') {
        dataStr = JSON.stringify(dataToExport, null, 2);
        mimeType = 'application/json';
        filename = 'progress_data.json';
    } else if (type === 'csv') {
        const header = Object.keys(dataToExport[0]).join(',');
        const rows = dataToExport.map(row => 
            Object.values(row).map(value => 
                `"${String(value).replace(/"/g, '""')}"`
            ).join(',')
        ).join('\n');
        dataStr = header + '\n' + rows;
        mimeType = 'text/csv';
        filename = 'progress_data.csv';
    } else {
        return;
    }

    const dataUri = `data:${mimeType};charset=utf-8,${encodeURIComponent(dataStr)}`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    
    showNotification(`Data successfully exported as ${filename}`, 'success');
    DOM.exportMenu.classList.add('hidden');
};

window.importData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            let importedData = [];

            if (file.name.endsWith('.json')) {
                importedData = JSON.parse(content);
                if (!Array.isArray(importedData)) throw new Error("Invalid JSON data format.");
            } else if (file.name.endsWith('.csv')) {
                // CSV parsing logic (simplified)
                const lines = content.split('\n').filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error("CSV file is empty or header-only.");
                
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                for (let i = 1; i < lines.length; i++) {
                    const valuesMatch = lines[i].match(/(?:"[^"]*"|[^,])+/g); 
                    if (!valuesMatch || valuesMatch.length !== headers.length) continue; 
                    
                    const values = valuesMatch.map(v => v.trim().replace(/"/g, ''));
                    
                    const item = {};
                    headers.forEach((header, index) => {
                        item[header.toLowerCase().replace(/ \(.+\)/, '').replace(/ /g, '_')] = values[index];
                    });
                    
                    importedData.push({
                        date: item.date || new Date().toISOString().split('T')[0],
                        subject: item.activity || '',
                        duration: parseInt(item.duration) || 0,
                        note: item.notes || ''
                    });
                }
            } else {
                showNotification("Only supports JSON or CSV file import.", 'error');
                return;
            }
            
            const validData = importedData.filter(item => 
                item.subject && typeof item.subject === 'string' &&
                item.duration && typeof item.duration === 'number' && item.duration > 0
            );

            if (validData.length === 0) {
                 showNotification("No valid records found in the imported file.", 'error');
                 return;
            }
            
            studies = [...studies, ...validData];
            saveData();
            render();
            showNotification(`✅ Successfully imported ${validData.length} records.`, 'success');

        } catch (error) {
            showNotification(`❌ Error processing file: ${error.message}`, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; 
};

window.clearAllData = function() {
    if (studies.length === 0) {
        showNotification("No data to clear.", 'error');
        return;
    }
    if (confirm("ARE YOU SURE? This action will permanently delete ALL activity data!")) {
        studies = [];
        saveData();
        render();
        showNotification("All data successfully cleared.", 'success');
    }
}

// --- CRUD & RENDERING ---

/**
 * Renders the study list table, calculates stats, and updates charts.
 */
function render() {
    studies.sort((a, b) => new Date(b.date) - new Date(a.date));
    DOM.studyList.innerHTML = "";

    studies.forEach((study, index) => {
        const row = document.createElement("tr");
        row.className = "bg-card-light dark:bg-card-dark hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors";
        
        row.innerHTML = `
            <td data-label="Date" class="px-6 py-4 whitespace-nowrap text-sm font-medium">${study.date}</td>
            <td data-label="Activity" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">${study.subject}</td>
            <td data-label="Duration (min)" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">${study.duration}</td>
            <td data-label="Notes" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">${study.note || '-'}</td>
            <td data-label="Action" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button onclick="editStudy(${index})" class="text-primary hover:text-primary-light transition-colors"><i class="fas fa-edit"></i></button>
                <button onclick="deleteStudy(${index})" class="text-red-500 hover:text-red-700 transition-colors"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        DOM.studyList.appendChild(row);
    });

    calculateStats();
    // CRITICAL: Call chart rendering function
    if (typeof renderCharts === 'function') {
        renderCharts(studies); 
    }
}

window.editStudy = function(index) {
    const study = studies[index];
    DOM.dateInput.value = study.date;
    DOM.subjectInput.value = study.subject;
    DOM.durationInput.value = study.duration; 
    DOM.noteInput.value = study.note;
    DOM.editIndexInput.value = index;
    
    DOM.submitButton.innerHTML = '<i class="fas fa-edit"></i> Update Data';
    DOM.formCard.scrollIntoView({ behavior: 'smooth' });
    showNotification(`Ready to edit record: ${study.subject}`, 'success');
};

window.deleteStudy = function(index) {
    if (confirm("Are you sure you want to delete this record?")) {
        studies.splice(index, 1);
        saveData();
        render();
        showNotification("Record successfully deleted.", 'success');
    }
};

// --- EVENT LISTENERS ---

DOM.studyForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const date = DOM.dateInput.value;
    const subject = DOM.subjectInput.value.trim();
    const duration = parseInt(DOM.durationInput.value); 
    const note = DOM.noteInput.value.trim();
    const editIndex = DOM.editIndexInput.value;

    if (!subject || isNaN(duration) || duration <= 0 || !date) {
        showNotification("Please ensure all required fields are correctly filled (Duration must be > 0).", 'error');
        return;
    }

    const newRecord = { date, subject, duration, note };
    let message = "Data successfully saved!";

    if (editIndex) {
        studies[editIndex] = newRecord;
        DOM.editIndexInput.value = "";
        message = "Data successfully updated!";
    } else {
        studies.push(newRecord);
    }

    saveData();
    DOM.studyForm.reset();
    DOM.submitButton.innerHTML = '<i class="fas fa-save"></i> Save Data';
    render();
    showNotification(message, 'success');
});

DOM.themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    DOM.themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i> Light Mode' : '<i class="fas fa-moon"></i> Dark Mode';
    localStorage.setItem("theme", isDark ? "dark" : "light");
    // Re-render charts to apply theme colors
    if (typeof renderCharts === 'function') {
        renderCharts(studies);
    }
});

DOM.exportMenuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.exportMenu.classList.toggle('hidden');
});

// Close export menu when clicking outside
document.addEventListener('click', function(event) {
    if (!DOM.exportMenu.classList.contains('hidden') && 
        !DOM.exportMenu.contains(event.target) && 
        !DOM.exportMenuButton.contains(event.target)) {
        DOM.exportMenu.classList.add('hidden');
    }
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    // Apply theme on load
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
        DOM.themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        DOM.themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }
    // Set today's date if empty
    if (!DOM.dateInput.value) { 
        DOM.dateInput.valueAsDate = new Date();
    }
    
    render();
});