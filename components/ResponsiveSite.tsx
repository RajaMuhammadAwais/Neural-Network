import React from 'react';
import { Sparkles, Zap, ShieldCheck, Gauge, Layers, Globe, Smartphone, MonitorSmartphone, Component } from 'lucide-react';

const SectionTitle: React.FC<{ eyebrow: string; title: string; subtitle?: string; }> = ({ eyebrow, title, subtitle }) => (
  <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
    <div className="text-xs tracking-widest uppercase text-indigo-400 font-bold">{eyebrow}</div>
    <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold text-white leading-tight">{title}</h2>
    {subtitle && <p className="mt-3 text-slate-400 text-sm sm:text-base">{subtitle}</p>}
  </div>
);

export const ResponsiveSite: React.FC = () => {
  return (
    <div className="bg-slate-950">
      {/* Header / Nav */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-slate-950/75 bg-slate-900/70 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 sm:h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400">
                <Sparkles size={18}/>
              </span>
              <span className="font-semibold text-white">Aurora</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm">
              <a className="text-slate-300 hover:text-white transition-colors" href="#features">Features</a>
              <a className="text-slate-300 hover:text-white transition-colors" href="#performance">Performance</a>
              <a className="text-slate-300 hover:text-white transition-colors" href="#pricing">Pricing</a>
              <a className="text-slate-300 hover:text-white transition-colors" href="#faq">FAQ</a>
            </nav>
            <div className="flex items-center gap-3">
              <button className="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white">Sign in</button>
              <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30">
                Get started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-600/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-6">
              <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-white">
                Build once. Look perfect on every screen.
              </h1>
              <p className="mt-4 text-slate-300 text-base sm:text-lg">
                Aurora is a responsive UI system with fluid spacing, scalable typography, and adaptive components designed for exceptional UX across mobile, tablet, and desktop.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-900/40">
                  Start free
                </button>
                <button className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700">
                  View docs
                </button>
              </div>

              {/* Value props */}
              <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-400"/>Accessible</div>
                <div className="flex items-center gap-2"><Zap size={16} className="text-yellow-400"/>Fast</div>
                <div className="flex items-center gap-2"><Layers size={16} className="text-sky-400"/>Composable</div>
                <div className="flex items-center gap-2"><Gauge size={16} className="text-purple-400"/>Adaptive</div>
              </div>
            </div>
            <div className="lg:col-span-6">
              {/* Mockup panel */}
              <div className="relative rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="col-span-3 sm:col-span-2 h-40 sm:h-48 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-800" />
                    <div className="h-40 sm:h-48 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-800" />
                    <div className="col-span-3 h-16 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-800" />
                    <div className="col-span-3 grid grid-cols-3 gap-3 sm:gap-4">
                      <div className="h-28 rounded-xl bg-slate-800/70 border border-slate-700" />
                      <div className="h-28 rounded-xl bg-slate-800/70 border border-slate-700" />
                      <div className="h-28 rounded-xl bg-slate-800/70 border border-slate-700" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                <MonitorSmartphone size={14}/> Fully fluid layout preview
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="py-12 sm:py-16 md:py-20 border-t border-slate-800">
        <SectionTitle
          eyebrow="Capabilities"
          title="Adaptive components that scale with intent"
          subtitle="Layout, typography, and spacing automatically adjust to screen size and density with consistent hierarchy."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              { icon: <Globe />, title: 'Fluid Layouts', desc: 'Grid and stack systems that expand gracefully from mobile to widescreen.' },
              { icon: <Smartphone />, title: 'Mobile-first', desc: 'Controls sized for touch with ergonomic spacing and hit targets.' },
              { icon: <Component />, title: 'Composable', desc: 'Reusable primitives to build complex interfaces consistently.' },
              { icon: <Gauge />, title: 'Scalable Type', desc: 'Use clamp-based responsive typography for optimal readability.' },
              { icon: <Layers />, title: 'Design Tokens', desc: 'Unified colors, spacing, and radii for brand consistency.' },
              { icon: <Zap />, title: 'Performance', desc: 'Lightweight, GPU-accelerated transitions and minimal reflow.' },
            ].map((f, i) => (
              <div key={i} className="group rounded-2xl p-5 bg-slate-900/70 border border-slate-800 hover:border-indigo-600/60 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/15 text-indigo-400 flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-white font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance section */}
      <section id="performance" className="py-12 sm:py-16 md:py-20 border-t border-slate-800">
        <SectionTitle
          eyebrow="Engineering"
          title="Built for speed, tuned for UX"
          subtitle="CLS-safe animations, lazy-loaded assets, and fine-grained control over reflows to keep interactions snappy."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6">
              <h4 className="text-white font-semibold">Responsive typography</h4>
              <p className="mt-2 text-sm text-slate-400">
                Typography scales between breakpoints using CSS clamp:
              </p>
              <pre className="mt-3 text-xs text-slate-300 bg-slate-950/70 border border-slate-800 rounded-lg p-3 overflow-x-auto">
{`/* Example */
:root {
  --step-0: clamp(0.95rem, 0.8rem + 0.3vw, 1.05rem);
  --step-1: clamp(1.2rem, 1.05rem + 0.6vw, 1.5rem);
}`}
              </pre>
            </div>
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6">
              <h4 className="text-white font-semibold">Adaptive spacing</h4>
              <p className="mt-2 text-sm text-slate-400">
                Scale rhythm with container queries and responsive utilities to preserve hierarchy.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="h-10 bg-slate-800 rounded" />
                <div className="h-12 bg-slate-800 rounded" />
                <div className="h-14 bg-slate-800 rounded" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-12 sm:py-16 md:py-20 border-t border-slate-800">
        <SectionTitle eyebrow="Simple Pricing" title="Choose your plan" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: 'Free', features: ['Basic components', 'Email support', 'Community'] },
              { name: 'Pro', price: '$19/mo', features: ['All components', 'Theming', 'Priority support'], highlight: true },
              { name: 'Enterprise', price: 'Custom', features: ['Design tokens', 'Audit & SSO', 'Dedicated success'] },
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl border p-6 ${p.highlight ? 'border-indigo-500 bg-slate-900/80 shadow-lg shadow-indigo-900/40' : 'border-slate-800 bg-slate-900/60'}`}>
                <div className="text-sm text-slate-400">{p.name}</div>
                <div className="mt-2 text-3xl font-semibold text-white">{p.price}</div>
                <ul className="mt-4 text-sm text-slate-300 space-y-2">
                  {p.features.map((f, idx) => <li key={idx}>• {f}</li>)}
                </ul>
                <button className={`mt-5 w-full py-2 rounded-lg font-semibold ${p.highlight ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'}`}>
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-12 sm:py-16 md:py-20 border-t border-slate-800">
        <SectionTitle eyebrow="Answers" title="Frequently asked questions" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/60">
            {[
              ['How responsive is it?', 'Every section uses fluid units and responsive utilities to adapt from 320px to 1920px+.'],
              ['Does it support accessibility?', 'Yes, contrast-friendly colors, focus states, and semantic markup are used.'],
              ['Is it production-ready?', 'The layout emphasizes performance with small payloads and GPU-accelerated transitions.'],
            ].map(([q, a], i) => (
              <details key={i} className="group p-4 sm:p-5">
                <summary className="cursor-pointer text-white font-medium flex items-center justify-between">
                  {q}
                  <span className="ml-4 text-slate-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-2 text-slate-400 text-sm">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-slate-400">© {new Date().getFullYear()} Aurora UI. All rights reserved.</div>
            <div className="flex items-center gap-5 text-sm text-slate-400">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Status</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};