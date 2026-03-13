/**
 * Phase 6: Scope Gap Detector UI
 * Pre-publish validator showing ambiguity checklist
 * Prevents low-quality project briefs from being published
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, AlertCircle, Zap, TrendingUp,
  Lock, Unlock, Lightbulb
} from 'lucide-react';

export default function ScopeGapDetector({ projectData = {}, onGapsAnalyzed = () => {} }) {
  const [gapResults, setGapResults] = React.useState(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  // Mock gap detection algorithm
  const detectGaps = () => {
    setIsAnalyzing(true);

    // Simulate AI analysis
    setTimeout(() => {
      const gaps = [];
      const weights = {};

      // Gap detection logic
      if (!projectData.title || projectData.title.length < 10) {
        gaps.push({
          id: 'gap_title',
          category: 'Title',
          issue: 'Project title is too vague or missing',
          severity: 'high',
          suggestion: 'Use descriptive title like "Build E-commerce React App with Payment Integration"',
          weight: 15
        });
        weights.gap_title = 0;
      } else {
        weights.gap_title = 15;
      }

      if (!projectData.budgetMax || projectData.budgetMax === '') {
        gaps.push({
          id: 'gap_budget',
          category: 'Budget',
          issue: 'No maximum budget specified',
          severity: 'high',
          suggestion: 'Set a clear budget range. Freelancers need to know the financial scope.',
          weight: 20
        });
        weights.gap_budget = 0;
      } else {
        weights.gap_budget = 20;
      }

      if (!projectData.timeline || projectData.timeline === '') {
        gaps.push({
          id: 'gap_timeline',
          category: 'Timeline',
          issue: 'Project timeline is not specified',
          severity: 'high',
          suggestion: 'Specify "4 weeks", "3 months", etc. Unclear timelines confuse freelancers.',
          weight: 20
        });
        weights.gap_timeline = 0;
      } else {
        weights.gap_timeline = 20;
      }

      if (!projectData.description || projectData.description.length < 100) {
        gaps.push({
          id: 'gap_description',
          category: 'Description',
          issue: 'Project description is too brief',
          severity: 'high',
          suggestion: 'Provide at least 100 characters. Include: what you want, why you want it, expected outcome.',
          weight: 15
        });
        weights.gap_description = 0;
      } else if (projectData.description.length < 200) {
        weights.gap_description = 10;
      } else {
        weights.gap_description = 15;
      }

      if (!projectData.skillsRequired || projectData.skillsRequired.length === 0) {
        gaps.push({
          id: 'gap_skills',
          category: 'Skills',
          issue: 'No required skills specified',
          severity: 'medium',
          suggestion: 'List key skills: "React", "Node.js", "PostgreSQL", "AWS", etc.',
          weight: 15
        });
        weights.gap_skills = 0;
      } else if (projectData.skillsRequired.length < 3) {
        gaps.push({
          id: 'gap_skills',
          category: 'Skills',
          issue: 'Only a few skills specified',
          severity: 'low',
          suggestion: 'Consider adding more specific skill requirements for better matching.',
          weight: 10
        });
        weights.gap_skills = 10;
      } else {
        weights.gap_skills = 15;
      }

      if (!projectData.scope || projectData.scope.length < 50) {
        gaps.push({
          id: 'gap_scope',
          category: 'Scope',
          issue: 'Project scope is not clearly defined',
          severity: 'medium',
          suggestion: 'What\'s IN scope? What\'s OUT of scope? Ambiguity leads to disputes.',
          weight: 10
        });
        weights.gap_scope = 0;
      } else {
        weights.gap_scope = 10;
      }

      // Check for acceptance criteria
      const hasAcceptanceCriteria = projectData.description?.includes('accept') ||
        projectData.description?.includes('criteria') ||
        projectData.description?.includes('success');

      if (!hasAcceptanceCriteria && projectData.description?.length > 100) {
        gaps.push({
          id: 'gap_acceptance',
          category: 'Acceptance Criteria',
          issue: 'No clear acceptance criteria mentioned',
          severity: 'low',
          suggestion: 'How will you know the project is complete? Define "done".',
          weight: 5
        });
        weights.gap_acceptance = 0;
      } else {
        weights.gap_acceptance = 5;
      }

      // Calculate overall score
      const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
      const maxWeight = 100;
      const clarityScore = Math.round((totalWeight / maxWeight) * 100);

      // Determine readiness
      const criticalGaps = gaps.filter(g => g.severity === 'high');
      const readyToPublish = criticalGaps.length === 0;

      const results = {
        gaps,
        clarityScore,
        readyToPublish,
        criticalGaps: criticalGaps.length,
        totalGaps: gaps.length,
        analyzedAt: new Date(),
        recommendation: readyToPublish
          ? '✅ Project is well-defined. Ready to publish!'
          : `⚠️ Fix ${criticalGaps.length} critical gap(s) before publishing`
      };

      setGapResults(results);
      onGapsAnalyzed(results);
      setIsAnalyzing(false);
    }, 1500);
  };

  // Auto-analyze when component mounts or data changes
  useEffect(() => {
    if (projectData.title) {
      detectGaps();
    }
  }, []);

  if (!gapResults) {
    return (
      <div className="text-center py-12">
        <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Click "Analyze Gaps" to check project clarity</p>
      </div>
    );
  }

  const { gaps, clarityScore, readyToPublish, recommendation } = gapResults;

  return (
    <div className="w-full space-y-6">
      {/* Clarity Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-lg p-8 border-2 ${
          readyToPublish
            ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/50'
            : 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/50'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Project Clarity Score</p>
            <h2 className="text-3xl font-bold text-white">
              {clarityScore}% <span className="text-xl text-gray-400">Clarity</span>
            </h2>
          </div>
          <div className="text-right">
            {readyToPublish ? (
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-orange-400" />
            )}
          </div>
        </div>

        {/* Score Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <motion.div
              className={`h-full ${
                readyToPublish
                  ? 'bg-gradient-to-r from-green-500 to-green-400'
                  : 'bg-gradient-to-r from-orange-500 to-orange-400'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${clarityScore}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            readyToPublish
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-orange-500/10 border-orange-500/30 text-orange-300'
          }`}
        >
          <p className="font-semibold">{recommendation}</p>
        </motion.div>

        {/* Lock Status */}
        <div className="mt-6 flex items-center gap-3 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
          {readyToPublish ? (
            <>
              <Unlock className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-green-400">Ready to Publish</p>
                <p className="text-xs text-gray-400">All critical requirements met</p>
              </div>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-sm font-semibold text-orange-400">Publishing Blocked</p>
                <p className="text-xs text-gray-400">Fix {gapResults.criticalGaps} critical gap(s) first</p>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Gaps List */}
      {gaps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold">Gaps Found ({gaps.length})</h3>

          <AnimatePresence>
            {gaps.map((gap, idx) => (
              <motion.div
                key={gap.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-lg border-2 ${
                  gap.severity === 'high'
                    ? 'bg-red-500/10 border-red-500/30'
                    : gap.severity === 'medium'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {gap.severity === 'high' && (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                    {gap.severity === 'medium' && (
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    )}
                    {gap.severity === 'low' && (
                      <Lightbulb className="w-5 h-5 text-blue-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{gap.category}</p>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          gap.severity === 'high'
                            ? 'bg-red-500/20 text-red-300'
                            : gap.severity === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {gap.severity.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-300 text-sm mb-2">{gap.issue}</p>

                    <div className="bg-gray-900/50 rounded p-3 border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">💡 Suggestion:</p>
                      <p className="text-xs text-gray-300">{gap.suggestion}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {gaps.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-green-500/10 border border-green-500/30 rounded-lg"
        >
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-green-300 font-semibold">No gaps detected!</p>
          <p className="text-gray-400 text-sm mt-1">Your project is well-defined and clear.</p>
        </motion.div>
      )}

      {/* Scope Gap Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"
      >
        <p className="text-purple-300 font-semibold text-sm mb-3">📋 What Makes a Good Project Brief?</p>
        <ul className="space-y-2 text-xs text-gray-300">
          <li className="flex gap-2">
            <span className="text-purple-400">✓</span>
            <span>Clear title that describes the deliverable</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400">✓</span>
            <span>Detailed description with context and goals</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400">✓</span>
            <span>Specific budget range, not vague</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400">✓</span>
            <span>Realistic timeline with milestones</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400">✓</span>
            <span>List of required skills and experience</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400">✓</span>
            <span>Clear scope boundaries (in/out)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400">✓</span>
            <span>Acceptance criteria and success metrics</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
