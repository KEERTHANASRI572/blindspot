import React from 'react';
import { BookOpen, Check, X, Sparkles, Brain, Scale, ShieldCheck } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const comparisonData = [
    {
      feature: 'Cognitive Dimension Tested',
      khanmigo: 'Surface recall & guided homework',
      notebooklm: 'Note summarization & citation',
      anki: 'Factoid retrieval (flashcards)',
      chatgpt: 'Generic open text explanation',
      blindspot: 'Transfer scenarios under novel constraints',
    },
    {
      feature: 'Metacognitive Calibration Gap',
      khanmigo: 'No',
      notebooklm: 'No',
      anki: 'Subjective self-rating',
      chatgpt: 'No',
      blindspot: 'Yes (Blindspot = Confidence - Score, Brier Curve)',
    },
    {
      feature: 'Misconception Fingerprinting',
      khanmigo: 'Generic hints',
      notebooklm: 'No',
      anki: 'No',
      chatgpt: 'Ad-hoc text',
      blindspot: 'Yes (28+ Ontological library & radar profiling)',
    },
    {
      feature: 'Socratic Hint Discipline',
      khanmigo: 'Partial Socratic prompt',
      notebooklm: 'Direct answer',
      anki: 'Direct answer reveal',
      chatgpt: 'Often blurts answer',
      blindspot: 'Strict 4-tier ladder (Question -> Analogy -> Partial -> Reveal)',
    },
    {
      feature: 'Dual-Agent Verifier Guard',
      khanmigo: 'No',
      notebooklm: 'No',
      anki: 'No',
      chatgpt: 'No',
      blindspot: 'Yes (Audits ambiguity & rejects recall questions)',
    },
    {
      feature: 'Confused Student & Viva Modes',
      khanmigo: 'No',
      notebooklm: 'Audio overview podcast',
      anki: 'No',
      chatgpt: 'Prompt engineering required',
      blindspot: 'Native interactive roleplay & oral exam grading',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Scientific Pedagogy & Architecture</span>
        </div>
        <h2 className="text-3xl font-black text-white">Why BLINDSPOT Is Radically Different</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Standard educational tools cater to recognition memory. BLINDSPOT forces deep mental model reconstruction by diagnosing underlying cognitive misconceptions.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 overflow-x-auto">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-sky-400" /> Related Work vs. BLINDSPOT Differential Advantage
        </h3>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono">
              <th className="py-3 px-3">Capability</th>
              <th className="py-3 px-3">Khanmigo</th>
              <th className="py-3 px-3">NotebookLM</th>
              <th className="py-3 px-3">Anki / Quizlet</th>
              <th className="py-3 px-3">ChatGPT Study</th>
              <th className="py-3 px-3 text-sky-400 font-bold bg-sky-500/10 rounded-t-lg">BLINDSPOT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {comparisonData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-3 font-semibold text-white">{row.feature}</td>
                <td className="py-3 px-3 text-slate-400">{row.khanmigo}</td>
                <td className="py-3 px-3 text-slate-400">{row.notebooklm}</td>
                <td className="py-3 px-3 text-slate-400">{row.anki}</td>
                <td className="py-3 px-3 text-slate-400">{row.chatgpt}</td>
                <td className="py-3 px-3 text-sky-300 font-bold bg-sky-500/5">{row.blindspot}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mathematical Formulation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <h4 className="text-sm font-bold text-sky-400">1. Blindspot & Brier Score</h4>
          <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
            Blindspot = Conf - Actual Score<br />
            BS = (1/N) * Σ (Conf - Score)²
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Measures calibration error. A positive Blindspot signifies an overconfidence illusion; the Brier score measures the overall mean squared reliability of probabilistic belief.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <h4 className="text-sm font-bold text-indigo-400">2. Bayesian Knowledge Tracing</h4>
          <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
            P(L_t|Obs) = Bayes(P_prev, S, G)<br />
            P(L_t+1) = P(L_t|Obs) + (1-P) * P_T
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tracks posterior probability that each concept node is mastered, accounting for guess (P_G), slip (P_S), transit rate (P_T), and hint deduction penalties.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <h4 className="text-sm font-bold text-emerald-400">3. Prerequisite Decay Propagation</h4>
          <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
            If P(L_target) &lt; 0.40:<br />
            ∀ c ∈ Pred: P(L_c) *= 0.90
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            "Mastery on connections": When a learner fails an advanced concept, the failure decays prerequisite foundations, triggering targeted spaced review.
          </p>
        </div>
      </div>
    </div>
  );
};
