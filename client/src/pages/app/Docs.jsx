import { useState } from 'react';
import { Play, Copy, CheckCircle2, Key } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { weatherApi } from '../../api/weather';
import { useToast } from '../../hooks/useToast';

const DEMO_LAT = -1.2921;
const DEMO_LON = 36.8219;

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/v1/weather/current',
    description: 'Current weather conditions for any coordinate',
    params: ['lat (required)', 'lon (required)'],
    example: '/v1/weather/current?lat=-1.2921&lon=36.8219',
  },
  {
    method: 'GET',
    path: '/v1/weather/forecast',
    description: 'Daily forecast up to 16 days ahead',
    params: ['lat (required)', 'lon (required)', 'days (optional, 1–16, default 7)'],
    example: '/v1/weather/forecast?lat=-1.2921&lon=36.8219&days=14',
  },
];

const CODE_SAMPLES = {
  curl: (key, lat, lon) =>
    `curl "https://meteo.hdm.co.ke/v1/weather/current?lat=${lat}&lon=${lon}" \\
  -H "Authorization: Bearer ${key || 'YOUR_API_KEY'}"`,
  node: (key, lat, lon) =>
    `const axios = require('axios');

const res = await axios.get(
  'https://meteo.hdm.co.ke/v1/weather/current',
  {
    params: { lat: ${lat}, lon: ${lon} },
    headers: {
      Authorization: 'Bearer ${key || 'YOUR_API_KEY'}',
    },
  }
);

console.log(res.data);`,
  python: (key, lat, lon) =>
    `import requests

res = requests.get(
    'https://meteo.hdm.co.ke/v1/weather/current',
    params={'lat': ${lat}, 'lon': ${lon}},
    headers={'Authorization': 'Bearer ${key || 'YOUR_API_KEY'}'},
)

print(res.json())`,
};

const ERROR_CODES = [
  ['SUBSCRIPTION_REQUIRED', 'Payment required to use the API'],
  ['SUBSCRIPTION_EXPIRED', 'Your subscription has expired'],
  ['INVALID_API_KEY', 'API key is invalid or revoked'],
  ['API_KEY_EXPIRED', 'API key has expired'],
  ['SCOPE_NOT_ALLOWED', 'Key does not have permission for this endpoint'],
  ['INVALID_LAT', 'Latitude must be between -90 and 90'],
  ['INVALID_LON', 'Longitude must be between -180 and 180'],
  ['INVALID_DAYS', 'Days must be an integer between 1 and 16'],
  ['RATE_LIMITED', 'Too many requests — slow down'],
];

export default function Docs() {
  const toast = useToast();
  const [tab, setTab] = useState('curl');
  const [apiKey, setApiKey] = useState('');
  const [lat, setLat] = useState(String(DEMO_LAT));
  const [lon, setLon] = useState(String(DEMO_LON));
  const [mode, setMode] = useState('current');
  const [days, setDays] = useState('7');
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  async function tryIt() {
    if (!apiKey.trim()) {
      toast.error('Paste your API key first');
      return;
    }
    const latNum = Number(lat);
    const lonNum = Number(lon);
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      toast.error('Enter valid coordinates');
      return;
    }

    setRunning(true);
    setError(null);
    setResult(null);
    try {
      let data;
      if (mode === 'current') {
        data = await weatherApi.current(apiKey.trim(), { lat: latNum, lon: lonNum });
      } else {
        const d = Math.min(16, Math.max(1, Number(days) || 7));
        data = await weatherApi.forecast(apiKey.trim(), { lat: latNum, lon: lonNum, days: d });
      }
      setResult(data);
    } catch (err) {
      setError(err);
    } finally {
      setRunning(false);
    }
  }

  async function copyCode() {
    const code = CODE_SAMPLES[tab](apiKey, lat, lon);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed');
    }
  }

  const codeSample = CODE_SAMPLES[tab](apiKey, lat, lon);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text">API Documentation</h1>
        <p className="text-sm text-text-muted mt-1">Everything you need to integrate HDM METEO.</p>
      </div>

      <Alert variant="info" title="Authentication">
        Every request requires an{' '}
        <code className="font-mono text-xs">Authorization: Bearer hdm_meteo_live_...</code> header. Create an API key from the{' '}
        <a href="/app/api-keys" className="underline font-medium">API Keys</a> page.
      </Alert>

      {/* Quick start */}
      <Card title="Quick start">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            {Object.keys(CODE_SAMPLES).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  tab === t
                    ? 'bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]'
                    : 'text-text-muted hover:text-text hover:bg-surface-2'
                }`}
              >
                {t === 'curl' ? 'cURL' : t === 'node' ? 'Node.js' : 'Python'}
              </button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              leftIcon={copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              onClick={copyCode}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <pre className="text-xs font-mono text-text bg-surface-2 border border-border rounded-lg p-4 overflow-x-auto whitespace-pre">
            {codeSample}
          </pre>
        </div>
      </Card>

      {/* Playground */}
      <Card title="Try it live" description="Test the API with your own key">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('current')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                mode === 'current'
                  ? 'bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setMode('forecast')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                mode === 'forecast'
                  ? 'bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              Forecast
            </button>
          </div>

          <Input
            label="Your API key"
            type="password"
            placeholder="hdm_meteo_live_..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            leftIcon={<Key size={16} />}
            hint="Never shared. Used only for this request."
          />

          <div className={mode === 'forecast' ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-2 gap-3'}>
            <Input label="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} />
            <Input label="Longitude" value={lon} onChange={(e) => setLon(e.target.value)} />
            {mode === 'forecast' && (
              <Input
                label="Days"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                hint="1–16"
              />
            )}
          </div>

          <Button onClick={tryIt} loading={running} leftIcon={<Play size={16} />}>
            Run request
          </Button>

          {error && (
            <Alert variant="error" title={`${error.status || 'Error'} · ${error.code || 'FAILED'}`}>
              {error.message}
            </Alert>
          )}

          {result && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Response</p>
                <Badge variant="success" size="sm" dot>200</Badge>
              </div>
              <pre className="text-xs font-mono text-text bg-surface-2 border border-border rounded-lg p-4 overflow-x-auto max-h-96 whitespace-pre">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Card>

      {/* Endpoints */}
      <Card title="Endpoints">
        <div className="space-y-4">
          {ENDPOINTS.map((ep) => (
            <div key={ep.path} className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="success" size="sm">{ep.method}</Badge>
                <code className="text-xs font-mono text-text">{ep.path}</code>
              </div>
              <p className="text-sm text-text-muted">{ep.description}</p>
              <div className="mt-2">
                <p className="text-xs text-text-muted font-medium">Parameters</p>
                <ul className="mt-1 list-inside list-disc text-xs text-text-muted">
                  {ep.params.map((p) => <li key={p} className="font-mono">{p}</li>)}
                </ul>
              </div>
              <div className="mt-2">
                <p className="text-xs text-text-muted font-medium">Example</p>
                <code className="text-xs font-mono text-text-subtle break-all">{ep.example}</code>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Error codes */}
      <Card title="Error codes">
        <div className="space-y-2 text-sm">
          {ERROR_CODES.map(([code, desc]) => (
            <div key={code} className="flex items-start gap-3 py-1.5 border-b border-border/50 last:border-0">
              <code className="text-xs font-mono text-danger shrink-0 w-52">{code}</code>
              <span className="text-xs text-text-muted">{desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}