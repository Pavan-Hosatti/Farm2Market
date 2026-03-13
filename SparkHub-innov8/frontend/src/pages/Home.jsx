import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mic, ShieldCheck, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
      <main className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-4">SparkHub</h1>
          <p className="text-xl text-slate-200 max-w-3xl mx-auto">
            Final Clean Flow for clients and freelancers: brief upload, AI checks, ranked proposals, voice Q&A, and Algorand proof.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/signup" className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold">
              Get Started
            </Link>
            <Link to="/dashboard" className="px-6 py-3 rounded-lg border border-slate-400 hover:border-emerald-400 font-semibold">
              Open Dashboard
            </Link>
          </div>
        </div>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <FeatureCard icon={<Briefcase className="w-6 h-6" />} title="Project Marketplace" desc="Client briefs, freelancer proposals, and AI-assisted ranking." />
          <FeatureCard icon={<Mic className="w-6 h-6" />} title="Voice + RAG" desc="Multilingual voice/text question answering over project docs." />
          <FeatureCard icon={<ShieldCheck className="w-6 h-6" />} title="Dispute Ready" desc="Neutral AI summaries from brief, proposal, chat, and proof timeline." />
          <FeatureCard icon={<Sparkles className="w-6 h-6" />} title="Algorand Proof" desc="Hashes anchored with graceful fallback when chain is unavailable." />
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
      <div className="text-emerald-400 mb-3">{icon}</div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-slate-300">{desc}</p>
    </article>
  );
}
