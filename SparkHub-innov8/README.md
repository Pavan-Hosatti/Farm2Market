🌾 Farm2Market — AI-Powered Farmer–Customer Marketplace
🚀 Revolutionizing Agriculture with AI, Voice, and Full-Stack Engineering

Farm2Market bridges the gap between farmers and buyers by integrating AI-powered crop grading, direct online bidding, and Kannada voice interaction — eliminating middlemen and ensuring fair prices.




🧠 System Overview

A fully asynchronous, production-grade ecosystem connecting farmers, AI models, and customers through cloud-deployed microservices.

Farmer (Video Upload)
     ↓
Frontend (React + Vite + Tailwind)
     ↓
Backend (Node.js + Express + MongoDB)
     ↓
ML Model (Flask + YOLOv8 + OpenCV)
     ↓
Backend (Webhook Callback)
     ↓
Frontend (Display Results & Bidding)



⚙️ Tech Stack
Layer	                                      Technology	                                                                  Purpose
Frontend	                  React 19, Vite, TailwindCSS, Zustand, Firebase, i18next	                          Modern responsive UI, multilingual support
Backend	                  Node.js, Express, MongoDB Atlas, JWT, Multer, Axios                            	Auth, routing, video upload, async communication
ML Model	                 Flask, YOLOv8 (Ultralytics), OpenCV, Python threading	                               AI grading of crop videos
AI Voice Bot	             Gemini API (Speech-to-Text), Google Translate (TTS)	                                 Kannada voice input + audio response
Deployment	             Vercel, Render, Railway, MongoDB Atlas Cloud-hosted microservices




🔍 Features

✅ AI-Based Crop Grading — Farmers upload videos; YOLOv8 classifies crop quality (A/B/C).
✅ Asynchronous Processing — Backend and model communicate via webhooks to prevent timeouts.
✅ Kannada Voice Bot — Farmers can talk in Kannada and get replies in Kannada text and voice.
✅ Direct Bidding System — Buyers can bid live on graded produce.
✅ Cloud-Native Design — Each service deployed independently (scalable, modular).
✅ Multilingual UI — Built with react-i18next for seamless language toggling.




🧩 System Architecture
graph LR
A[Frontend - React/Vite] -->|Video Upload| B[Backend - Express/MongoDB]
B -->|Send to| C[ML Model - Flask/YOLOv8]
C -->|Async Callback| B
B -->|Result →| A
A -->|Voice Input/Output| D[Gemini + Google TTS]



📦 Folder Structure
Farm2Market/
│
├── web-app/         # React + Vite + Tailwind + i18next
├── platform-api/    # Node.js + Express + MongoDB
└── ML/              # Flask + YOLOv8 + OpenCV + Gunicorn




🔧 Installation
1️⃣ Clone the Repository
git clone https://github.com/farm2market/farm2market.git
cd farm2market



2️⃣ Frontend Setup
cd web-app
npm install
npm run dev



3️⃣ Backend Setup
cd platform-api
npm install
npm run start



4️⃣ ML Model Setup
cd ML
pip install -r requirements.txt
python app.py



📊 Requirements (ML Service)
flask
flask-cors
ultralytics
opencv-python-headless
gunicorn



🌐 Deployment
Service	Platform	URL
Frontend	Vercel	farm2-market-ashen.vercel.app

Backend	Render 	https://farm2market-api.onrender.com/

ML Model	Render https://farm2market-ml.onrender.com/api/ml/health



Database	MongoDB Atlas	Cloud-hosted
🎙️ Kannada Voice AI

🎧 Speech-to-Text: Gemini API
🗣️ Text-to-Speech: Google Translate
🌍 Multilingual UI: React i18next



Farmers can talk to the bot in Kannada — it understands, processes, and replies naturally in Kannada voice.

🧩 Challenges Solved

404 / 502 / 503 cross-service issues during deployment

Timeout errors from long-running model inference

YOLOv8 .pt file integration in cloud environment

Ensuring async communication via webhook callbacks

CORS configuration across multiple domains



🌟 Impact

🌾 Empowers Farmers — transparent pricing, higher profits.

🤖 AI for Agriculture — automated, unbiased grading.

🗣️ Inclusive Access — Kannada voice interaction for ease of use.

☁️ Scalable Cloud System — modular deployment for each service.


👨‍💻 Author

Pavan Hosatti
🎓 ISE @ CIT Bangalore
🚀 Passionate about Full Stack + AI + Cloud


🏁 Summary

Farm2Market proves how full-stack engineering, machine learning, and accessible design can converge to solve real-world agricultural problems — bridging technology and community impact.
