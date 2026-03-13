import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Briefcase, DollarSign, Clock, Users, Star, MessageSquare,
  FileText, Zap, TrendingUp, Search, Filter, Plus, MapPin,
  CheckCircle, AlertCircle, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidDescription, setBidDescription] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock projects for now (will be replaced with API call in Phase 2)
  const mockProjects = [
    {
      _id: 'proj_1',
      title: 'E-commerce Website Redesign',
      description: 'Redesign our aging e-commerce platform with modern UI/UX. Need expertise in React and Tailwind CSS.',
      clientName: 'TechStartup Inc',
      skillsRequired: ['React', 'Tailwind CSS', 'UI/UX', 'MongoDB'],
      budgetMin: 5000,
      budgetMax: 15000,
      timeline: '8 weeks',
      status: 'published',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      applicants: 12,
      scope: 'Complete redesign of existing platform with new features'
    },
    {
      _id: 'proj_2',
      title: 'Mobile App Backend API',
      description: 'Build scalable REST API for a fintech mobile application. Must handle high transaction volume.',
      clientName: 'FinanceApp Ltd',
      skillsRequired: ['Node.js', 'Express', 'PostgreSQL', 'AWS'],
      budgetMin: 8000,
      budgetMax: 20000,
      timeline: '12 weeks',
      status: 'published',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      applicants: 8,
      scope: 'Production-grade API with authentication, payment processing, and analytics'
    },
    {
      _id: 'proj_3',
      title: 'Data Analytics Dashboard',
      description: 'Create an interactive dashboard for business intelligence and data visualization.',
      clientName: 'DataCorp Solutions',
      skillsRequired: ['Python', 'Pandas', 'Plotly', 'JavaScript'],
      budgetMin: 3000,
      budgetMax: 8000,
      timeline: '4 weeks',
      status: 'published',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      applicants: 15,
      scope: 'Real-time analytics with drill-down capabilities and automated reporting'
    },
    {
      _id: 'proj_4',
      title: 'Blockchain Integration',
      description: 'Integrate blockchain for supply chain tracking in our logistics platform.',
      clientName: 'LogisHub Global',
      skillsRequired: ['Solidity', 'Web3.js', 'Smart Contracts', 'Algorand'],
      budgetMin: 15000,
      budgetMax: 30000,
      timeline: '16 weeks',
      status: 'published',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      applicants: 5,
      scope: 'End-to-end blockchain solution with smart contracts and token economics'
    }
  ];

  // Load projects (will be API call in future)
  useEffect(() => {
    setProjects(mockProjects);
  }, []);

  const handleSubmitBid = () => {
    if (!bidAmount || !bidDescription) {
      toast.error('Please fill in all bid details');
      return;
    }
    
    if (isNaN(bidAmount) || parseFloat(bidAmount) <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newBid = {
        projectId: selectedProject._id,
        projectTitle: selectedProject.title,
        bidAmount: parseFloat(bidAmount),
        description: bidDescription,
        submittedAt: new Date(),
        status: 'pending'
      };

      setMyBids([...myBids, newBid]);
      toast.success('Bid submitted successfully!');
      setShowBidForm(false);
      setBidAmount('');
      setBidDescription('');
      setIsLoading(false);
    }, 1000);
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.skillsRequired.some(skill => 
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-purple-500/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Briefcase className="w-8 h-8 text-purple-400" />
                Available Projects
              </h1>
              <p className="text-gray-400 mt-1">Find and bid on client projects matching your skills</p>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">{user?.name || 'Freelancer'}</p>
              <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Projects</p>
                <p className="text-2xl font-bold text-white mt-1">{projects.length}</p>
              </div>
              <Briefcase className="w-10 h-10 text-blue-400 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">My Bids</p>
                <p className="text-2xl font-bold text-white mt-1">{myBids.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Value</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${myBids.reduce((sum, bid) => sum + bid.bidAmount, 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-yellow-400 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Bid</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${myBids.length > 0 ? Math.round(myBids.reduce((sum, bid) => sum + bid.bidAmount, 0) / myBids.length) : 0}
                </p>
              </div>
              <Activity className="w-10 h-10 text-purple-400 opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700/50">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              activeTab === 'projects'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            Available Projects ({filteredProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              activeTab === 'bids'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <FileText className="w-5 h-5" />
            My Bids ({myBids.length})
          </button>
          <button
            onClick={() => setActiveTab('kb')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              activeTab === 'kb'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Knowledge Base Chat (Phase 4)
          </button>
        </div>

        {/* Content: Available Projects */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Search & Filter */}
            <div className="flex gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search projects by title, skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none"
                />
              </div>
              <button className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:border-purple-400 transition-colors flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter
              </button>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No projects match your search</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-lg p-6 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                        <p className="text-gray-400 mb-4">{project.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {project.applicants} applicants
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {project.timeline}
                          </span>
                          <span className="text-purple-400 font-semibold">
                            ${project.budgetMin.toLocaleString()} - ${project.budgetMax.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Skills Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.skillsRequired.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-medium rounded-lg border border-purple-500/30"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Client Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{project.clientName[0]}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{project.clientName}</p>
                          <p className="text-gray-500 text-xs">Client</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setShowBidForm(true);
                        }}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                      >
                        Submit Bid
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content: My Bids */}
        {activeTab === 'bids' && (
          <div>
            {myBids.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">You haven't submitted any bids yet</p>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                >
                  Browse Projects
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myBids.map((bid) => (
                  <motion.div
                    key={`${bid.projectId}-${bid.submittedAt}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{bid.projectTitle}</h3>
                        <p className="text-gray-400 mb-4">{bid.description}</p>
                        <div className="flex items-center gap-6 text-sm">
                          <span className="text-purple-400 font-semibold">
                            Bid: ${bid.bidAmount.toLocaleString()}
                          </span>
                          <span className="text-gray-500">
                            Submitted: {new Date(bid.submittedAt).toLocaleDateString()}
                          </span>
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            bid.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {bid.status === 'pending' ? 'Pending Review' : 'Accepted'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content: Knowledge Base Chat */}
        {activeTab === 'kb' && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Knowledge Base Chat Coming Soon</h3>
            <p className="text-gray-400">In Phase 4, you'll be able to ask questions about project briefs in multiple languages (text and voice)</p>
          </div>
        )}
      </div>

      {/* Bid Form Modal */}
      {showBidForm && selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-lg max-w-lg w-full p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Submit Bid: {selectedProject.title}
            </h2>

            <div className="space-y-6">
              {/* Budget Info */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <p className="text-gray-400 text-sm mb-2">Client Budget Range</p>
                <p className="text-white font-semibold">
                  ${selectedProject.budgetMin.toLocaleString()} - ${selectedProject.budgetMax.toLocaleString()}
                </p>
              </div>

              {/* Bid Amount */}
              <div>
                <label className="block text-white font-medium mb-2">Your Bid Amount ($)</label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter your bid amount"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none"
                />
              </div>

              {/* Bid Description */}
              <div>
                <label className="block text-white font-medium mb-2">Proposal Description</label>
                <textarea
                  value={bidDescription}
                  onChange={(e) => setBidDescription(e.target.value)}
                  placeholder="Explain your approach, experience, and why you're a good fit for this project..."
                  rows="6"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleSubmitBid}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Submitting...' : 'Submit Bid'}
                </button>
                <button
                  onClick={() => {
                    setShowBidForm(false);
                    setBidAmount('');
                    setBidDescription('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-800 border border-gray-700 hover:border-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
