// src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { computeBMI, categoryFromBMI, healthyWeightRangeKg } from "./bmi";
import { parseBody, parseQuery } from "./validation";

const app = new Hono();

// Public CORS (you can restrict origins later)
app.use("*", cors());

// Health
app.get("/health", (c) => c.json({ status: "ok" }));

// GET /v1/bmi?weight_kg&height_cm OR weight_lb&height_in
app.get("/v1/bmi", (c) => {
  try {
    // Convert Hono's query object to URLSearchParams
    const queryParams = new URLSearchParams();
    const query = c.req.query();
    for (const [key, value] of Object.entries(query)) {
      queryParams.set(key, value as string);
    }
    
    const { weightKg, heightM, inputsEcho } = parseQuery(queryParams);
    const bmi = computeBMI(weightKg, heightM);
    const category = categoryFromBMI(bmi);
    const range = healthyWeightRangeKg(heightM);
    return c.json({
      bmi,
      category,
      inputs: inputsEcho,
      healthy_weight_range_kg: range,
      notes: ["Adult BMI categories per WHO"],
    });
  } catch (e: any) {
    const status = e?.status === 400 ? 400 : 500;
    return c.json({ error: e?.message || "Internal error" }, status);
  }
});

// POST /v1/bmi { weight, height, units }
app.post("/v1/bmi", async (c) => {
  try {
    const { weightKg, heightM, inputsEcho } = await parseBody(c.req as any);
    const bmi = computeBMI(weightKg, heightM);
    const category = categoryFromBMI(bmi);
    const range = healthyWeightRangeKg(heightM);
    return c.json({
      bmi,
      category,
      inputs: inputsEcho,
      healthy_weight_range_kg: range,
      notes: ["Adult BMI categories per WHO"],
    });
  } catch (e: any) {
    const status = e?.status === 400 ? 400 : 500;
    return c.json({ error: e?.message || "Internal error" }, status);
  }
});

// Complete single-page UI for BMI API
const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BMI Calculator API - Free Public API</title>
  <meta name="description" content="Free public BMI Calculator API with WHO categories, CORS enabled">
  <style>
    :root {
      --primary: #8b5cf6;
      --primary-dark: #7c3aed;
      --accent: #14b8a6;
      --success: #10b981;
      --danger: #ef4444;
      --bg: #ffffff;
      --bg-secondary: #faf5ff;
      --bg-tertiary: #f3e8ff;
      --text: #1f2937;
      --text-secondary: #6b7280;
      --border: #e9d5ff;
      --code-bg: #1e1b4b;
      --code-text: #f9fafb;
      --radius: 0.75rem;
      --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --primary: #a78bfa;
        --primary-dark: #8b5cf6;
        --accent: #2dd4bf;
        --bg: #0f0f23;
        --bg-secondary: #1a1a2e;
        --bg-tertiary: #252542;
        --text: #f9fafb;
        --text-secondary: #a1a1aa;
        --border: #4c1d95;
        --code-bg: #1a1a2e;
        --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      color: var(--text);
      background: var(--bg);
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
    .hero {
      background: var(--gradient);
      color: white;
      padding: 4rem 0;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.1);
      z-index: 1;
    }
    .hero > * { position: relative; z-index: 2; }
    .hero h1 { font-size: clamp(1.75rem, 5vw, 3rem); margin-bottom: 1rem; }
    .hero p { font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.95; }
    .btn {
      display: inline-block;
      padding: 1rem 2.5rem;
      background: #10b981;
      color: white;
      text-decoration: none;
      border-radius: var(--radius);
      font-weight: 600;
      border: none;
      cursor: pointer;
      font-size: 1.125rem;
      transition: all 0.3s;
      box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
    }
    .btn:hover { 
      transform: translateY(-2px); 
      background: #059669;
      box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
    }
    .btn-secondary { 
      background: #10b981;
      color: white;
    }
    .btn-secondary:hover {
      transform: translateY(-2px);
      background: #059669;
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
    }
    section { padding: 3rem 0; border-bottom: 1px solid var(--border); }
    h2 { font-size: 2rem; margin-bottom: 1.5rem; }
    h3 { font-size: 1.25rem; margin: 1.5rem 0 1rem; }
    .code-block {
      background: var(--code-bg);
      color: var(--code-text);
      padding: 1rem;
      border-radius: var(--radius);
      margin: 1rem 0;
      position: relative;
      overflow-x: auto;
    }
    .code-block pre { margin: 0; font-family: monospace; font-size: 0.875rem; }
    .copy-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #10b981;
      color: white;
      border: none;
      padding: 0.375rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .copy-btn:hover { 
      background: #059669;
      transform: scale(1.05);
    }
    .copy-btn.copied { background: #059669; }
    .calculator {
      background: var(--bg-secondary);
      padding: 2rem;
      border-radius: var(--radius);
      max-width: 600px;
      margin: 0 auto;
      box-shadow: 0 10px 25px rgba(139, 92, 246, 0.08);
    }
    .unit-toggle {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      justify-content: center;
    }
    .unit-toggle label {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: var(--radius);
      background: var(--bg);
      border: 2px solid transparent;
    }
    .unit-toggle input[type="radio"] { margin-right: 0.5rem; }
    .unit-toggle label:has(input:checked) {
      border-color: var(--primary);
      background: var(--bg-tertiary);
      font-weight: 600;
      color: var(--primary);
    }
    .input-group { margin-bottom: 1.5rem; }
    .input-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .input-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 1rem;
      background: var(--bg);
      color: var(--text);
    }
    .input-group input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
    }
    .input-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 640px) {
      .input-row { grid-template-columns: 1fr; }
    }
    .result {
      margin-top: 2rem;
      padding: 1.5rem;
      background: var(--bg);
      border-radius: var(--radius);
      border-left: 4px solid var(--primary);
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .result.error { border-left-color: var(--danger); color: var(--danger); }
    .result-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
    }
    .result-label { color: var(--text-secondary); }
    .result-value { font-weight: 600; }
    .collapsible { margin-top: 1rem; }
    .collapsible-toggle {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      padding: 0.5rem 1rem;
      border-radius: var(--radius);
      cursor: pointer;
      width: 100%;
      text-align: left;
      font-size: 0.875rem;
      color: var(--text);
    }
    .collapsible-content {
      margin-top: 0.5rem;
      padding: 1rem;
      background: var(--code-bg);
      color: var(--code-text);
      border-radius: var(--radius);
      font-family: monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
      display: none;
    }
    .collapsible-content.show { display: block; }
    .endpoint {
      background: var(--bg-secondary);
      padding: 1.5rem;
      border-radius: var(--radius);
      margin-bottom: 1.5rem;
      border: 1px solid var(--border);
      transition: transform 0.2s;
    }
    .endpoint:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
    }
    .method {
      background: var(--accent);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 0.25rem;
      font-weight: 600;
      font-size: 0.875rem;
      display: inline-block;
      margin-right: 0.5rem;
    }
    .method.post { background: var(--primary); }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }
    .info-card {
      background: var(--bg-secondary);
      padding: 1rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
    }
    .info-card h4 {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }
    .info-card p { font-size: 1.125rem; font-weight: 600; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    th, td {
      text-align: left;
      padding: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    th { background: var(--bg-tertiary); font-weight: 600; }
    code {
      background: var(--bg-tertiary);
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      color: var(--primary);
      font-weight: 500;
    }
    .disclaimer {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      padding: 1rem;
      border-radius: var(--radius);
      margin: 1.5rem 0;
      color: #92400e;
    }
    @media (prefers-color-scheme: dark) {
      .disclaimer { background: #451a03; border-color: #92400e; color: #fbbf24; }
    }
    footer {
      background: var(--bg-secondary);
      padding: 2rem 0;
      margin-top: 3rem;
      text-align: center;
    }
    .footer-links {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 1rem;
    }
    .footer-links a { color: var(--text-secondary); text-decoration: none; }
    .footer-links a:hover { color: var(--primary); text-decoration: none; }
    .hidden { display: none; }
    .text-muted { color: var(--text-secondary); font-size: 0.875rem; }
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--primary);
      color: white;
      padding: 0.5rem 1rem;
      text-decoration: none;
      z-index: 100;
    }
    .skip-link:focus { top: 0; }
  </style>
</head>
<body>
  <a href="#main" class="skip-link">Skip to main content</a>
  
  <header class="hero">
    <div class="container">
      <h1>Public BMI API — calculate BMI and get WHO category</h1>
      <p>Free, open, CORS-enabled API for Body Mass Index calculations</p>
      <a href="#calculator" class="btn">Try it now</a>
    </div>
  </header>

  <main id="main">
    <section id="quickstart">
      <div class="container">
        <h2>Quick Start</h2>
        <p class="text-muted">Base URL: <code id="baseUrl">${typeof window !== 'undefined' ? window.location.origin : ''}</code> • Version: <code>/v1</code></p>
        
        <h3>GET Request (Metric)</h3>
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)">Copy</button>
          <pre>curl "${typeof window !== 'undefined' ? window.location.origin : ''}/v1/bmi?weight_kg=70&height_cm=175"</pre>
        </div>

        <h3>POST Request (JavaScript)</h3>
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)">Copy</button>
          <pre>fetch('/v1/bmi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    units: 'metric',
    weight: 70,
    height: 175
  })
})
.then(res => res.json())
.then(data => console.log(data));</pre>
        </div>
      </div>
    </section>

    <section id="calculator">
      <div class="container">
        <h2>Interactive Calculator</h2>
        <div class="calculator">
          <form id="bmiForm" onsubmit="calculateBMI(event)">
            <div class="unit-toggle">
              <label>
                <input type="radio" name="units" value="metric" checked onchange="updateUnits()">
                Metric (kg, cm)
              </label>
              <label>
                <input type="radio" name="units" value="imperial" onchange="updateUnits()">
                Imperial (lb, in)
              </label>
            </div>

            <div class="input-row">
              <div class="input-group">
                <label for="weight">Weight <span id="weightUnit">(kg)</span></label>
                <input type="number" id="weight" step="0.1" required min="20" max="300">
              </div>
              <div class="input-group">
                <label for="height">Height <span id="heightUnit">(cm)</span></label>
                <input type="number" id="height" step="0.1" required min="100" max="250">
              </div>
            </div>

            <button type="submit" class="btn btn-secondary" style="width: 100%">
              Calculate BMI
            </button>
          </form>

          <div id="result" class="result hidden">
            <h3>Results</h3>
            <div class="result-item">
              <span class="result-label">BMI</span>
              <span class="result-value" id="bmiValue">-</span>
            </div>
            <div class="result-item">
              <span class="result-label">Category</span>
              <span class="result-value" id="categoryValue">-</span>
            </div>
            <div class="result-item">
              <span class="result-label">Healthy Weight Range</span>
              <span class="result-value" id="rangeValue">-</span>
            </div>
            <div class="collapsible">
              <button class="collapsible-toggle" onclick="toggleCollapsible(this)">
                Developer View (JSON)
              </button>
              <div class="collapsible-content" id="jsonResponse"></div>
            </div>
          </div>

          <div id="error" class="result error hidden"></div>
        </div>
      </div>
    </section>

    <section id="api-reference">
      <div class="container">
        <h2>API Reference</h2>
        
        <div class="info-grid">
          <div class="info-card">
            <h4>Authentication</h4>
            <p>No</p>
          </div>
          <div class="info-card">
            <h4>HTTPS</h4>
            <p>Yes</p>
          </div>
          <div class="info-card">
            <h4>CORS</h4>
            <p>Yes</p>
          </div>
          <div class="info-card">
            <h4>Health Check</h4>
            <p><a href="/health">/health</a></p>
          </div>
        </div>

        <h3>Endpoints</h3>

        <div class="endpoint">
          <span class="method">GET</span>
          <code>/health</code>
          <p>Check API status</p>
          <div class="code-block">
            <pre>Response: { "status": "ok" }</pre>
          </div>
        </div>

        <div class="endpoint">
          <span class="method">GET</span>
          <code>/v1/bmi</code>
          <p>Calculate BMI using query parameters (metric or imperial)</p>
          <table>
            <thead>
              <tr><th>Parameter</th><th>Type</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><code>weight_kg</code></td><td>number</td><td>Weight in kg (20-300)</td></tr>
              <tr><td><code>height_cm</code></td><td>number</td><td>Height in cm (100-250)</td></tr>
              <tr><td><code>weight_lb</code></td><td>number</td><td>Weight in lb (44-660)</td></tr>
              <tr><td><code>height_in</code></td><td>number</td><td>Height in inches (39-98)</td></tr>
            </tbody>
          </table>
        </div>

        <div class="endpoint">
          <span class="method post">POST</span>
          <code>/v1/bmi</code>
          <p>Calculate BMI using JSON body</p>
          <table>
            <thead>
              <tr><th>Field</th><th>Type</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><code>units</code></td><td>string</td><td>"metric" or "imperial"</td></tr>
              <tr><td><code>weight</code></td><td>number</td><td>Weight value</td></tr>
              <tr><td><code>height</code></td><td>number</td><td>Height value</td></tr>
            </tbody>
          </table>
        </div>

        <h3>Error Responses</h3>
        <table>
          <thead>
            <tr><th>Status</th><th>Error Message</th><th>Cause</th></tr>
          </thead>
          <tbody>
            <tr><td>400</td><td>Invalid JSON body</td><td>Malformed JSON</td></tr>
            <tr><td>400</td><td>Missing/invalid "units"</td><td>Units not metric/imperial</td></tr>
            <tr><td>400</td><td>Value out of range</td><td>Input exceeds limits</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section id="reliability">
      <div class="container">
        <h2>Reliability & Limits</h2>
        <!-- Uptime badge placeholder: add your monitoring service badge here -->
        <p class="text-muted">Please keep requests under 60 req/min per IP to ensure fair usage.</p>
      </div>
    </section>

    <section id="education">
      <div class="container">
        <h2>Understanding BMI</h2>
        <p>Body Mass Index (BMI) = weight (kg) / height² (m²)</p>
        
        <table>
          <thead>
            <tr><th>BMI Range</th><th>Category</th><th>Health Risk</th></tr>
          </thead>
          <tbody>
            <tr><td>&lt; 18.5</td><td>Underweight</td><td>Possible nutritional deficiency</td></tr>
            <tr><td>18.5 - 24.9</td><td>Normal weight</td><td>Low risk</td></tr>
            <tr><td>25.0 - 29.9</td><td>Overweight</td><td>Moderate risk</td></tr>
            <tr><td>≥ 30.0</td><td>Obesity</td><td>High risk</td></tr>
          </tbody>
        </table>

        <div class="disclaimer">
          <strong>⚠️ Disclaimer:</strong> This is not medical advice. BMI doesn't account for muscle mass, bone density, or body composition. Consult a healthcare professional for personalized assessments.
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="container">
      <div class="footer-links">
        <a href="https://github.com/ginnysingh789/public-bmi-api" target="_blank">GitHub</a>
        <a href="https://github.com/ginnysingh789/public-bmi-api/issues" target="_blank">Report Issue</a>
        <a href="https://github.com/ginnysingh789/public-bmi-api#api-documentation" target="_blank">API Docs</a>
      </div>
      <p class="text-muted"> 2025 BMI Calculator API • MIT License • Free Public API</p>
    </div>
  </footer>

  <script>
    // Set base URL dynamically
    document.addEventListener('DOMContentLoaded', () => {
      const baseUrl = window.location.origin;
      document.getElementById('baseUrl').textContent = baseUrl;
      document.querySelectorAll('.base-url').forEach(el => {
        el.textContent = baseUrl;
      });
    });

    // Update units in form
    function updateUnits() {
      const units = document.querySelector('input[name="units"]:checked').value;
      const weightInput = document.getElementById('weight');
      const heightInput = document.getElementById('height');
      
      if (units === 'metric') {
        document.getElementById('weightUnit').textContent = '(kg)';
        document.getElementById('heightUnit').textContent = '(cm)';
        weightInput.min = 20; weightInput.max = 300;
        heightInput.min = 100; heightInput.max = 250;
      } else {
        document.getElementById('weightUnit').textContent = '(lb)';
        document.getElementById('heightUnit').textContent = '(in)';
        weightInput.min = 44; weightInput.max = 660;
        heightInput.min = 39; heightInput.max = 98;
      }
    }

    // Calculate BMI
    async function calculateBMI(event) {
      event.preventDefault();
      
      const units = document.querySelector('input[name="units"]:checked').value;
      const weight = parseFloat(document.getElementById('weight').value);
      const height = parseFloat(document.getElementById('height').value);
      
      const resultDiv = document.getElementById('result');
      const errorDiv = document.getElementById('error');
      
      // Hide previous results
      resultDiv.classList.add('hidden');
      errorDiv.classList.add('hidden');
      
      try {
        const response = await fetch('/v1/bmi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ units, weight, height })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Calculation failed');
        }
        
        // Display results
        document.getElementById('bmiValue').textContent = data.bmi;
        document.getElementById('categoryValue').textContent = data.category;
        document.getElementById('rangeValue').textContent = 
          data.healthy_weight_range_kg[0] + ' - ' + data.healthy_weight_range_kg[1] + ' kg';
        document.getElementById('jsonResponse').textContent = JSON.stringify(data, null, 2);
        
        resultDiv.classList.remove('hidden');
      } catch (error) {
        errorDiv.textContent = 'Error: ' + error.message;
        errorDiv.classList.remove('hidden');
      }
    }

    // Toggle collapsible
    function toggleCollapsible(button) {
      const content = button.nextElementSibling;
      content.classList.toggle('show');
      button.setAttribute('aria-expanded', content.classList.contains('show'));
    }

    // Copy code to clipboard
    async function copyCode(button) {
      const codeBlock = button.parentElement.querySelector('pre');
      const text = codeBlock.textContent;
      
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
          button.textContent = 'Copy';
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  </script>
</body>
</html>`;

app.get("/", (c) => c.html(pageHtml));

export default app;