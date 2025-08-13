# BMI Calculator API

A free, open-source REST API for calculating Body Mass Index (BMI) with WHO category classification. No authentication required, CORS-enabled for browser access.

**Live API**: `https://bmi-api.ginnysangral786-f5a.workers.dev`

## Features

- Calculate BMI from metric (kg, cm) or imperial (lb, in) units
- WHO category classification (Underweight, Normal, Overweight, Obesity)
- Healthy weight range calculation
- No authentication required - completely free
- CORS enabled for browser/frontend access
- Interactive documentation UI at root URL
- Deployed on Cloudflare Workers (global edge network)

## Quick Start

### Base URL
```
https://bmi-api.ginnysangral786-f5a.workers.dev
```

### Example Request
```bash
curl "https://bmi-api.ginnysangral786-f5a.workers.dev/v1/bmi?weight_kg=70&height_cm=175"
```

### Example Response
```json
{
  "bmi": 22.86,
  "category": "Normal weight",
  "inputs": {
    "weight_kg": 70,
    "height_cm": 175,
    "units": "metric"
  },
  "healthy_weight_range_kg": [56.7, 76.56],
  "notes": ["Adult BMI categories per WHO"]
}
```

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{ "status": "ok" }
```

### GET /v1/bmi

Calculate BMI using query parameters.

**Parameters:**

Metric units:
- `weight_kg` (number): Weight in kilograms (20-300)
- `height_cm` (number): Height in centimeters (100-250)

Imperial units:
- `weight_lb` (number): Weight in pounds (44-660)
- `height_in` (number): Height in inches (39-98)

**Example - Metric:**
```bash
GET /v1/bmi?weight_kg=70&height_cm=175
```

**Example - Imperial:**
```bash
GET /v1/bmi?weight_lb=154&height_in=69
```

### POST /v1/bmi

Calculate BMI using JSON body.

**Request Body:**
```json
{
  "units": "metric",  // or "imperial"
  "weight": 70,       // kg for metric, lb for imperial
  "height": 175       // cm for metric, inches for imperial
}
```

**Example:**
```bash
curl -X POST https://bmi-api.ginnysangral786-f5a.workers.dev/v1/bmi \
  -H "Content-Type: application/json" \
  -d '{"units":"metric","weight":70,"height":175}'
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Successful calculation
- `400 Bad Request`: Invalid input parameters
- `500 Internal Server Error`: Server error

**Error Response Format:**
```json
{
  "error": "weight_kg must be between 20 and 300"
}
```

## Input Validation

- Weight and height must be positive numbers
- Values must be within reasonable human ranges
- Metric and imperial units cannot be mixed in a single request

## BMI Categories (WHO Standards)

| BMI Range | Category |
|-----------|----------|
| < 18.5 | Underweight |
| 18.5 - 24.9 | Normal weight |
| 25.0 - 29.9 | Overweight |
| ≥ 30.0 | Obesity |

## Development

### Prerequisites
- Node.js 18+
- Cloudflare account (free)

### Local Development
```bash
# Install dependencies
npm install

# Run locally
npm run dev
# API available at http://127.0.0.1:8787

# Run tests
npm test
```

### Deployment
```bash
# Login to Cloudflare
wrangler login

# Deploy to Cloudflare Workers
wrangler deploy
```

## For public-apis Submission

```markdown
| [BMI Calculator](https://bmi-api.ginnysangral786-f5a.workers.dev) | Calculate BMI with metric/imperial units | No | Yes | Yes |
```

## License

MIT License - Free to use in personal and commercial projects.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions, please [open an issue](https://github.com/yourusername/bmi-api-worker/issues) on GitHub.
