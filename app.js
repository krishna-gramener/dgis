// Global state
let llmConfig = {
    baseUrl: '',
    token: ''
};

let csvData = {};
let analysisResults = null;

// Dataset files
const DATASETS = [
    'facility_master.csv',
    'manav_sampda.csv',
    'equipment_registry.csv',
    'hmis_indicators.csv'
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

        // Step 3: Detect anomalies (AI Phase 1)
        await updateProgress(3, 'active');
        // const anomalies = await detectAnomalies();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate thinking
        await updateProgress(3, 'completed');

        // Step 4: Generate insights (AI Phase 2)
        await updateProgress(4, 'active');
        // const results = await generateInsights(anomalies);
        const results = await loadMockData(); // Load from data.json
        analysisResults = results;
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

// Load Mock Data from data.json
async function loadMockData() {
    try {
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Failed to load mock data');
        }
        
        const data = await response.json();
        console.log("Data loaded");
        return data;
    } catch (error) {
        console.error('Error loading mock data:', error);
        throw error;
    }
}

// LLM Communication - Phase 1: Detect Anomalies
async function detectAnomalies() {
    const systemPrompt = `You are analyzing district health system datasets from Uttar Pradesh.

Datasets available:
- Facility Master (facility IDs, block locations, facility types)
- Manav Sampda (staff postings, transfers, vacancies, designations)
- HMIS Indicators (OPD visits, deliveries, surgeries, diagnostics)
- Equipment Registry (machines installed, functional status, maintenance)

Your task is to detect unusual patterns or anomalies in the system.

Look for patterns such as:
- Sudden drops or spikes in service indicators
- Equipment that exists but shows low utilization
- Facilities with unusually high patient load
- Service indicators that changed sharply after staff transfers
- Infrastructure upgrades that did not improve services
- Facilities with staff but no services recorded
- Equipment marked functional but not being used
- Abnormal ratios (e.g., deliveries per staff, OPD per facility type)

Important rules:
• Do NOT interpret yet
• Only list anomalies and interesting patterns detected in the data
• Each anomaly must reference the dataset(s) where it was observed
• Be specific with facility names, numbers, and metrics

Return up to 12-15 interesting anomalies.`;

    const userPrompt = `Detect anomalies in the following district healthcare datasets.

Datasets provided:
${Object.keys(csvData).map(key => `- ${key}: ${csvData[key].length} records`).join('\n')}

Complete datasets:
${Object.entries(csvData).map(([key, data]) => {
    return `\n${key}:\n${JSON.stringify(data, null, 2)}`;
}).join('\n')}

Return ONLY valid JSON in the following format:

{
  "anomalies": [
    {
      "pattern": "Brief description of the anomaly observed",
      "sources": ["dataset1.csv", "dataset2.csv"],
      "specifics": "Specific numbers, facility names, or metrics"
    }
  ]
}

Example:
{
  "anomalies": [
    {
      "pattern": "Sharp drop in OPD visits at PHC Salempur in March 2024",
      "sources": ["hmis_indicators.csv"],
      "specifics": "OPD visits dropped from 450 to 120 between Feb and March 2024"
    }
  ]
}`;

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
        
        const anomalies = JSON.parse(jsonContent);
        console.log("Anomalies detected:", anomalies);
        return anomalies.anomalies || [];

    } catch (error) {
        console.error('Anomaly detection error:', error);
        throw error;
    }
}

// LLM Communication - Phase 2: Generate Insights from Anomalies
async function generateInsights(anomalies) {
    const systemPrompt = `You are a senior public health systems analyst advising the District Magistrate and Chief Medical Officer of a district in Uttar Pradesh.

You are analyzing operational data from the district health system using the following datasets:
1. Facility Master – facility type and block
2. Manav Sampda – staff postings, transfers, vacancies
3. HMIS Indicators – facility service indicators (OPD, deliveries, surgeries, diagnostics)
4. Equipment Registry – machines installed and functional status

Your objective is NOT to summarize metrics or describe dashboards.

Your task is to identify hidden operational risks in the district health system by connecting signals across multiple datasets.

---------------------------------------------------

CLINICAL REALISM RULES

Respect the real service capabilities of facility types.

PHC facilities:
• PHCs normally do NOT perform major surgeries or C-sections
• Do NOT generate insights about surgical underperformance at PHCs
• If surgeries are zero at PHCs, ignore it as expected behavior

CHC / FRU facilities:
• CHCs may perform surgeries and C-sections if specialists are available
• Surgical service decline at CHCs may indicate staff or infrastructure failure

District hospitals:
• Expect highest surgical and diagnostic load

If an insight violates realistic facility capability, discard it.

---------------------------------------------------

ANALYSIS PRINCIPLES

• Focus on causal chains across datasets
Example: staff transfer → decline in surgeries → idle equipment

• Ignore simple descriptive observations such as:
  - OPD high
  - deliveries low
  - equipment exists

• Only report insights that require connecting two or more datasets

• Prioritize systemic failures where infrastructure, equipment, or staffing is not translating into services

Look for patterns such as:
• Infrastructure upgrades failing due to missing specialists
• Equipment installed but not translating into services
• Diagnostic services collapsing despite functional machines
• Staff transfers affecting service delivery
• Patient load shifting between facilities
• Facilities approaching operational overload
• Service indicators dropping after HR changes

---------------------------------------------------

MERGING RULE

If multiple anomalies point to the same root cause, merge them into a single systemic insight.

Do NOT produce multiple insights that describe the same operational failure.

---------------------------------------------------

SYSTEM LEVEL RULE

Prefer district-level conclusions over isolated facility observations.

If several facilities show related patterns, summarize them into one district-level operational risk.

---------------------------------------------------

COMPLETENESS RULE

Only report insights where a plausible system mechanism can be explained.

If the root cause cannot be reasonably inferred from the available datasets, discard the observation.

---------------------------------------------------

PREDICTIVE ANALYSIS

In addition to current problems, detect emerging risks.

Use recent trends to identify facilities likely to face operational stress in the next 2–3 months.

Examples of predictive signals:
• Steadily rising OPD without staff increase
• Declining diagnostic services over multiple months
• Sudden service drops after staff transfers
• Equipment functional but utilization declining
• Patient load shifting from neighboring facilities

If a trend indicates a likely future failure or overload, report it as a predictive risk.

---------------------------------------------------

PRIORITIZATION RULE

After generating candidate insights, rank them by district-level impact on patient care and system functioning.

Only report the THREE highest-impact operational risks.

Lower-impact facility-level anomalies should be discarded.

---------------------------------------------------

OUTPUT REQUIREMENTS

Produce a concise intelligence briefing with exactly THREE insights.

At least ONE insight should be forward-looking (predictive).

For each insight provide:

Title:
Short, punchy headline suitable for senior officials

Evidence:
Key signals from the datasets supporting the finding

Explanation:
Underlying system mechanism connecting the datasets

Administrative Implication:
Why this issue matters for district health administration

Prediction (if applicable):
What is likely to happen if the trend continues

---------------------------------------------------

WRITING STYLE

Write clearly and concisely for senior district officials.

Avoid technical jargon and long paragraphs.

Each insight should read like a high-impact briefing point that can be quickly understood in a meeting.

---------------------------------------------------

IMPORTANT CONSTRAINTS

• If an insight can be explained using only one dataset, do NOT report it
• Focus on systemic failures, not descriptive statistics
• Merge related anomalies into single insights
• Prefer district-level over facility-level observations
• Only report insights with explainable system mechanisms`;

    const userPrompt = `Based on the following anomalies detected in the district health system, generate an operational intelligence briefing.

Anomalies detected:
${JSON.stringify(anomalies, null, 2)}

Generate:
1. Exactly THREE highest-impact operational insights (at least one should be predictive)
2. Department-wise action items (5-8 items) based on the top 3 insights
3. Professional email drafts (2-3 emails) to department heads requesting corrective action

Return ONLY valid JSON in the following format:

{
  "insights": [
    {
      "title": "Short punchy headline for senior officials",
      "summary": "One-line summary with key metric (max 80 characters)",
      "evidence": "Key signals from datasets supporting the finding",
      "explanation": "Underlying system mechanism connecting the datasets",
      "implication": "Why this matters for district health administration",
      "prediction": "What will happen if trend continues (optional, for predictive insights)",
      "type": "critical|warning|info|positive",
      "sources": ["dataset1.csv", "dataset2.csv"]
    }
  ],
  "actions": [
    {
      "issue": "Issue description",
      "department": "Responsible department",
      "related_insight": "Which of the 3 insights this relates to"
    }
  ],
  "emails": [
    {
      "department": "Department name",
      "subject": "Email subject",
      "body": "Professional government email requesting action"
    }
  ]
}

IMPORTANT:
- Exactly 3 insights only
- Merge related anomalies into single insights
- Prefer district-level over facility-level observations
- Each insight must connect 2+ datasets
- Write for senior officials (clear, concise, no jargon)

Severity classification:
- critical: Immediate governance risk requiring urgent action
- warning: Emerging concerns needing attention
- info: General observations for awareness
- positive: Good performance to acknowledge`;

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
        console.log("Insights generated:", results);
        return results;

    } catch (error) {
        console.error('Insight generation error:', error);
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

    insights.forEach((insight, index) => {
        // New structure: title, summary, evidence, explanation, implication, prediction
        const title = insight.title || '';
        const summary = insight.summary || insight.text || insight.insight || insight;
        const evidence = insight.evidence || '';
        const explanation = insight.explanation || '';
        const implication = insight.implication || '';
        const prediction = insight.prediction || '';
        const type = insight.type || 'info';
        const sources = insight.sources || [];
        
        // Build detailed view with structured sections
        let detailHTML = '';
        if (evidence) detailHTML += `<div class="detail-section"><strong>Evidence:</strong> ${evidence}</div>`;
        if (explanation) detailHTML += `<div class="detail-section"><strong>Explanation:</strong> ${explanation}</div>`;
        if (implication) detailHTML += `<div class="detail-section"><strong>Administrative Implication:</strong> ${implication}</div>`;
        if (prediction) detailHTML += `<div class="detail-section prediction"><strong>⚠️ Prediction:</strong> ${prediction}</div>`;
        
        // Fallback to old detail field if new structure not present
        if (!detailHTML && insight.detail) {
            detailHTML = `<div class="detail-section">${insight.detail}</div>`;
        }
        
        const card = document.createElement('div');
        card.className = `insight-card ${type}`;
        card.setAttribute('data-expanded', 'false');
        
        // Build sources HTML
        let sourcesHTML = '';
        if (sources && sources.length > 0) {
            sourcesHTML = `
                <div class="insight-sources">
                    <span class="sources-label">Sources:</span>
                    ${sources.map(source => `<span class="source-tag">${source.replace('.csv', '')}</span>`).join('')}
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="insight-header">
                <div class="insight-type">${type}</div>
                <div class="insight-expand-icon">▼</div>
            </div>
            ${title ? `<div class="insight-title">${title}</div>` : ''}
            <div class="insight-summary">${summary}</div>
            <div class="insight-detail hidden">${detailHTML}</div>
            ${sourcesHTML}
        `;
        
        // Add click handler to toggle expansion
        card.addEventListener('click', () => {
            const isExpanded = card.getAttribute('data-expanded') === 'true';
            const summaryEl = card.querySelector('.insight-summary');
            const detailEl = card.querySelector('.insight-detail');
            const expandIcon = card.querySelector('.insight-expand-icon');
            
            if (isExpanded) {
                // Collapse
                card.setAttribute('data-expanded', 'false');
                summaryEl.classList.remove('hidden');
                detailEl.classList.add('hidden');
                expandIcon.textContent = '▼';
            } else {
                // Expand
                card.setAttribute('data-expanded', 'true');
                summaryEl.classList.add('hidden');
                detailEl.classList.remove('hidden');
                expandIcon.textContent = '▲';
            }
        });
        
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
