/**
 * Phase 7: Skill-Fit Radar
 * Visual radar chart matching freelancer profile skills vs project requirements
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Target, TrendingUp } from 'lucide-react';

export default function SkillFitRadar({ freelancer = {}, projectSkills = [] }) {
  // Mock radar data
  const radarData = [
    { skill: 'React', freelancer: 92, project: 90 },
    { skill: 'Node.js', freelancer: 85, project: 95 },
    { skill: 'PostgreSQL', freelancer: 78, project: 90 },
    { skill: 'AWS', freelancer: 65, project: 85 },
    { skill: 'OAuth', freelancer: 88, project: 80 },
    { skill: 'DevOps', freelancer: 45, project: 70 }
  ];

  const fitPercentage = Math.round(
    radarData.reduce((sum, item) => sum + Math.min(item.freelancer, item.project), 0) / radarData.length
  );

  return (
    <div className="w-full space-y-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Skill-Fit Radar
          </h3>
          <p className="text-gray-400 text-sm mt-1">Match between freelancer and project requirements</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-purple-400">{fitPercentage}%</p>
          <p className="text-xs text-gray-400">Overall Fit</p>
        </div>
      </div>

      {/* Radar Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#374151" strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="skill" stroke="#9CA3AF" />
          <PolarRadiusAxis stroke="#4B5563" angle={90} domain={[0, 100]} />
          <Radar
            name="Freelancer Level"
            dataKey="freelancer"
            stroke="#A78BFA"
            fill="#A78BFA"
            fillOpacity={0.3}
          />
          <Radar
            name="Project Need"
            dataKey="project"
            stroke="#60A5FA"
            fill="#60A5FA"
            fillOpacity={0.1}
          />
          <Legend />
          <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Skills Gap Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded p-4">
          <p className="text-green-400 font-semibold text-sm mb-3">✅ Strong Areas</p>
          <ul className="space-y-1 text-xs text-green-300">
            <li>• React: 92/90 (Exceeds requirement)</li>
            <li>• OAuth: 88/80 (Good fit)</li>
            <li>• Node.js: 85/95 (Can catch up quickly)</li>
          </ul>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded p-4">
          <p className="text-orange-400 font-semibold text-sm mb-3">⚠️ Areas to Develop</p>
          <ul className="space-y-1 text-xs text-orange-300">
            <li>• AWS: 65/85 (5-week learning curve)</li>
            <li>• DevOps: 45/70 (Consider pairing)</li>
            <li>• PostgreSQL: 78/90 (Good foundation)</li>
          </ul>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4">
        <p className="text-blue-300 font-semibold text-sm mb-2">💡 Recommendation</p>
        <p className="text-xs text-gray-300">Strong fit overall (88%). Freelancer excels in frontend (React, OAuth) and can handle backend. Consider pairing with a DevOps specialist or include AWS training in timeline.</p>
      </div>

      {/* Experience Summary */}
      <div className="flex gap-4 text-sm">
        <div className="flex-1">
          <p className="text-gray-400 mb-1">Freelancer Experience</p>
          <p className="text-white font-semibold">5+ years full-stack</p>
        </div>
        <div className="flex-1">
          <p className="text-gray-400 mb-1">Project Complexity</p>
          <p className="text-white font-semibold">Advanced</p>
        </div>
        <div className="flex-1">
          <p className="text-gray-400 mb-1">Recommended Action</p>
          <button className="text-purple-400 hover:text-purple-300 font-semibold text-sm">
            Send Offer →
          </button>
        </div>
      </div>
    </div>
  );
}
