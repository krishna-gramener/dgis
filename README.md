# District Governance Intelligence System (DGIS)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

An AI-powered governance intelligence platform that analyzes district healthcare datasets and generates actionable insights for administrators.

## 🌟 Features

- **AI-Powered Analysis**: Leverages LLM technology to analyze multiple healthcare datasets
- **Color-Coded Insights**: Visual categorization of insights (Critical, Warning, Info, Positive)
- **Department Action Items**: Automatically generates department-wise action plans
- **Email Draft Generation**: Creates professional email drafts for district officials
- **Dataset Viewer**: Interactive popup viewer for exploring CSV datasets
- **Dark Mode**: Modern dark theme by default with light mode toggle
- **Progress Tracking**: Visual horizontal progress bar with tooltips
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 📋 Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x (for local development server)
- LLM API access (OpenAI-compatible endpoint)

## 🚀 Quick Start

### 1. Clone or Download

```bash
git clone <repository-url>
cd dgis
```

### 2. Add Your Datasets

Place your CSV files in the `csv_files/` directory:
- `disease_surveillance.csv`
- `equipment_usage.csv`
- `pmjay_claims.csv`
- `maternal_care.csv`
- `hims_opd.csv`
- `manav_sampda_staffing.csv`
- `hospital_infrastructure.csv`

### 3. Start Local Server

```bash
python3 -m http.server 8000
```

### 4. Open in Browser

Navigate to `http://localhost:8000` in your web browser.

### 5. Configure API

On first launch, you'll be prompted to enter:
- **Base URL**: Your LLM API endpoint (e.g., `https://api.openai.com/v1`)
- **API Token**: Your API authentication token

## 🛠️ Developer Guide

### Project Structure

```
dgis/
├── index.html          # Main HTML structure
├── style.css           # Styling and themes
├── app.js              # Application logic
├── csv_files/          # Dataset directory
│   ├── disease_surveillance.csv
│   ├── equipment_usage.csv
│   └── ...
├── README.md           # Documentation
└── LICENSE             # MIT License
```

### Key Components

#### 1. Theme System
```javascript
// Default theme is dark mode
const savedTheme = localStorage.getItem('theme') || 'dark';
```

#### 2. CSV Loading
```javascript
// Uses PapaParse library for CSV parsing
Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
        csvData[filename] = results.data;
    }
});
```

#### 3. LLM Integration
```javascript
// Sends data to LLM API for analysis
const response = await fetch(`${llmConfig.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmConfig.token}:dgis`
    },
    body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [...]
    })
});
```

#### 4. Insight Type Detection
```javascript
// Auto-detects insight severity based on keywords
function detectInsightType(text) {
    // Returns: 'critical', 'warning', 'info', or 'positive'
}
```

### CSS Variables

The application uses CSS custom properties for theming:

```css
:root {
    --primary-color: #3b82f6;
    --critical-color: #dc2626;
    --warning-color: #f59e0b;
    --info-color: #3b82f6;
    --positive-color: #10b981;
}
```

### Customization

#### Adding New Datasets

1. Add CSV file to `csv_files/` directory
2. Update `DATASETS` array in `app.js`:
```javascript
const DATASETS = [
    'your_new_dataset.csv',
    // ... existing datasets
];
```
3. Add dataset card in `index.html` datasets section

#### Modifying LLM Prompt

Edit the `sendToLLM()` function in `app.js`:
```javascript
const userPrompt = `Your custom prompt here...`;
```

#### Changing Color Scheme

Modify CSS variables in `style.css`:
```css
:root {
    --primary-color: #your-color;
}
```

### API Response Format

The LLM must return JSON in this format:

```json
{
  "insights": [
    {
      "text": "Insight description",
      "type": "critical"
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
```

**Insight Types:**
- `critical`: Urgent issues requiring immediate action
- `warning`: Concerns that need attention
- `info`: General observations and statistics
- `positive`: Good performance and achievements

## 🔧 Configuration

### Local Storage Keys

- `llm_base_url`: LLM API endpoint
- `llm_token`: API authentication token
- `theme`: Current theme ('light' or 'dark')

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📊 Dataset Format

CSV files should have headers in the first row. Example:

```csv
date,location,disease,cases
2024-01-01,Salempur,Dengue,15
2024-01-02,Salempur,Dengue,23
```

## 🐛 Troubleshooting

### API Errors
- Verify your API token is correct
- Check that the base URL includes `/v1` if required
- Ensure your API supports the model specified

### Dataset Not Loading
- Verify CSV files are in `csv_files/` directory
- Check browser console for errors
- Ensure CSV files have proper headers

### Progress Bar Not Updating
- Check browser console for JavaScript errors
- Verify all step elements exist in HTML

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Krishna Kumar**  
© 2026

## ⚠️ Disclaimer

**This is a demonstration application only.**

- This application contains **NO client data or confidential information**
- All datasets used are for **demonstration purposes only**
- Any resemblance to real data is purely coincidental
- Not intended for production use without proper security review
- Users are responsible for ensuring compliance with data privacy regulations

## 🙏 Acknowledgments

- PapaParse for CSV parsing
- OpenAI for LLM technology
- Modern CSS techniques for responsive design

---

**Note**: This is a proof-of-concept application demonstrating AI-powered governance intelligence. Always ensure proper data security and privacy measures when handling real healthcare data.
