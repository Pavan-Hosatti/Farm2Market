/**
 * Phase 5: Bid Comprehension Score
 * AI-generated score showing how well proposal understands project requirements
 * Displays 0-100 score, explanation of missing points, and ranking
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';

export default function BidComprehensionScore({ proposal = null }) {
  // Mock proposal with comprehension score
  const mockProposal = proposal || {
    id: 'prop_1',
    freelancer: 'John Developer',
    bidAmount: 18000,
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    comprehensionScore: 87,
    comprehensionAnalysis: {
      strengths: [
        '✅ Mentioned all 5 required skills (React, Node.js, PostgreSQL, AWS, OAuth)',
        '✅ Understood timeline: 8 weeks with QA buffer',
        '✅ Budget bid within acceptable range ($15k-$30k)',
        '✅ Referenced specific technical stack'
      ],
      weaknesses: [
        '⚠️ Did not address payment milestones explicitly',
        '⚠️ No mention of error handling standards',
        '⚠️ Light on deployment strategy details'
      ],
      missingPoints: [
        'No discussion of testing strategy',
        'No mention of documentation requirements',
        'Unclear on communication frequency'
      ],
      overallSentiment: 'Strong understanding of core requirements. Would benefit from clarity on testing and communication expectations.'
    },
    ranking: 2, // Out of all proposals
    totalProposals: 12
  };

  if (!mockProposal) {
    return <div className="text-gray-400 text-center py-8">No proposal data available</div>;
  }

  const score = mockProposal.comprehensionScore;
  const getScoreColor = (s) => {
    if (s >= 85) return { bg: 'from-green-500/20 to-green-600/10', text: 'text-green-400', border: 'border-green-500/30' };
    if (s >= 70) return { bg: 'from-yellow-500/20 to-yellow-600/10', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    return { bg: 'from-red-500/20 to-red-600/10', text: 'text-red-400', border: 'border-red-500/30' };
  };

  const colors = getScoreColor(score);

  return (
    <div className="w-full space-y-4">
      {/* Main Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`gradient-to-br ${colors.bg} border-2 ${colors.border} rounded-lg p-6 space-y-4`}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Bid Comprehension Score</p>
            <p className="text-gray-300 font-semibold">{mockProposal.freelancer}</p>
          </div>
          <div className="text-right">
            <Brain className={`w-6 h-6 ${colors.text}`} />
          </div>
        </div>

        {/* Score Display */}
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Circular Progress */}
            <svg className="transform -rotate-90 w-32 h-32" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="rgba(107, 114, 128, 0.2)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <motion.circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={colors.text === 'text-green-400' ? '#4ade80' : colors.text === 'text-yellow-400' ? '#facc15' : '#f87171'}
                strokeWidth="8"
                strokeDasharray={`${(score / 100) * 339.3} 339.3`}
                initial={{ strokeDasharray: '0 339.3' }}
                animate={{ strokeDasharray: `${(score / 100) * 339.3} 339.3` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>

            {/* Center text */}
            <div className="absolute text-center">
              <p className={`text-4xl font-bold ${colors.text}`}>{score}</p>
              <p className="text-gray-400 text-xs">out of 100</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-400">Ranking</p>
                <TrendingUp className={`w-4 h-4 ${colors.text}`} />
              </div>
              <p className={`text-2xl font-bold ${colors.text}`}>
                #{mockProposal.ranking} / {mockProposal.totalProposals}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Bid Amount</p>
              <p className="text-xl font-bold text-white">${mockProposal.bidAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Sentiment Summary */}
        <div className="pt-4 border-t border-gray-700/50">
          <p className="text-xs text-gray-400 mb-2">Analysis Summary</p>
          <p className="text-sm text-gray-300 italic">{mockProposal.comprehensionAnalysis.overallSentiment}</p>
        </div>
      </motion.div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Strengths */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-green-500/10 border border-green-500/30 rounded-lg p-4"
        >
          <h3 className="text-green-400 font-semibold text-sm mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Strengths
          </h3>
          <ul className="space-y-2">
            {mockProposal.comprehensionAnalysis.strengths.map((strength, idx) => (
              <li key={idx} className="text-xs text-green-300">
                {strength}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Weaknesses */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
        >
          <h3 className="text-yellow-400 font-semibold text-sm mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Points to Clarify
          </h3>
          <ul className="space-y-2">
            {mockProposal.comprehensionAnalysis.weaknesses.map((weakness, idx) => (
              <li key={idx} className="text-xs text-yellow-300">
                {weakness}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Missing Points */}
      {mockProposal.comprehensionAnalysis.missingPoints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
        >
          <h3 className="text-red-400 font-semibold text-sm mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Not Mentioned (Consider Asking)
          </h3>
          <ul className="space-y-2">
            {mockProposal.comprehensionAnalysis.missingPoints.map((point, idx) => (
              <li key={idx} className="text-xs text-red-300 flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Scoring Methodology */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-xs text-blue-300"
      >
        <p className="font-semibold mb-2">💡 How We Score</p>
        <ul className="space-y-1 text-xs text-gray-400">
          <li>✓ Mentions of required skills (+15 pts each)</li>
          <li>✓ Understanding of timeline/milestones (+20 pts)</li>
          <li>✓ Appropriate budget alignment (+15 pts)</li>
          <li>✓ Technical depth and details (+20 pts)</li>
          <li>✓ Communication clarity (+10 pts)</li>
          <li>✓ Risk mitigation awareness (+10 pts)</li>
          <li>- Missing critical requirements (-5 to -10 pts)</li>
        </ul>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors text-sm font-medium">
          Message Freelancer
        </button>
        <button className="flex-1 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium">
          Accept Proposal
        </button>
      </div>
    </div>
  );
}
