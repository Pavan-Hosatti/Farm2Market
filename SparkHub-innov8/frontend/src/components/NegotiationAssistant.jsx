/**
 * Phase 8: Negotiation Assistant
 * AI suggests fair price range based on project scope, complexity, freelancer experience
 */

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

export default function NegotiationAssistant({ projectBudget = {}, freelanceExperience = 'mid' }) {
  const mockAnalysis = {
    marketMedianRate: 85, // $/hour
    projectComplexity: 'high', // low, mid, high
    timeEstimate: 320, // hours
    recommendedRange: {
      min: 22400, // 320 * 70
      max: 27200, // 320 * 85
      mid: 24800
    },
    breakdown: [
      { phase: 'Planning', hours: 40, rate: 70 },
      { phase: 'Development', hours: 200, rate: 80 },
      { phase: 'Testing', hours: 60, rate: 75 },
      { phase: 'Deployment', hours: 20, rate: 90 }
    ],
    riskFactors: [
      { factor: 'Scope clarity', assessment: 'High', adjustment: '+10%' },
      { factor: 'Timeline pressure', assessment: 'Moderate', adjustment: '+5%' },
      { factor: 'Technical complexity', assessment: 'High', adjustment: '+15%' }
    ]
  };

  const totalRiskAdjustment = 30; // percent
  const adjustedMin = Math.round(mockAnalysis.recommendedRange.min * (1 + totalRiskAdjustment / 100));
  const adjustedMax = Math.round(mockAnalysis.recommendedRange.max * (1 + totalRiskAdjustment / 100));
  const adjustedMid = Math.round(mockAnalysis.recommendedRange.mid * (1 + totalRiskAdjustment / 100));

  return (
    <div className="w-full space-y-4">
      {/* Recommended Range */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/50 rounded-lg p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-green-400 font-semibold text-sm mb-1">Fair Market Price Range</p>
            <h3 className="text-3xl font-bold text-white">
              ${adjustedMin.toLocaleString()} - ${adjustedMax.toLocaleString()}
            </h3>
            <p className="text-gray-400 text-xs mt-1">Recommended midpoint: ${adjustedMid.toLocaleString()}</p>
          </div>
          <DollarSign className="w-8 h-8 text-green-400" />
        </div>

        {/* Price Breakdown by Phase */}
        <div className="space-y-2">
          {mockAnalysis.breakdown.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex-1">
                <p className="text-gray-300">{item.phase}</p>
                <p className="text-gray-500">{item.hours}h @ ${item.rate}/hr</p>
              </div>
              <p className="text-green-300 font-semibold">${(item.hours * item.rate).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Risk Adjustment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4"
      >
        <p className="text-orange-400 font-semibold text-sm mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Risk Adjustments: +{totalRiskAdjustment}%
        </p>
        <div className="space-y-2">
          {mockAnalysis.riskFactors.map((risk, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div>
                <p className="text-gray-300">{risk.factor}</p>
                <p className="text-gray-500">{risk.assessment}</p>
              </div>
              <span className="text-orange-300 font-semibold">{risk.adjustment}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Comparison with Offer */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <p className="text-gray-400 text-xs mb-3 font-semibold">Current Offer vs Recommended</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs">Freelancer Bid</p>
            <p className="text-white font-bold text-lg">$18,000</p>
          </div>
          <div className="text-center">
            <p className="text-red-400 text-xs font-semibold">27% BELOW</p>
            <p className="text-red-400 text-xs">Market Rate</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Fair Range</p>
            <p className="text-white font-bold text-lg">${adjustedMid.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Negotiation Strategy */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-xs text-blue-300">
        <p className="font-semibold mb-2">💡 Negotiation Tips</p>
        <ul className="space-y-1 text-xs text-gray-300">
          <li>• Current bid is below market. Consider counteroffer at ${(adjustedMid * 0.85).toFixed(0).toLocaleString()}</li>
          <li>• Reference freelancer's experience level and skill-fit score</li>
          <li>• Highlight project complexity and risk factors</li>
          <li>• Build goodwill: offer milestone bonuses for early delivery</li>
        </ul>
      </div>
    </div>
  );
}
