import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cloud, Globe2, Sparkles, ArrowRight, Zap, Key, ShieldCheck } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { useSite } from '../../hooks/useSite';
import { useBranding } from '../../hooks/useBranding';
import { useAuth } from '../../hooks/useAuth';
import { publicApi } from '../../api/public';
import { formatMoney } from '../../utils/format';
import { reverseGeocode } from '../../utils/geocode';

const FEATURES = [
  { icon: Key, title: 'One key, every forecast', desc: 'Create a single API key. Query current conditions and 7-day forecasts with the same credential.' },
  { icon: Globe2, title: 'Global coverage', desc: 'Any latitude, any longitude. From Nairobi to Nome — one API serves the whole planet.' },
  { icon: Sparkles, title: 'AI-powered summaries', desc: "Skip the JSON parsing. Get a human-readable summary of any location's weather in two short sentences." },
];

const STEPS = [
  { icon: Zap, title: 'Sign up', desc: 'Tell us about your business and pick a plan.' },
  { icon: ShieldCheck, title: 'Pay securely', desc: 'M-Pesa or bank transfer. Invoices within seconds.' },
  { icon: Key, title: 'Get your key', desc: 'Instant API access. Start building in under a minute.' },
];

const DEFAULT_LAT = Number(import.meta.env.VITE_DEMO_LAT) || -1.2921;
const DEFAULT_LON = Number(import.meta.env.VITE_DEMO_LON) || 36.8219;
const DEFAULT_CITY = import.meta.env.VITE_DEMO_CITY || 'Nairobi';

function WeatherCard() {
  const { brand } = useBranding();
  const [demo, setDemo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [city, setCity] = useState(DEFAULT_CITY);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather(lat, lon, name) {
      try {
        const data = await publicApi.site.demoWeather({ lat, lon });
        if (cancelled) return;
        const payload = data?.current ? data : data?.data;
        if (payload?.current) {
          setDemo(payload);
          if (name) setCity(name);
          else if (payload.location?.name) setCity(payload.location.name);
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function detectLocation() {
      if (!navigator.geolocation) {
        loadWeather(DEFAULT_LAT, DEFAULT_LON, null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const name = await reverseGeocode(lat, lon);
          loadWeather(lat, lon, name || null);
        },
        () => loadWeather(DEFAULT_LAT, DEFAULT_LON, null),
        { timeout: 8000, maximumAge: 5 * 60 * 1000 }
      );
    }

    detectLocation();
    return () => { cancelled = true; };
  }, []);

  const temp = demo?.current?.temp != null ? Math.round(demo.current.temp) : '—';
  const condition = demo?.current?.condition || (failed ? 'Data unavailable' : 'Loading…');
  const feelsLike = demo?.current?.feelsLike;
  const humidity = demo?.current?.humidity;
  const windSpeed = demo?.current?.wind?.speed;
  const latDisplay = demo?.location?.lat != null ? demo.location.lat.toFixed(4) : DEFAULT_LAT.toFixed(4);
  const lonDisplay = demo?.location?.lon != null ? demo.location.lon.toFixed(4) : DEFAULT_LON.toFixed(4);

  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-br from-[var(--brand-accent)]/20 to-transparent rounded-3xl blur-2xl" />
      <Card className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${failed ? 'bg-warning' : 'bg-success animate-pulse'}`} />
              {failed ? 'Preview' : 'Live'} · {city}
            </p>
            <p className="text-sm text-text mt-1">{brand.name}</p>
          </div>
          <Cloud size={28} className="text-[var(--brand-accent)]" />
        </div>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton height={64} width="55%" />
            <Skeleton height={14} width="70%" />
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <Skeleton height={30} />
              <Skeleton height={30} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2 my-6">
              <span className="text-6xl font-bold text-text">{temp}</span>
              <span className="text-2xl text-text-muted">{typeof temp === 'number' ? '°C' : ''}</span>
            </div>
            <p className="text-sm text-text-muted">
              {condition}
              {feelsLike != null && ` · Feels like ${Math.round(feelsLike)}°`}
            </p>
            <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-text-muted">Humidity</p>
                <p className="font-medium text-text mt-0.5">{humidity != null ? `${humidity}%` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Wind</p>
                <p className="font-medium text-text mt-0.5">{windSpeed != null ? `${Math.round(windSpeed)} km/h` : '—'}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-text-subtle font-mono break-all">
                GET /v1/weather/current?lat={latDisplay}&lon={lonDisplay}
              </p>
              <p className="text-[10px] text-text-subtle mt-1">
                Powered by {brand.name}
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { plans } = useSite();
  const { isAuthenticated, scope } = useAuth();
  const { brand } = useBranding();

  const go = () =>
    navigate(isAuthenticated ? (scope === 'pending' ? '/pending' : '/app/dashboard') : '/register');

  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[var(--brand-accent)]/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="info" dot className="mb-5">Weather API · v1.0</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-text leading-[1.1]">
                Weather data,<br />
                <span className="text-[var(--brand-accent)]">delivered.</span>
              </h1>
              <p className="mt-6 text-lg text-text-muted leading-relaxed max-w-lg">
                One key. Every forecast. Current conditions, 7-day outlooks, and AI summaries — for any coordinate on earth. Billed monthly, yearly, or once.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" rightIcon={<ArrowRight size={16} />} onClick={go}>
                  {isAuthenticated ? 'Open dashboard' : 'Get started'}
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
                  View pricing
                </Button>
              </div>
              <p className="mt-4 text-xs text-text-muted">
                No credit card required to register. Pay via M-Pesa.
              </p>
            </div>

            <WeatherCard />
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-border bg-surface-2/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-text">Built for developers</h2>
            <p className="mt-4 text-text-muted">Clean JSON. Predictable billing. No surprises.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <Card key={f.title} hover>
                <div className="w-11 h-11 rounded-lg bg-[var(--brand-accent)]/10 flex items-center justify-center mb-4">
                  <f.icon size={22} className="text-[var(--brand-accent)]" />
                </div>
                <h3 className="text-base font-semibold text-text">{f.title}</h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-text">Start building in minutes</h2>
            <p className="mt-4 text-text-muted">Three steps from sign-up to first request.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <Card key={s.title}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-[var(--brand-accent)] text-white text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <s.icon size={20} className="text-text-muted" />
                </div>
                <h3 className="text-base font-semibold text-text">{s.title}</h3>
                <p className="mt-1.5 text-sm text-text-muted">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {plans.length > 0 && (
        <section className="border-t border-border bg-surface-2/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-text">Simple pricing</h2>
              <p className="mt-4 text-text-muted">Pick a plan. Cancel anytime. Pay with M-Pesa.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.slice(0, 3).map((plan) => {
                const featured = plan.price?.interval === 'year';
                return (
                  <Card key={plan.code} className={featured ? 'ring-2 ring-[var(--brand-accent)] relative' : 'relative'}>
                    {featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="success" size="sm" dot>Best value</Badge>
                      </div>
                    )}
                    <p className="text-xs text-text-muted uppercase tracking-wider font-medium">{plan.name}</p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-text">{formatMoney(plan.price.amount, plan.price.currency)}</span>
                      <span className="text-sm text-text-muted">/{plan.price.interval === 'once' ? 'once' : plan.price.interval}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-2 mb-5">{plan.description}</p>
                    <Button
                      variant={featured ? 'primary' : 'outline'}
                      fullWidth
                      onClick={() => navigate(`/register?plan=${plan.code}`)}
                    >
                      Get {plan.name}
                    </Button>
                  </Card>
                );
              })}
            </div>
            <div className="text-center mt-10">
              <Link to="/pricing" className="text-sm font-medium text-[var(--brand-accent)] hover:underline">
                Compare all plans →
              </Link>
            </div>
          </div>
        </section>
      )}

      <section id="contact" className="border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text">Ready to build?</h2>
          <p className="mt-4 text-text-muted max-w-lg mx-auto">
            Start with a free account. Pay only when you're ready to go live.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={go} rightIcon={<ArrowRight size={16} />}>
              {isAuthenticated ? 'Open dashboard' : 'Create free account'}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
              See pricing
            </Button>
          </div>
          {brand.supportEmail && (
            <p className="mt-6 text-sm text-text-muted">
              Questions? Email <a href={`mailto:${brand.supportEmail}`} className="text-[var(--brand-accent)] hover:underline">{brand.supportEmail}</a>
            </p>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}