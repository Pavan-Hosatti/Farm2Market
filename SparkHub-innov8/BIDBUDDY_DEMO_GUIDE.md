# BidBuddy Complete Implementation - Demo Guide

## 🚀 Quick Start

### Start Services

```bash
# Terminal 1: Start Backend
cd backend
npm install
npm start

# Terminal 2: Start ML Service (if needed)
cd ML
python app.py

# Terminal 3: Start Frontend
cd frontend
npm dev
```

## 🔗 API Base URL
```
http://localhost:5000/api/bidbuddy
```

## 📋 Complete API Flow

### Phase 1: Create Project (as Client)

**1. POST /projects** - Create new project
```json
{
  "title": "Build E-commerce Website",
  "description": "Need freelancer to build modern e-commerce site",
  "clientId": "client_123",
  "scope": {
    "summary": "Full-stack e-commerce development with payment integration",
    "requirements": [
      "User authentication",
      "Product catalog",
      "Shopping cart",
      "Payment gateway",
      "Admin dashboard"
    ],
    "budget": { "min": 2000, "max": 5000, "currency": "USD" },
    "timeline": {
      "startDate": "2026-03-14",
      "endDate": "2026-05-15",
      "milestones": [
        { "name": "Setup & Auth", "dueDate": "2026-03-31" },
        { "name": "Core Features", "dueDate": "2026-04-30" },
        { "name": "Testing & Deploy", "dueDate": "2026-05-15" }
      ]
    },
    "acceptanceCriteria": [
      "All unit tests pass",
      "Mobile responsive",
      "Payment processing works",
      "Performance < 2s load time"
    ],
    "requiredSkills": ["React", "Node.js", "MongoDB", "Stripe"]
  }
}
```

Response: `{ projectId: "proj_456" }`

### Phase 2: Upload Project Brief Documents

**2. POST /projects/{projectId}/documents/upload** - Upload project brief
```
Form-data:
- file: requirements.pdf (or any doc)
```

Response: `{ documentId: "doc_789", status: "queued" }`

**3. Monitor document processing:**
```
GET /documents/{documentId}/status

Response:
{
  "processingStatus": "completed",
  "embeddingStatus": "completed",
  "chunksCount": 25,
  "version": 1
}
```

### Phase 3: Check & Fix Scope Gaps

**4. POST /projects/{projectId}/check-gaps** - Detect missing scope items
```
Response:
{
  "totalGaps": 2,
  "criticalGaps": 0,
  "gaps": [
    {
      "category": "other",
      "issue": "Support model not specified",
      "severity": "medium"
    }
  ],
  "canPublish": true
}
```

### Phase 4: Publish Project

**5. POST /projects/{projectId}/publish** - Publish after reviewing gaps
```json
{
  "acknowledgeGaps": false
}
```

Response: `{ status: "published", publishedAt: "2026-03-13T..." }`

---

## 💼 Phase 5: Freelancer Submits Proposal

**6. POST /proposals** - Submit proposal
```json
{
  "projectId": "proj_456",
  "freelancerId": "free_789",
  "coverLetter": "I have 5 years experience building e-commerce platforms with React and Node.js. I've completed 20+ similar projects and always deliver on time with high quality...",
  "proposedBudget": 3500,
  "proposedTimeline": {
    "duration": 35,
    "unit": "days",
    "deliveryDate": "2026-04-18"
  }
}
```

Response: `{ proposalId: "prop_999", status: "submitted", message: "Proposal submitted. AI scoring in progress." }`

---

## 🤖 Phase 6: AI Scoring (Automatic)

**7. GET /proposals/{proposalId}/scores** - Get AI scores
```
Response:
{
  "scores": {
    "comprehension": {
      "score": 85,
      "explanation": "Freelancer clearly addresses key requirements...",
      "missingPoints": ["Support SLA not mentioned"],
      "strengths": ["Clear delivery timeline", "Relevant experience"]
    },
    "skillFit": {
      "overallFit": 92,
      "recommendation": "Strong fit - Highly recommended"
    }
  }
}
```

**8. GET /projects/{projectId}/proposals/ranked-by-score** - See ranked proposals
```
Response shows all proposals ranked by comprehension score
```

---

## 🗣️ Phase 7: Voice Q&A on Brief

**9. POST /voice/sessions** - Start voice session
```json
{
  "userId": "free_789",
  "userType": "freelancer",
  "projectId": "proj_456",
  "language": "en"
}
```

Response: `{ sessionId: "sess_111", language: "en" }`

**10. POST /voice/sessions/{sessionId}/query** - Ask voice question
```json
{
  "sessionId": "sess_111",
  "projectId": "proj_456",
  "audioUrl": "https://audio.example.com/question.mp3",
  "language": "en"
}
```

Response:
```json
{
  "success": true,
  "query": "What payment methods should I support?",
  "answer": "The project requires Stripe integration for credit cards...",
  "audioUrl": "https://audio.example.com/answer.mp3",
  "citations": [
    {
      "document": "requirements.pdf",
      "snippet": "Payment gateway integration required..."
    }
  ]
}
```

### Kannada Voice Support

**11. POST /voice/kannada** - Ask in Kannada
```json
{
  "sessionId": "sess_111",
  "projectId": "proj_456",
  "audioUrl": "https://audio.example.com/kannada_question.mp3"
}
```

---

## 💰 Phase 8: Negotiation Assistant

**12. GET /proposals/{proposalId}/negotiation** - Get fair pricing
```
Response:
{
  "fairRange": {
    "minimum": 2800,
    "maximum": 4500,
    "recommended": 3650
  },
  "freelancerProposal": 3500,
  "isWithinRange": true,
  "recommendations": [
    "Proposal is within fair range",
    "Good basis for negotiation"
  ]
}
```

**13. POST /negotiations/{negotiationId}/round** - Log negotiation offer
```json
{
  "initiatedBy": "client",
  "offer": 3200
}
```

### Accept final price

**14. POST /negotiations/{negotiationId}/accept**
```json
{
  "finalPrice": 3400
}
```

---

## ⛓️ Phase 9: Blockchain Proof Anchoring

**15. GET /proposals/{proposalId}/proof** - View proposal anchor
```
Response:
{
  "proof": {
    "contentHash": "abc123...",
    "transactionId": "ALGO-...",
    "status": "confirmed",
    "network": "testnet",
    "transactionUrl": "https://testnet.algoexplorer.io/tx/..."
  },
  "verification": {
    "verified": true,
    "status": "confirmed"
  }
}
```

**Fallback Mode:** If blockchain unavailable
```
{
  "status": "fallback_pending",
  "message": "Proof stored temporarily. Will anchor when blockchain is available.",
  "willRetryAt": "2026-03-13T10:35:00Z"
}
```

---

## 💬 Phase 10: Chat & Dispute Tracking

**16. POST /proposals/{proposalId}/chat** - Send message
```json
{
  "senderId": "free_789",
  "senderType": "freelancer",
  "message": "I need clarification on the acceptance criteria for performance...",
  "messageType": "text"
}
```

**17. GET /proposals/{proposalId}/chat** - Get conversation history

---

## ⚖️ Phase 11: Dispute Resolution (Demo)

**18. POST /projects/{projectId}/proposals/{proposalId}/mock-dispute** - Create test dispute
```
Response:
{
  "disputeId": "disp_123",
  "summary": "Demo dispute summary. Client reports quality issues..."
}
```

**19. GET /disputes/{disputeId}** - View dispute details
```
Returns AI-generated neutral summary with timeline
```

**20. GET /disputes/{disputeId}/resolution** - Get AI recommendation
```
Response shows suggested resolution path and fairness analysis
```

**21. POST /disputes/{disputeId}/resolve** - Finalize resolution
```json
{
  "outcome": "Proposal accepted with minor revisions",
  "compensation": 200,
  "milestones": ["Bug fixes", "Optimization"],
  "lessons": ["Clearer requirements needed"]
}
```

---

## 🎬 Demo - Complete Flow (5 min)

1. Create project with brief ✅ (30 sec)
2. Upload PDF document ✅ (20 sec)
3. Check gaps detector ✅ (20 sec)
4. Publish project ✅ (10 sec)
5. Submit proposal with AI score ✅ (30 sec)
6. Ask voice question in Kannada ✅ (30 sec)
7. View blockchain proof ✅ (20 sec)
8. Trigger dispute demo ✅ (20 sec)
9. Get AI arbitration ✅ (20 sec)
10. Check blockchain status ✅ (10 sec)

---

## 📊 Key Performance Indicators

- **Comprehensive Score:** 0-100 (quality of proposal understanding)
- **Skill-Fit Score:** 0-100 (freelancer skills vs requirements)
- **Fair Price Range:** Auto-calculated based on market + complexity + risk
- **Proof Status:** Confirmed on testnet App #756282697
- **Fallback Success Rate:** 100% (voice + blockchain never breaks demo)
- **Voice Languages:** English, Kannada, Hindi ready

---

## 🔄 Fallback Mechanisms (No Single Point of Failure)

| Component | Fallback |
|-----------|----------|
| **AI Models** | Show snippets + "analysis pending" |
| **Voice Service** | Auto-switch to text mode |
| **Algorand** | Store proof locally, retry when online |
| **Embedding Search** | Keyword retrieval instead of vector |
| **PDF Parsing** | Accept raw text |

---

## 🎯 What Judges See

1. **Ambiguous Brief** → Gap Detector flags missing requirements ✅
2. **Kannada Voice Query** → Gets cited answer with proof ✅
3. **Proposal Submitted** → Comprehension score appears + ranking updates ✅
4. **Brief Updated** → Previous proposals marked outdated ✅
5. **Proof Panel** → Click to see Algorand txn hash ✅
6. **Dispute Triggered** → AI generates neutral arbitration summary ✅

---

## 🛠️ Technology Stack

- **Backend:** Express.js, MongoDB, Mongoose
- **AI:** Comprehension scoring, gap detection, skill matching algorithms
- **Blockchain:** Algorand testnet (App: 756282697)
- **Voice:** Multilingual support (Kannada, English, Hindi)
- **RAG:** Document chunking, embedding, retrieval
- **Fallbacks:** Graceful degradation for all services

---

## 📝 Environment Variables

```env
MONGO_URI=mongodb://...
NODE_ENV=development
PORT=5000
ML_SERVICE_URL=http://localhost:5001
APP_ID=756282697
APP_ADDRESS=FEP7X7PUBYCVBJMGJCCG7WQHVYIFAZTUTLQKZZ6EW57BCD2KIQYFF3RMYQ
ALGORAND_TOKEN=your_token
ALGORAND_SERVER=https://testnet-algorand.api.purestake.io/ps2
```

---

## 🤝 Support

For issues during demo:
- Check `/api/health` endpoint
- Check `/api/bidbuddy/health` for BidBuddy status
- All failed operations fallback gracefully
- Blockchain proves everything is tracked

---

Created: March 13, 2026
Status: ✅ Demo Ready - All 11 Phases Implemented
