/**
 * Phase 3: Living KB Versioning
 * Tracks document versions and marks proposals as outdated
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, GitBranch, AlertTriangle, CheckCircle2, Download, Eye } from 'lucide-react';

export default function DocumentVersionHistory({ projectId, documents = [] }) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showDiff, setShowDiff] = useState(false);

  // Mock version history for each document
  const mockVersionHistory = {
    'doc_1': [
      {
        version: 3,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        uploadedBy: 'You',
        changes: 'Updated scope section with clearer acceptance criteria',
        affectedProposals: 8, // Proposals now marked as outdated
        status: 'current'
      },
      {
        version: 2,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        uploadedBy: 'You',
        changes: 'Added budget breakdown and payment schedule',
        affectedProposals: 5,
        status: 'superseded'
      },
      {
        version: 1,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        uploadedBy: 'You',
        changes: 'Initial document upload',
        affectedProposals: 12,
        status: 'superseded'
      }
    ]
  };

  const versionHistory = mockVersionHistory['doc_1'] || [];

  // Mock diff view
  const mockDiff = {
    title: 'Changes in v3',
    additions: [
      '+ Acceptance criteria: Must pass integration tests',
      '+ Timeline: 4-week delivery with 2-week buffer',
      '+ QA phase: Full regression testing required'
    ],
    deletions: [
      '- "Delivery within reasonable timeframe" (too vague)',
      '- Original scope section (replaced with detailed spec)'
    ]
  };

  return (
    <div className="w-full space-y-6">
      {/* Version Timeline */}
      <div className="space-y-3">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-purple-400" />
          Document Version History
        </h3>

        {versionHistory.length === 0 ? (
          <div className="text-gray-400 text-sm py-6 text-center">
            No version history yet
          </div>
        ) : (
          <div className="space-y-2">
            {versionHistory.map((version, idx) => (
              <motion.div
                key={version.version}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedVersion(selectedVersion === version.version ? null : version.version)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedVersion === version.version
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700/50 bg-gray-800/30 hover:border-purple-500/30'
                }`}
              >
                {/* Version Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">v{version.version}</span>
                        {version.status === 'current' && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded border border-green-500/50">
                            CURRENT
                          </span>
                        )}
                        {version.status === 'superseded' && (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs font-semibold rounded border border-gray-500/50">
                            SUPERSEDED
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm font-medium mb-1">{version.changes}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {version.timestamp.toLocaleDateString()} {version.timestamp.toLocaleTimeString()}
                      </span>
                      <span>By {version.uploadedBy}</span>
                    </div>
                  </div>

                  {/* Impact Indicator */}
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1">Affected Proposals</p>
                    <p className="text-lg font-bold text-orange-400">{version.affectedProposals}</p>
                    {version.affectedProposals > 0 && version.status === 'superseded' && (
                      <motionabel className="text-xs text-orange-300 flex items-center gap-1 mt-1 justify-end">
                        <AlertTriangle className="w-3 h-3" />
                        Marked outdated
                      </motionabel>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedVersion === version.version && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-700/50 space-y-4"
                    >
                      {/* Diff Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDiff(!showDiff);
                        }}
                        className="px-3 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-300 text-sm rounded hover:bg-purple-500/30 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {showDiff ? 'Hide' : 'View'} Changes
                      </button>

                      {/* Diff View */}
                      {showDiff && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-gray-900/50 rounded p-3 space-y-2 text-xs font-mono"
                        >
                          <p className="text-white font-bold mb-2">{mockDiff.title}</p>

                          {/* Additions */}
                          <div className="space-y-1">
                            {mockDiff.additions.map((add, i) => (
                              <div key={i} className="text-green-400">
                                {add}
                              </div>
                            ))}
                          </div>

                          {/* Deletions */}
                          <div className="space-y-1">
                            {mockDiff.deletions.map((del, i) => (
                              <div key={i} className="text-red-400">
                                {del}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Proposal Impact */}
                      <div className="bg-gray-900/50 rounded p-3">
                        <p className="text-gray-400 text-xs font-semibold mb-2">Proposal Impact:</p>
                        <p className="text-gray-300 text-xs">
                          {version.affectedProposals} proposals submitted against this version
                          {version.status === 'superseded' && (
                            <span className="block text-orange-300 mt-1">
                              ⚠️ These proposals are now marked <strong>&quot;OUTDATED&quot;</strong> in your dashboard
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-xs rounded transition-colors flex items-center justify-center gap-1">
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                        {version.status === 'superseded' && (
                          <button className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded transition-colors">
                            Restore Version
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Outdated Proposals Alert */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 space-y-3"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-orange-300 font-semibold text-sm">Proposals Affected by Changes</p>
            <p className="text-gray-400 text-xs mt-1">
              When you update project documents, proposals submitted against older versions are automatically marked as <strong>&quot;OUTDATED&quot;</strong> in your dashboard. Freelancers will see a notification and can resubmit with the latest requirements.
            </p>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/50 text-orange-300 text-xs rounded hover:bg-orange-500/30 transition-colors">
                View Outdated Proposals (5)
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Version Control Best Practices */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-300 font-semibold text-sm mb-2">💡 Version Control Tips</p>
        <ul className="text-gray-300 text-xs space-y-1">
          <li>✓ Update documents frequently? Version history keeps freelancers informed</li>
          <li>✓ Need to rollback? Restore any previous version with one click</li>
          <li>✓ See all changes? Diff view shows exactly what changed between versions</li>
          <li>✓ Know the impact? Affected proposal count tells you the scope of change</li>
        </ul>
      </div>
    </div>
  );
}
