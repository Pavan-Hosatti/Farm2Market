/**
 * Phase 10: Dispute Resolution
 * AI generates neutral arbitration summary from brief/proposal/chat/proof history
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BalanceScale, FileText, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DisputeResolver({ caseId = 'CASE-2024-0847' }) {
  const [showDetail, setShowDetail] = useState(false);

  const mockCaseData = {
    caseId,
    status: 'arbitration_in_progress',
    claimant: { role: 'Project Owner', name: 'Client Inc.' },
    respondent: { role: 'Freelancer', name: 'Dev Specialist' },
    disputeReason: 'Incomplete deliverables - frontend not pixel-perfect',
    filedDate: '2024-01-15T09:30:00Z',
    
    evidence: {
      brief: {
        requirement: 'Pixel-perfect responsive design matching Figma mockups',
        acceptance_criteria: 'All breakpoints (mobile, tablet, desktop) match designs ±2px tolerance',
        budget: '$18,000',
        timeline: '4 weeks'
      },
      proposal: {
        deliverables: 'Full responsive implementation with Tailwind CSS',
        timeline: '4 weeks',
        note: 'Responsive design standard web practices (±5% layout shift acceptable)'
      },
      chat_clarifications: [
        {
          sender: 'Client',
          msg: 'Does ±2px tolerance mean exact pixel perfection across all resolutions?',
          timestamp: '2024-01-05'
        },
        {
          sender: 'Freelancer',
          msg: 'I understood standard responsive practices. Happy to discuss expectations.',
          timestamp: '2024-01-05'
        }
      ],
      proof_history: [
        { milestone: 'Design review', status: 'anchored', date: '2024-01-08' },
        { milestone: 'Development started', status: 'anchored', date: '2024-01-10' },
        { milestone: 'Complete on 4 Feb', status: 'anchored', date: '2024-02-04' }
      ]
    },

    arbitration: {
      summary: 'Scope mismatch on design precision requirements.',
      findings: [
        {
          point: 'Brief stated "pixel-perfect" with ±2px tolerance spec',
          evidence: 'Brief document, requirement #3',
          weight: 'high'
        },
        {
          point: 'Freelancer proposal mentioned "standard web practices" without referencing tolerance spec',
          evidence: 'Proposal, section Deliverables',
          weight: 'medium'
        },
        {
          point: 'Chat clarification attempt by Client not fully acknowledged',
          evidence: 'Chat log, Jan 5 14:32 UTC',
          weight: 'medium'
        },
        {
          point: 'Freelancer delivered functional responsive design meeting modern standards',
          evidence: 'Milestone proof anchors',
          weight: 'medium'
        }
      ],
      verdict: 'PARTIAL_FAULT_BOTH',
      recommendation: 'Client 60% - Did not ensure tolerance spec was explicit in proposal. Freelancer 40% - Should have referenced or questioned tolerance spec upfront.',
      suggested_resolution: [
        '$18,000 contract: Client pays $10,800 (60% as agreed)',
        'Freelancer revises specifics 5 sections to ±2px standard ($2,000 change order)',
        'Final payment on acceptance: $9,200'
      ]
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Case Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-500/50 rounded-lg p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-purple-400 font-semibold text-xs mb-1">Arbitration Case</p>
            <h3 className="text-2xl font-bold text-white">{mockCaseData.caseId}</h3>
            <p className="text-gray-400 text-xs mt-2">Filed: {new Date(mockCaseData.filedDate).toLocaleDateString()}</p>
          </div>
          <BalanceScale className="w-8 h-8 text-purple-400" />
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
            <p className="text-red-400 text-xs font-semibold">Claimant</p>
            <p className="text-white font-semibold mt-1">{mockCaseData.claimant.name}</p>
            <p className="text-gray-400 text-xs">{mockCaseData.claimant.role}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
            <p className="text-blue-400 text-xs font-semibold">Respondent</p>
            <p className="text-white font-semibold mt-1">{mockCaseData.respondent.name}</p>
            <p className="text-gray-400 text-xs">{mockCaseData.respondent.role}</p>
          </div>
        </div>

        {/* Dispute Reason */}
        <div className="mt-4 bg-black/30 rounded p-3">
          <p className="text-gray-400 text-xs mb-1">Dispute Reason</p>
          <p className="text-white text-sm">{mockCaseData.disputeReason}</p>
        </div>
      </motion.div>

      {/* Evidence Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 border border-gray-700 rounded-lg p-5"
      >
        <p className="text-gray-400 font-semibold text-sm mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Evidence Reviewed
        </p>

        <div className="space-y-3 text-xs">
          {/* Brief */}
          <div className="border border-gray-700 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300 font-semibold">Project Brief</p>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="space-y-1 text-gray-400">
              <p>• Requirement: {mockCaseData.evidence.brief.requirement}</p>
              <p>• Criteria: {mockCaseData.evidence.brief.acceptance_criteria}</p>
            </div>
          </div>

          {/* Proposal */}
          <div className="border border-gray-700 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300 font-semibold">Freelancer Proposal</p>
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="space-y-1 text-gray-400">
              <p>• Deliverables: {mockCaseData.evidence.proposal.deliverables}</p>
              <p>• Note: {mockCaseData.evidence.proposal.note}</p>
            </div>
          </div>

          {/* Chat */}
          <div className="border border-gray-700 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300 font-semibold">Chat Clarifications</p>
              <MessageSquare className="w-4 h-4 text-blue-400" />
            </div>
            <div className="space-y-2">
              {mockCaseData.evidence.chat_clarifications.map((msg, idx) => (
                <div key={idx} className="text-gray-400 text-xs">
                  <p className="font-semibold text-gray-300">{msg.sender}:</p>
                  <p className="ml-2">"{msg.msg}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Arbitration Finding */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/50 rounded-lg p-5"
      >
        <p className="text-yellow-400 font-semibold text-sm mb-4">⚖️ Arbitration Finding</p>

        {/* Summary */}
        <div className="bg-black/30 rounded p-3 mb-4">
          <p className="text-white font-semibold mb-2 text-sm">{mockCaseData.arbitration.summary}</p>
        </div>

        {/* Key Findings */}
        <div className="space-y-2 mb-4">
          {mockCaseData.arbitration.findings.map((finding, idx) => (
            <div key={idx} className="flex gap-3 text-xs">
              <div className="flex-shrink-0 w-5 h-5 bg-yellow-500/30 rounded-full flex items-center justify-center">
                <span className="text-yellow-300 text-xs font-bold">{idx + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-white">{finding.point}</p>
                <p className="text-gray-500">{finding.evidence}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Verdict */}
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-3 mb-4">
          <p className="text-yellow-300 font-semibold text-sm">
            Client ~60% liable | Freelancer ~40% liable
          </p>
          <p className="text-yellow-200 text-xs mt-2">{mockCaseData.arbitration.recommendation}</p>
        </div>

        {/* Suggested Resolution */}
        <div>
          <p className="text-gray-400 text-xs font-semibold mb-2">Suggested Resolution Steps</p>
          <ol className="space-y-1 text-xs text-gray-300">
            {mockCaseData.arbitration.suggested_resolution.map((step, idx) => (
              <li key={idx} className="ml-4 before:content-['→'] before:mr-2">
                {step}
              </li>
            ))}
          </ol>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDetail(!showDetail)}
          className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-2 rounded text-sm transition"
        >
          {showDetail ? 'Hide Details' : 'View Full Case'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded text-sm transition"
        >
          Agree & Resolve
        </motion.button>
      </div>

      {/* Fallback Notice */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300">
        <p className="font-semibold mb-1">ℹ️ AI-Generated Summary</p>
        <p>This arbitration summary is AI-generated from brief, proposal, chat logs, and proof history. Both parties can request human review.</p>
      </div>
    </div>
  );
}
