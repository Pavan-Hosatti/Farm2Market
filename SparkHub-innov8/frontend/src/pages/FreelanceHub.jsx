import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, FileText, CheckCircle, AlertCircle, Zap,
  Settings, Eye, Send, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import DocumentUpload from '../components/DocumentUpload';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function FreelanceHub() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState('project-info'); // project-info → documents → review → publish
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    skillsRequired: [],
    budgetMin: '',
    budgetMax: '',
    timeline: '',
    scope: ''
  });
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  // Step 1: Project Information
  const handleProjectInput = (e) => {
    const { name, value } = e.target;
    setProjectData(prev => ({ ...prev, [name]: value }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !projectData.skillsRequired.includes(skillInput)) {
      setProjectData(prev => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, skillInput]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setProjectData(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter(s => s !== skill)
    }));
  };

  const handleDocumentsUpdated = (doc) => {
    setUploadedDocs(prev => {
      const existing = prev.find(d => doc.id === d.id);
      if (existing) {
        return prev.map(d => d.id === doc.id ? doc : d);
      }
      return [...prev, doc];
    });
  };

  // Step 3: Pre-Publish Gap Detection (Phase 6 preview)
  const [gapCheckResults, setGapCheckResults] = useState(null);
  const [showingGaps, setShowingGaps] = useState(false);

  const mockGapDetection = () => {
    // Simulate AI gap detection
    const gaps = [];
    if (!projectData.budgetMax) gaps.push({
      category: 'Budget',
      issue: 'No maximum budget specified',
      severity: 'high',
      suggestion: 'Add a budget range to attract qualified freelancers'
    });
    if (!projectData.timeline) gaps.push({
      category: 'Timeline',
      issue: 'No project timeline specified',
      severity: 'high',
      suggestion: 'Specify expected completion duration'
    });
    if (projectData.skillsRequired.length === 0) gaps.push({
      category: 'Skills',
      issue: 'No required skills listed',
      severity: 'medium',
      suggestion: 'List key skills needed for this project'
    });
    if (projectData.description.length < 100) gaps.push({
      category: 'Description',
      issue: 'Project description is too brief',
      severity: 'medium',
      suggestion: 'Provide more details about project scope and requirements'
    });
    if (uploadedDocs.filter(d => d.status === 'completed').length === 0) gaps.push({
      category: 'Documents',
      issue: 'No project documents uploaded',
      severity: 'low',
      suggestion: 'Upload reference documents for better understanding'
    });

    const overallGapScore = Math.min(100, gaps.length * 20);
    const readyToPublish = gaps.filter(g => g.severity === 'high').length === 0;

    setGapCheckResults({
      gaps,
      overallGapScore: 100 - overallGapScore,
      readyToPublish,
      analyzedAt: new Date()
    });
    setShowingGaps(true);
  };

  const handlePublish = async () => {
    if (!gapCheckResults?.readyToPublish) {
      toast.error('Please fix critical gaps before publishing');
      return;
    }

    setIsSubmitting(true);
    try {
      // Mock publish
      setTimeout(() => {
        toast.success('✅ Project published! Freelancers can now bid on it.');
        navigate('/freelancer-dashboard');
      }, 1500);
    } catch (error) {
      toast.error('Failed to publish project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedStep1 = projectData.title && projectData.description && projectData.budgetMin && projectData.budgetMax;
  const completedDocs = uploadedDocs.filter(d => d.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-purple-500/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-purple-400" />
            Create & Publish Project
          </h1>
          <p className="text-gray-400 mt-2">Post your project and get bids from qualified freelancers</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {['project-info', 'documents', 'review'].map((step, idx) => (
              <React.Fragment key={step}>
                <motion.button
                  onClick={() => setCurrentStep(step)}
                  className={`flex flex-col items-center transition-all ${
                    currentStep === step ? 'scale-110' : 'scale-100'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 font-bold transition-all ${
                      currentStep === step
                        ? 'bg-purple-500 border-purple-400 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {step === 'project-info' && 'Project Info'}
                    {step === 'documents' && 'Documents'}
                    {step === 'review' && 'Review & Publish'}
                  </p>
                </motion.button>

                {idx < 2 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded transition-all ${
                      currentStep !== 'project-info' && idx === 0
                        ? 'bg-purple-500'
                        : 'bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Project Information */}
        {currentStep === 'project-info' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-lg p-8 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-white font-medium mb-2">Project Title *</label>
                <input
                  type="text"
                  name="title"
                  value={projectData.title}
                  onChange={handleProjectInput}
                  placeholder="e.g., Build E-commerce Website"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-white font-medium mb-2">Project Description *</label>
                <textarea
                  name="description"
                  value={projectData.description}
                  onChange={handleProjectInput}
                  placeholder="Describe your project in detail. Include objectives, requirements, and context..."
                  rows="5"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none resize-none"
                />
                <p className="text-sm text-gray-400 mt-2">Minimum 50 characters recommended for gap detection</p>
              </div>

              {/* Scope */}
              <div>
                <label className="block text-white font-medium mb-2">Project Scope</label>
                <textarea
                  name="scope"
                  value={projectData.scope}
                  onChange={handleProjectInput}
                  placeholder="What's included in this project? What's out of scope?"
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none resize-none"
                />
              </div>

              {/* Budget */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Budget Min ($) *</label>
                  <input
                    type="number"
                    name="budgetMin"
                    value={projectData.budgetMin}
                    onChange={handleProjectInput}
                    placeholder="1000"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Budget Max ($) *</label>
                  <input
                    type="number"
                    name="budgetMax"
                    value={projectData.budgetMax}
                    onChange={handleProjectInput}
                    placeholder="5000"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Timeline */}
              <div>
                <label className="block text-white font-medium mb-2">Timeline *</label>
                <select
                  name="timeline"
                  value={projectData.timeline}
                  onChange={handleProjectInput}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                >
                  <option value="">Select timeline</option>
                  <option value="1-2 weeks">1-2 weeks</option>
                  <option value="1 month">1 month</option>
                  <option value="2-3 months">2-3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6+ months">6+ months</option>
                </select>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-white font-medium mb-2">Required Skills</label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    placeholder="e.g., React, Node.js, MongoDB"
                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Skills Tags */}
                {projectData.skillsRequired.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {projectData.skillsRequired.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded-full text-sm flex items-center gap-2"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="hover:text-purple-100 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => setCurrentStep('documents')}
                disabled={!canProceedStep1}
                className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
              >
                Next: Upload Documents →
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Document Upload */}
        {currentStep === 'documents' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-lg p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                  <FileText className="w-6 h-6 text-purple-400" />
                  Upload Project Documents
                </h2>
                <p className="text-gray-400 text-sm">
                  Attach reference materials, design files, requirements documents, etc. These will be indexed for RAG-based Q&A in Phase 4.
                </p>
              </div>

              <DocumentUpload projectId="new" onDocumentsUpdated={handleDocumentsUpdated} />
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep('project-info')}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep('review')}
                className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
              >
                Next: Review → {completedDocs > 0 && `(${completedDocs} docs)`}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review & Gap Detection */}
        {currentStep === 'review' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Project Summary */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-lg p-8 space-y-4">
              <h2 className="text-xl font-bold text-white">Project Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Title</p>
                  <p className="text-white font-semibold">{projectData.title}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Budget Range</p>
                  <p className="text-white font-semibold">
                    ${projectData.budgetMin} - ${projectData.budgetMax}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Timeline</p>
                  <p className="text-white font-semibold">{projectData.timeline}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Documents</p>
                  <p className="text-white font-semibold">{completedDocs} uploaded & indexed</p>
                </div>
              </div>
            </div>

            {/* Gap Detection */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-purple-500/30 rounded-lg p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                AI Gap Detection (Phase 6 Preview)
              </h2>
              <p className="text-gray-400 text-sm">
                Before publishing, the AI analyzes your project for ambiguities and missing information that could confuse freelancers.
              </p>

              {!showingGaps ? (
                <button
                  onClick={mockGapDetection}
                  className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                >
                  Run Gap Detection
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Score */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Project Clarity Score</span>
                      <span className="text-2xl font-bold text-white">{gapCheckResults.overallGapScore}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          gapCheckResults.overallGapScore >= 80
                            ? 'bg-green-500'
                            : gapCheckResults.overallGapScore >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        initial={{ width: '0%' }}
                        animate={{ width: `${gapCheckResults.overallGapScore}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      {gapCheckResults.readyToPublish
                        ? '✅ Ready to publish! No critical gaps detected.'
                        : '⚠️ Fix critical gaps before publishing'}
                    </p>
                  </div>

                  {/* Gaps List */}
                  {gapCheckResults.gaps.length > 0 && (
                    <div className="space-y-2">
                      {gapCheckResults.gaps.map((gap, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border ${
                            gap.severity === 'high'
                              ? 'bg-red-500/10 border-red-500/30'
                              : gap.severity === 'medium'
                              ? 'bg-yellow-500/10 border-yellow-500/30'
                              : 'bg-blue-500/10 border-blue-500/30'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {gap.severity === 'high' ? (
                              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="font-semibold text-white">{gap.category}: {gap.issue}</p>
                              <p className="text-sm text-gray-300 mt-1">💡 {gap.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {gapCheckResults.gaps.length === 0 && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-300 font-medium">✅ No gaps detected! Your project is well-defined.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep('documents')}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handlePublish}
                disabled={!gapCheckResults?.readyToPublish || isSubmitting}
                className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? '🔄 Publishing...' : '🚀 Publish Project'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
