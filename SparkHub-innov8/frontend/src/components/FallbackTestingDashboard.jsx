/**
 * Phase 11: Hardening & Fallback Testing
 * Graceful degradation when AI/voice/blockchain unavailable
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

export default function FallbackTestingDashboard() {
  const [serviceStates, setServiceStates] = useState({
    aiAnalysis: 'online', // online, unavailable
    voiceInput: 'online',
    voiceOutput: 'online',
    blockchain: 'online',
    embedding: 'online',
    scoring: 'online'
  });

  const toggleService = (service) => {
    setServiceStates(prev => ({
      ...prev,
      [service]: prev[service] === 'online' ? 'unavailable' : 'online'
    }));
  };

  const fallbackRules = {
    aiAnalysis: {
      failure: 'AI Analysis Unavailable',
      normal: 'AI generates detailed proposal analysis',
      fallback: 'Show source snippets from brief + "analysis pending" badge'
    },
    voiceInput: {
      failure: 'Voice Input Unavailable',
      normal: 'Web Speech API captures voice queries',
      fallback: 'Auto-switch to text input mode with message "voice unavailable"'
    },
    voiceOutput: {
      failure: 'Text-to-Speech Unavailable',
      normal: 'SpeechSynthesisUtterance reads responses aloud',
      fallback: 'Disable "Speak Answer" button, show silent message delivery'
    },
    blockchain: {
      failure: 'Blockchain Unavailable',
      normal: 'Algorand anchors document hashes for proof',
      fallback: 'Continue flow with proof_pending status; retry on connection restore'
    },
    embedding: {
      failure: 'Embedding/Search Failure',
      normal: 'Generate embeddings for RAG document retrieval',
      fallback: 'Use keyword-based retrieval fallback; show "confidence pending"'
    },
    scoring: {
      failure: 'Proposal Scoring Failure',
      normal: 'AI scores proposal comprehension 0-100',
      fallback: 'Auto-accept proposal, mark score_pending, allow manual rescoring'
    }
  };

  const getCategoryColor = (status) => {
    return status === 'online' ? 'from-green-500/20 to-green-600/10 border-green-500/50' : 'from-red-500/20 to-red-600/10 border-red-500/50';
  };

  const getStateIcon = (status) => {
    return status === 'online' ? (
      <Wifi className="w-5 h-5 text-green-400" />
    ) : (
      <WifiOff className="w-5 h-5 text-red-400" />
    );
  };

  return (
    <div className="w-full space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
      >
        <p className="text-blue-300 font-semibold text-sm mb-2">🧪 Fallback Testing Console</p>
        <p className="text-gray-400 text-xs">
          Toggle services offline to test graceful degradation. All flows should continue with reduced functionality.
        </p>
      </motion.div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Object.entries(fallbackRules).map(([service, rules], idx) => (
          <motion.div
            key={service}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => toggleService(service)}
            className={`bg-gradient-to-br ${getCategoryColor(serviceStates[service])} border-2 rounded-lg p-4 cursor-pointer hover:shadow-lg transition`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStateIcon(serviceStates[service])}
                <div>
                  <p className="text-white font-semibold text-sm capitalize">
                    {service.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className={`text-xs font-semibold ${serviceStates[service] === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                    {serviceStates[service].toUpperCase()}
                  </p>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${serviceStates[service] === 'online' ? 'bg-green-500/30' : 'bg-red-500/30'}`}
              >
                {serviceStates[service] === 'online' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                )}
              </motion.div>
            </div>

            {/* Normal Operation */}
            <div className="bg-black/30 rounded p-2 mb-3">
              <p className="text-gray-500 text-xs font-semibold mb-1">Normal Operation</p>
              <p className="text-gray-300 text-xs">{rules.normal}</p>
            </div>

            {/* Fallback Behavior */}
            <div className={`rounded p-2 ${serviceStates[service] === 'unavailable' ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-green-500/10 border border-green-500/30'}`}>
              <p className="text-gray-400 text-xs font-semibold mb-1">⚙️ Fallback</p>
              <p className={`text-xs ${serviceStates[service] === 'unavailable' ? 'text-yellow-300' : 'text-green-300'}`}>
                {rules.fallback}
              </p>
            </div>

            {/* Toggle Instruction */}
            <p className="text-gray-500 text-xs mt-3">Click to toggle offline/online</p>
          </motion.div>
        ))}
      </div>

      {/* Scenario Testing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-5"
      >
        <p className="text-purple-300 font-semibold text-sm mb-4">📋 Test Scenarios</p>
        <div className="space-y-3">
          {[
            {
              name: 'Freelancer Chat with Voice Unavailable',
              steps: [
                'Toggle Voice Input OFF',
                'Open RAG Chat',
                'Try to click mic button',
                'Expected: Input field shows, button disabled'
              ]
            },
            {
              name: 'Proposal Scoring Fails During Bid Review',
              steps: [
                'Toggle Scoring OFF',
                'View freelancer proposal bid',
                'Expected: Shows proposal, "Score pending" badge, allows continue'
              ]
            },
            {
              name: 'All Services Down - Full Fallback',
              steps: [
                'Toggle all services OFF',
                'Navigate through full flow',
                'Expected: Every component gracefully degrades, platform still usable'
              ]
            },
            {
              name: 'Blockchain + Embedding Fail - Partial',
              steps: [
                'Toggle Blockchain OFF',
                'Toggle Embedding OFF',
                'Create project + upload docs',
                'Expected: Uploads work, proof_pending, keyword search shows'
              ]
            }
          ].map((scenario, idx) => (
            <div key={idx} className="bg-black/30 rounded p-3">
              <p className="text-white font-semibold text-sm mb-2">{scenario.name}</p>
              <ol className="space-y-1">
                {scenario.steps.map((step, stepIdx) => (
                  <li key={stepIdx} className="text-gray-400 text-xs ml-4 before:content-['→'] before:mr-2">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Validation Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-green-500/10 border border-green-500/30 rounded-lg p-5"
      >
        <p className="text-green-300 font-semibold text-sm mb-4">✅ Validation Checklist</p>
        <div className="space-y-2 text-xs">
          {[
            { test: 'Platform remains usable when all services offline', status: 'pending' },
            { test: 'No hard crashes or console errors on service failures', status: 'pending' },
            { test: 'Users can still navigate / create / submit with reduced features', status: 'pending' },
            { test: 'Fallback messages clearly indicate degraded functionality', status: 'pending' },
            { test: 'Auto-retry logic requests service status periodically', status: 'pending' },
            { test: 'Recovery works when service comes back online', status: 'pending' }
          ].map((check, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="w-5 h-5 rounded border-2 border-gray-600 flex-shrink-0 flex items-center justify-center">
                {check.status === 'done' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <div className="w-2 h-2 bg-gray-600 rounded-full" />
                )}
              </div>
              <p className="text-gray-300">{check.test}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Current Status Display */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <p className="text-gray-400 text-xs font-semibold mb-3">Current Service Matrix</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(serviceStates).map(([service, status]) => (
            <div key={service} className="flex items-center justify-between bg-black/30 rounded p-2">
              <span className="text-gray-400 capitalize">{service.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className={`font-semibold ${status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                {status === 'online' ? '🟢' : '🔴'} {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hardening Notes */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-xs text-blue-300">
        <p className="font-semibold mb-2">🔒 Hardening Principles</p>
        <ul className="space-y-1 text-gray-300">
          <li>• No external service call blocks user interaction (all async)</li>
          <li>• Errors wrapped in try-catch with structured fallback renders</li>
          <li>• Toast notifications inform users of degraded functionality</li>
          <li>• Data loss prevented by storing state before service calls</li>
          <li>• Recovery graceful: when service comes back, auto-retry queued operations</li>
        </ul>
      </div>
    </div>
  );
}
