🌾 Project: Farm2Market – AI-Driven Farmer–Customer Marketplace
🔍 Problem Statement

Farmers lose profit due to middlemen and lack of market visibility. Grading produce manually is slow and inconsistent.
Farm2Market solves this by connecting farmers directly with customers (like hotels, wholesalers, or individual buyers) through a bidding platform. AI automatically grades the produce from uploaded videos, ensuring fair pricing.

🧩 System Overview
Microservices Architecture (3-tier deployment)
Service	Stack	Hosted On	Function
Frontend	React + Vite + TailwindCSS + Firebase	Vercel	Farmer & Customer UI, Upload videos, Live bidding
Backend	Node.js + Express + MongoDB + JWT	Render / Railway	Handles API routing, auth, communication between UI & ML model
ML Model Service	Flask + YOLOv8 + OpenCV	Render	Receives crop videos, extracts frames, classifies quality asynchronously
⚙️ Tech Stack

Frontend: React 19, Vite, Zustand, React Router, Framer Motion, GSAP, TailwindCSS, i18next (multilingual support)

Backend: Node.js, Express, MongoDB, Mongoose, Multer, JWT Auth, Axios

ML Model: Flask, YOLOv8 (Ultralytics), OpenCV, Python threading, Flask-CORS, Gunicorn

AI Voice Assistant:

Speech-to-Text: Google Gemini API (supports Kannada)

Text Translation & Text-to-Speech: Google Translate API

Multilingual UI: React i18next for Kannada/English toggle

🧠 AI / ML Pipeline

Farmer uploads a crop video (e.g., tomato).

Backend sends the video to Flask ML Service.

Flask splits the video into frames using OpenCV.

YOLOv8 model predicts the quality grade (A/B/C) for each frame.

Result sent asynchronously back to backend using webhook callback (non-blocking).

Backend stores result in MongoDB and updates frontend UI.

✅ Asynchronous processing prevents frontend timeouts
✅ Real-time grading updates via webhook + polling
✅ Accurate inference trained on >10,000 labeled crop images

🧩 Voice & Language System (Kannada AI Integration)

Entire website can switch between Kannada and English instantly using react-i18next.

Integrated Kannada voice bot:

Listens to any natural Kannada speech (farmer input).

Converts it to text using Gemini API.

Processes command / query.

Replies back in Kannada voice + text, using Google Translate TTS.

Helps farmers interact with the platform without needing English or typing skills.

💡 Key Innovations

🌐 Multilingual AI Interface: Voice + Text support for Kannada users.

⚙️ Asynchronous AI Grading: Prevents server overload and request timeout.

🧠 YOLOv8 Grading: Efficient and accurate produce quality classification.

🔗 Modular Microservices: Each component independently deployed & scalable.

📊 Bidding & Transparency: Eliminates middlemen, increases farmer income.

🚀 Deployment Details
Component	Platform	Tech Used
Frontend	Vercel	React + Vite
Backend	Render / Railway	Node.js + Express
ML Model	Render	Flask + Gunicorn
Database	MongoDB Atlas	Cloud database
Storage	Firebase / Multer	Video uploads
🧩 Sample Python Requirements (requirements.txt)
flask
flask-cors
ultralytics
opencv-python-headless
gunicorn

🧩 Sample Frontend package.json (React + Vite)

(Already perfect — great stack!)

🧩 Sample Backend package.json (Node.js + Express)

(Also solid — you’ve covered all production dependencies)

🧠 Challenges You Solved

404, 502, 503, and 500 cross-service errors while connecting Flask and Node backend.

Render’s CPU limitations during YOLO inference (optimized threading + async).

CORS issues between Vercel → Render → MongoDB Atlas.

Model deployment failures due to .pt file incompatibility — resolved using correct YOLO export.

Debugging asynchronous callbacks and ensuring database persistence.

🌟 Final Impact

✅ Farmers can get AI-generated grading in minutes instead of hours.

✅ Farmers connect directly with verified buyers — more profit, less exploitation.

✅ Full Kannada support ensures accessibility to local communities.
