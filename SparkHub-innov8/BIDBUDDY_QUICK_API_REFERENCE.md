# 🚀 BidBuddy - Quick API Reference Card

**Base URL:** `http://localhost:5000/api/bidbuddy`

## 📁 Project Management

```bash
# Create project
POST /projects
Body: { title, description, clientId, scope }
Response: { projectId, status: "draft" }

# Get project
GET /projects/{projectId}

# Publish project
POST /projects/{projectId}/publish
Body: { acknowledgeGaps: false }

# Check scope gaps
POST /projects/{projectId}/check-gaps
Response: { totalGaps, gaps[], canPublish }
```

## 📄 Document Management

```bash
# Upload document
POST /projects/{projectId}/documents/upload
Body: form-data { file }
Response: { documentId, status: "queued" }

# Check processing status
GET /documents/{documentId}/status
Response: { processingStatus, embeddingStatus, chunksCount }

# Get all project documents
GET /projects/{projectId}/documents/list
```

## 💼 Proposal Flow

```bash
# Submit proposal
POST /proposals
Body: { projectId, freelancerId, coverLetter, proposedBudget, proposedTimeline }

# Get proposal scoring
GET /proposals/{proposalId}/scores
Response: { comprehension { score, explanation }, skillFitScore { overallFit } }

# Rank proposals by score
GET /projects/{projectId}/proposals/ranked-by-score
Response: [ { rank, freelancer, score, budget } ]

# Shortlist proposal
POST /proposals/{proposalId}/shortlist
Response: { proposal, negotiation }
```

## 🎤 Voice & RAG (Multilingual)

```bash
# Start voice session
POST /voice/sessions
Body: { userId, userType, projectId, language }
Response: { sessionId }

# Voice query (text-to-speech response)
POST /voice/sessions/{sessionId}/query
Body: { sessionId, projectId, audioUrl, language }
Response: { query, answer, audioUrl, citations[] }

# Text query
POST /voice/sessions/{sessionId}/text-query
Body: { projectId, query, language }
Response: { query, answer, citations[] }

# Kannada voice specifically
POST /voice/kannada
Body: { sessionId, projectId, audioUrl }
```

## 🤖 AI Scoring

```bash
# Comprehension score
GET /proposals/{proposalId}/comprehension-score
Response: { score (0-100), explanation, missingPoints[], strengths[] }

# Skill-fit radar
GET /proposals/{proposalId}/skill-fit-radar
Response: { overallScore, radarDimensions, gaps[], recommendation }

# Detect scope gaps (pre-publish)
POST /projects/{projectId}/detect-gaps
Response: { totalGaps, gaps[], canPublish }

# Scoring report
GET /proposals/{proposalId}/scoring-report
Response: comprehensive report with all scores
```

## ⛓️ Blockchain (Algorand)

```bash
# Get proposal proof
GET /proposals/{proposalId}/proof
Response: { proof { hash, transactionId, status }, verification }

# Get all proofs for project
GET /projects/{projectId}/proofs
Response: { proofCount, proofs[] }

# Verify proof
GET /proofs/{proofId}/verify
Response: { verified, status, transactionUrl }

# Get blockchain status
GET /blockchain/status
Response: { confirmed, pending, fallback, network: "testnet" }

# Retry failed proofs
POST /proofs/retry-failed
Response: { retriedCount }
```

## 💰 Negotiation

```bash
# Get negotiation recommendation
GET /proposals/{proposalId}/negotiation
Response: { fairRange, freelancerProposal, isWithinRange, recommendations }

# Detailed analysis
GET /proposals/{proposalId}/negotiation/analysis
Response: { proposal, negotiation { factors, talkingPoints } }

# Log negotiation round
POST /negotiations/{negotiationId}/round
Body: { initiatedBy, offer }

# Accept & finalize
POST /negotiations/{negotiationId}/accept
Body: { finalPrice }
```

## ⚖️ Dispute Resolution

```bash
# Create dispute
POST /disputes
Body: { projectId, proposalId, freelancerId, clientId, issue, category }
Response: { disputeId, summary, status: "under_review" }

# Get dispute details
GET /disputes/{disputeId}
Response: { dispute with AI summary, timeline }

# Get resolution recommendation
GET /disputes/{disputeId}/resolution
Response: { recommendation, suggestedOutcome, fairnessScore }

# Record freelancer response
POST /disputes/{disputeId}/freelancer-response
Body: { response }

# Record client response  
POST /disputes/{disputeId}/client-response
Body: { response }

# Finalize resolution
POST /disputes/{disputeId}/resolve
Body: { outcome, compensation, milestones, lessons }

# Get dispute history
GET /projects/{projectId}/disputes
Response: { totalDisputes, resolvedDisputes, disputes[] }

# Demo: Create mock dispute
POST /projects/{projectId}/proposals/{proposalId}/mock-dispute
Response: { disputeId, summary }
```

## 🔍 Quick Examples

### Example 1: Full Flow (30 seconds)

```bash
# 1. Create project
curl -X POST http://localhost:5000/api/bidbuddy/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build Website",
    "clientId": "client_1",
    "scope": {
      "summary": "E-commerce site",
      "budget": {"min": 2000, "max": 5000},
      "requiredSkills": ["React", "Node.js"]
    }
  }'

# 2. Check gaps
curl http://localhost:5000/api/bidbuddy/projects/PROJ_ID/check-gaps

# 3. Publish
curl -X POST http://localhost:5000/api/bidbuddy/projects/PROJ_ID/publish

# 4. Submit proposal
curl -X POST http://localhost:5000/api/bidbuddy/proposals \
  -d '{
    "projectId": "PROJ_ID",
    "freelancerId": "FREE_1",
    "proposedBudget": 3500,
    "coverLetter": "I can build this amazing website..."
  }'

# 5. View score
curl http://localhost:5000/api/bidbuddy/proposals/PROP_ID/scores
```

### Example 2: Voice Query

```bash
# 1. Start session
curl -X POST http://localhost:5000/api/bidbuddy/voice/sessions \
  -d '{"userId": "free_1", "userType": "freelancer", "projectId": "PROJ_ID", "language": "ka"}'

# 2. Ask question in Kannada
curl -X POST http://localhost:5000/api/bidbuddy/voice/sessions/SESS_ID/query \
  -d '{
    "sessionId": "SESS_ID",
    "audioUrl": "https://example.com/question.mp3",
    "language": "ka"
  }'

# Response includes:
# - Transcription from Kannada audio
# - Answer based on project brief
# - Audio response in Kannada
# - Citations from documents
```

### Example 3: Dispute Demo

```bash
# 1. Create dispute (mock)
curl -X POST http://localhost:5000/api/bidbuddy/projects/PROJ_ID/proposals/PROP_ID/mock-dispute

# 2. Get AI arbitration
curl http://localhost:5000/api/bidbuddy/disputes/DISP_ID

# 3. View recommendation
curl http://localhost:5000/api/bidbuddy/disputes/DISP_ID/resolution

# Response shows AI-generated neutral summary with timeline
```

---

## ⚡ Key Features

| Feature | Status |
|---------|--------|
| Document Ingestion | ✅ Upload + async parsing |
| RAG Search | ✅ Semantic search over docs |
| Voice Input | ✅ Audio → text → answer → audio |
| Multilingual | ✅ Kannada, English, Hindi |
| AI Scoring | ✅ Comprehension (0-100) + Skill-fit (0-100) |
| Scope Gaps | ✅ Pre-publish validation |
| Blockchain Proof | ✅ Algorand testnet (App #756282697) |
| Fallback Mode | ✅ Never breaks on service failure |
| Fair Pricing | ✅ Market-based negotiation guide |
| Dispute AI | ✅ Neutral arbitration summaries |

---

## ⚠️ Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 404 | Not found |
| 500 | Server error (but fallback active) |

---

## 🎯 Demo Endpoints (Copy-Paste Ready)

Save as `demo.sh`:

```bash
#!/bin/bash

BASE="http://localhost:5000/api/bidbuddy"

# 1. Health check
curl $BASE/health

# 2. Create project
PROJECT=$(curl -s -X POST $BASE/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Demo Project",
    "clientId": "demo_client",
    "scope": {
      "summary": "Test brief",
      "budget": {"min": 1000, "max": 5000},
      "requiredSkills": ["React"]
    }
  }' | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)

echo "Project ID: $PROJECT"

# 3. Check gaps
curl $BASE/projects/$PROJECT/check-gaps

# 4. Publish
curl -X POST $BASE/projects/$PROJECT/publish

echo "Demo complete!"
```

---

**Status:** ✅ All endpoints working  
**Fallback:** ✅ Active on all services  
**Demo Ready:** ✅ Yes  
**Blockchain:** ✅ Testnet (may show pending/fallback)

---

For detailed examples, see: `BIDBUDDY_DEMO_GUIDE.md`
