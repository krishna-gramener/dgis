// Global state
let llmConfig = {
    baseUrl: '',
    token: ''
};

let csvData = {};
let analysisResults = null;

// Dataset files
const DATASETS = [
    'disease_surveillance.csv',
    'equipment_usage.csv',
    'pmjay_claims.csv',
    'maternal_care.csv',
    'hims_opd.csv',
    'manav_sampda_staffing.csv',
    'hospital_infrastructure.csv'
];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    checkConfiguration();
    setupEventListeners();
});

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = theme === 'light' ? '🌙' : '🌞';
}

// Configuration Management
function checkConfiguration() {
    const baseUrl = localStorage.getItem('llm_base_url');
    const token = localStorage.getItem('llm_token');

    if (!baseUrl || !token) {
        showSettingsModal();
    } else {
        llmConfig.baseUrl = baseUrl;
        llmConfig.token = token;
    }
}

function showSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.classList.add('active');

    // Pre-fill if exists
    const baseUrl = localStorage.getItem('llm_base_url');
    const token = localStorage.getItem('llm_token');
    
    if (baseUrl) document.getElementById('baseUrl').value = baseUrl;
    if (token) document.getElementById('apiToken').value = token;
}

function hideSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.classList.remove('active');
}

function saveConfiguration(baseUrl, token) {
    localStorage.setItem('llm_base_url', baseUrl);
    localStorage.setItem('llm_token', token);
    llmConfig.baseUrl = baseUrl;
    llmConfig.token = token;
    hideSettingsModal();
}

// Event Listeners
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Settings form
    document.getElementById('settingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const baseUrl = document.getElementById('baseUrl').value.trim();
        const token = document.getElementById('apiToken').value.trim();
        saveConfiguration(baseUrl, token);
    });

    // Start exploring button
    document.getElementById('startExploring').addEventListener('click', startAnalysis);

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');
            
            if (target === '#settings') {
                showSettingsModal();
            } else {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                document.querySelector(target).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

// Analysis Flow
async function startAnalysis() {
    if (!llmConfig.baseUrl || !llmConfig.token) {
        alert('Please configure your API credentials first');
        showSettingsModal();
        return;
    }

    // Reset all progress steps
    document.querySelectorAll('.progress-step-h').forEach(step => {
        step.classList.remove('active', 'completed');
    });

    // Show progress section (like moving to new page)
    document.getElementById('home').style.display = 'none';
    document.getElementById('progress').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');

    try {
        // Step 1: Load datasets
        await updateProgress(1, 'active');
        await loadDatasets();
        await updateProgress(1, 'completed');

        // Step 2: Process data
        await updateProgress(2, 'active');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await updateProgress(2, 'completed');

        // Step 3: Send to AI
        await updateProgress(3, 'active');
        const results = await sendToLLM();
        await updateProgress(3, 'completed');

        // Step 4: Generate insights
        await updateProgress(4, 'active');
        analysisResults = results;
        await new Promise(resolve => setTimeout(resolve, 1000));
        await updateProgress(4, 'completed');

        // Step 5: Prepare results
        await updateProgress(5, 'active');
        displayResults(results);
        await updateProgress(5, 'completed');

        // Show results
        await new Promise(resolve => setTimeout(resolve, 500));
        document.getElementById('progress').style.display = 'none';
        document.getElementById('results').classList.remove('hidden');
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Analysis error:', error);
        alert(`Error during analysis: ${error.message}`);
        document.getElementById('progress').classList.add('hidden');
        document.getElementById('home').style.display = 'block';
    }
}

async function updateProgress(step, status) {
    const stepElement = document.querySelector(`.progress-step-h[data-step="${step}"]`);
    
    if (!stepElement) return;

    // Remove previous states
    stepElement.classList.remove('active', 'completed');

    if (status === 'active') {
        stepElement.classList.add('active');
    } else if (status === 'completed') {
        stepElement.classList.add('completed');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
}

// CSV Loading
async function loadDatasets() {
    const promises = DATASETS.map(filename => loadCSV(filename));
    await Promise.all(promises);
}

async function loadCSV(filename) {
    try {
        const response = await fetch(`csv_files/${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${filename}`);
        }
        const csvText = await response.text();
        
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    csvData[filename] = results.data;
                    resolve();
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        throw error;
    }
}

// LLM Communication
async function sendToLLM() {
    const systemPrompt = `You are a district governance intelligence AI analyzing healthcare datasets.
Generate governance insights, department actions, and official emails.
Be specific, actionable, and professional. Make sure the mails are well detailed and professional`;

    const userPrompt = `Analyze these district healthcare datasets and produce:

1. Key governance insights (10-12 insights)
2. Department-wise action items (10-15 items)
3. Official email drafts for departments

Datasets provided:
${Object.keys(csvData).map(key => `- ${key}: ${csvData[key].length} records`).join('\n')}

Sample data from each dataset:
${Object.entries(csvData).map(([key, data]) => {
    const sample = data.slice(0, 5);
    return `\n${key}:\n${JSON.stringify(data, null, 2)}`;
}).join('\n')}

Return ONLY valid JSON in this exact format:
{
  "insights": [
    {
      "text": "Insight description",
      "type": "critical|warning|info|positive"
    }
  ],
  "actions": [
    {
      "issue": "Issue description",
      "department": "Department name"
    }
  ],
  "emails": [
    {
      "department": "Department name",
      "subject": "Email subject",
      "body": "Email body text"
    }
  ]
}

IMPORTANT: For each insight, specify the type:
- "critical": Urgent issues requiring immediate action (shortages, spikes, emergencies)
- "warning": Concerns that need attention (rising trends, vacancies, pressure)
- "info": General observations and statistics
- "positive": Good performance and achievements`;

    try {
        const response = await fetch(`${llmConfig.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${llmConfig.token}:dgis`
            },
            body: JSON.stringify({
                model: 'gpt-4.1-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Extract JSON from response (handle markdown code blocks)
        let jsonContent = content;
        if (content.includes('```json')) {
            jsonContent = content.split('```json')[1].split('```')[0].trim();
        } else if (content.includes('```')) {
            jsonContent = content.split('```')[1].split('```')[0].trim();
        }
        
        const results = JSON.parse(jsonContent);
        return results;

    } catch (error) {
        console.error('LLM API error:', error);
        throw error;
    }
}

// Display Results
function displayResults(results) {
    displayInsights(results.insights);
    displayActions(results.actions);
    displayEmails(results.emails);
}

function displayInsights(insights) {
    const container = document.getElementById('insightsContainer');
    container.innerHTML = '';

    insights.forEach(insight => {
        // Insight should be an object with text and type from LLM
        const text = insight.text || insight.insight || insight;
        const type = insight.type || 'info';
        
        const card = document.createElement('div');
        card.className = `insight-card ${type}`;
        
        card.innerHTML = `
            <div class="insight-type">${type}</div>
            <div class="insight-text">${text}</div>
        `;
        
        container.appendChild(card);
    });
}

function displayActions(actions) {
    const tbody = document.getElementById('actionsTableBody');
    tbody.innerHTML = '';

    actions.forEach(action => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${action.issue}</td>
            <td><strong>${action.department}</strong></td>
        `;
        tbody.appendChild(row);
    });
}

function displayEmails(emails) {
    const container = document.getElementById('emailsContainer');
    container.innerHTML = '';

    emails.forEach((email, index) => {
        const card = document.createElement('div');
        card.className = 'email-card';
        card.innerHTML = `
            <div class="email-header">
                <div>
                    <div class="email-dept">📧 ${email.department}</div>
                    <div class="email-subject">${email.subject}</div>
                </div>
                <div class="email-toggle">▼</div>
            </div>
            <div class="email-body">
                <div class="email-content">${email.body}</div>
                <button class="copy-btn" onclick="copyEmail(${index})">📋 Copy Email</button>
            </div>
        `;

        // Toggle expansion
        card.querySelector('.email-header').addEventListener('click', () => {
            card.classList.toggle('expanded');
        });

        container.appendChild(card);
    });
}

// Copy email to clipboard
function copyEmail(index) {
    const email = analysisResults.emails[index];
    const text = `Subject: ${email.subject}\n\n${email.body}`;
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelectorAll('.copy-btn')[index];
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}

// Dataset Viewer
async function viewDataset(filename, title) {
    const modal = document.getElementById('datasetModal');
    const modalTitle = document.getElementById('datasetModalTitle');
    const modalBody = document.getElementById('datasetModalBody');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = '<p>Loading dataset...</p>';
    modal.classList.add('active');
    
    try {
        // Check if already loaded
        if (!csvData[filename]) {
            const response = await fetch(`csv_files/${filename}`);
            if (!response.ok) throw new Error('Failed to load dataset');
            const csvText = await response.text();
            
            await new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        csvData[filename] = results.data;
                        resolve();
                    },
                    error: reject
                });
            });
        }
        
        const data = csvData[filename];
        
        if (!data || data.length === 0) {
            modalBody.innerHTML = '<p>No data available</p>';
            return;
        }
        
        // Create table
        const headers = Object.keys(data[0]);
        const displayData = data.slice(0, 100); // Show first 100 rows
        
        let tableHTML = '<table><thead><tr>';
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';
        
        displayData.forEach(row => {
            tableHTML += '<tr>';
            headers.forEach(header => {
                tableHTML += `<td>${row[header] || ''}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += '</tbody></table>';
        
        if (data.length > 100) {
            tableHTML += `<p style="margin-top: 1rem; color: var(--text-secondary); text-align: center;">Showing first 100 of ${data.length} rows</p>`;
        }
        
        modalBody.innerHTML = tableHTML;
        
    } catch (error) {
        console.error('Error loading dataset:', error);
        modalBody.innerHTML = `<p style="color: var(--critical-color);">Error loading dataset: ${error.message}</p>`;
    }
}

function closeDatasetModal() {
    const modal = document.getElementById('datasetModal');
    modal.classList.remove('active');
}
