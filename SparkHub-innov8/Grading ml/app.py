from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import numpy as np
from ultralytics import YOLO
from datetime import datetime
import uuid
import threading
from collections import defaultdict
import requests

app = Flask(__name__)
CORS(app)

# ============================================
# CONFIGURATION
# ============================================
TEMP_FRAMES_FOLDER = 'temp_frames'
os.makedirs(TEMP_FRAMES_FOLDER, exist_ok=True)

MODEL_PATHS = {
    'tomato': 'runs/classify/tomato_grading6/weights/best.pt',
    # 'carrot': 'runs/classify/carrot_grading_v1/weights/best.pt',
    # 'guava': 'runs/classify/guava_grading_v1/weights/best.pt',
    # 'apple': 'runs/classify/apple_grading_v1/weights/best.pt',
}

# Load all models at startup
MODELS = {}
print("\n" + "="*50)
print("🚀 Loading ML Models...")
print("="*50)

for crop, path in MODEL_PATHS.items():
    if os.path.exists(path):
        MODELS[crop] = YOLO(path)
        print(f"✓ Loaded model for {crop}")
    else:
        print(f"✗ Model not found for {crop} at {path}")

print("="*50 + "\n")

GRADE_MAPPING = {0: 'A', 1: 'B', 2: 'C'}

# ============================================
# JOB STORAGE (In-Memory)
# ============================================
jobs = {}  # {job_id: {'status': 'pending/processing/completed/failed', 'result': {}, 'error': str}}

# ============================================
# HELPER FUNCTIONS
# ============================================

def extract_frames(video_path, sample_rate=30, max_frames=30):
    cap = cv2.VideoCapture(video_path)
    frames = []
    frame_count = 0
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_count % sample_rate == 0:
            frames.append(frame)
        
        frame_count += 1
        
        if len(frames) >= max_frames:
            break
    
    cap.release()
    print(f"📊 Extracted {len(frames)} frames from {total_frames} total frames")
    return frames


def predict_grade_from_frames(model, frames):
    grade_scores = {'A': [], 'B': [], 'C': []}
    
    print(f"🔍 Analyzing {len(frames)} frames...")
    
    for idx, frame in enumerate(frames):
        try:
            print(f"  Frame {idx+1}/{len(frames)}: Running inference...")
            
            # Run inference
            results = model(frame, verbose=False)
            
            if len(results) > 0:
                probs = results[0].probs
                
                if probs is not None and hasattr(probs, 'data'):
                    confidences = probs.data.cpu().numpy()
                    
                    for class_idx, confidence in enumerate(confidences):
                        grade = GRADE_MAPPING.get(class_idx, 'C')
                        grade_scores[grade].append(float(confidence) * 100)
                    
                    print(f"  ✅ Frame {idx+1}: Processed successfully")
                else:
                    print(f"  ⚠️ Frame {idx+1}: No probabilities found")
            else:
                print(f"  ⚠️ Frame {idx+1}: No results")
                
        except Exception as frame_error:
            print(f"  ❌ Frame {idx+1}: Error - {str(frame_error)}")
            continue
    
    # Calculate averages
    avg_scores = {}
    for grade in ['A', 'B', 'C']:
        if grade_scores[grade]:
            avg_scores[grade] = sum(grade_scores[grade]) / len(grade_scores[grade])
        else:
            avg_scores[grade] = 0.0
    
    print(f"📈 Average scores: A={avg_scores['A']:.2f}%, B={avg_scores['B']:.2f}%, C={avg_scores['C']:.2f}%")
    
    final_grade = max(avg_scores, key=avg_scores.get)
    final_confidence = avg_scores[final_grade]
    
    all_confidences = []
    for scores in grade_scores.values():
        all_confidences.extend(scores)
    
    overall_confidence = max(all_confidences) if all_confidences else 0
    
    return {
        'grade': final_grade,
        'confidence': round(final_confidence, 2),
        'overall_confidence': round(overall_confidence, 2),
        'grade_breakdown': {k: round(v, 2) for k, v in avg_scores.items()},
        'frames_analyzed': len(frames)
    }



def notify_backend(job_id, status, result=None, error=None):
    """Notify Node.js backend about grading completion"""
    BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:5000')
    WEBHOOK_URL = f"{BACKEND_URL}/api/crops/ml-webhook"
    
    try:
        payload = {
            'job_id': job_id,
            'status': status,
            'result': result,
            'error': error
        }
        
        print(f"📤 Notifying backend at {WEBHOOK_URL}")
        response = requests.post(WEBHOOK_URL, json=payload, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ Backend notified successfully for job {job_id}")
        else:
            print(f"⚠️ Backend notification failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Failed to notify backend: {str(e)}")



def process_video_async(job_id, video_path, crop_type):
    """
    Background processing function
    Updates job status as it processes
    """
    try:
        print(f"\n{'='*50}")
        print(f"🎬 Background Processing Job: {job_id}")
        print(f"🌾 Crop Type: {crop_type.upper()}")
        print(f"{'='*50}")
        
        jobs[job_id]['status'] = 'processing'
        
        frames = extract_frames(video_path, sample_rate=30, max_frames=30)
        
        if len(frames) == 0:
            jobs[job_id]['status'] = 'failed'
            jobs[job_id]['error'] = 'No frames could be extracted from video'
            notify_backend(job_id, 'failed', error='No frames extracted')  # 🆕 ADD THIS LINE
            return
        
        model = MODELS[crop_type]
        result = predict_grade_from_frames(model, frames)
        
        print(f"✅ Final Grade: {result['grade']} (Confidence: {result['confidence']}%)")
        print(f"{'='*50}\n")
        
        jobs[job_id]['status'] = 'completed'
        jobs[job_id]['result'] = {
            'success': True,
            'grade': result['grade'],
            'confidence': result['confidence'],
            'overall_confidence': result['overall_confidence'],
            'grade_breakdown': result['grade_breakdown'],
            'frames_analyzed': result['frames_analyzed']
        }
        
        # 🆕 ADD THIS LINE
        notify_backend(job_id, 'completed', result=jobs[job_id]['result'])
        
    except Exception as e:
        print(f"❌ Error in background processing: {str(e)}")
        import traceback
        traceback.print_exc()
        jobs[job_id]['status'] = 'failed'
        jobs[job_id]['error'] = str(e)
        notify_backend(job_id, 'failed', error=str(e))  # 🆕 ADD THIS LINE
    
    finally:
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
                print(f"🗑️ Cleaned up temp file: {video_path}")
        except Exception as cleanup_error:
            print(f"⚠️ Could not delete temp file: {cleanup_error}")
# ============================================
# API ENDPOINTS (NEW ASYNC PATTERN)
# ============================================

@app.route('/api/ml/submit', methods=['POST'])
def submit_job():
    """
    Submit a video for processing
    Returns job_id immediately
    """
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file uploaded'}), 400
        
        video_file = request.files['video']
        crop_type = request.form.get('cropType', 'tomato').lower()
        
        if video_file.filename == '':
            return jsonify({'error': 'No video file selected'}), 400
        
        if crop_type not in MODELS:
            return jsonify({'error': f'Model not available for crop: {crop_type}'}), 400
        
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # Save uploaded file temporarily
        temp_video_path = os.path.join(
            TEMP_FRAMES_FOLDER, 
            f'temp_{job_id}_{video_file.filename}'
        )
        video_file.save(temp_video_path)
        
        # Initialize job
        jobs[job_id] = {
            'status': 'pending',
            'result': None,
            'error': None,
            'created_at': datetime.now().isoformat()
        }
        
        # Start background processing
        thread = threading.Thread(
            target=process_video_async,
            args=(job_id, temp_video_path, crop_type)
        )
        thread.daemon = True
        thread.start()
        
        print(f"✅ Job {job_id} submitted for processing")
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'message': 'Video submitted for processing'
        }), 202  # 202 Accepted
        
    except Exception as e:
        print(f"❌ Error submitting job: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/status/<job_id>', methods=['GET'])
def check_status(job_id):
    """
    Check the status of a job
    """
    if job_id not in jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    job = jobs[job_id]
    
    response = {
        'job_id': job_id,
        'status': job['status']
    }
    
    # Include result if completed
    if job['status'] == 'completed':
        response['result'] = job['result']
    
    # Include error if failed
    if job['status'] == 'failed':
        response['error'] = job['error']
    
    return jsonify(response), 200


@app.route('/api/ml/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': list(MODELS.keys()),
        'total_models': len(MODELS),
        'active_jobs': len([j for j in jobs.values() if j['status'] in ['pending', 'processing']])
    }), 200


# ============================================
# LEGACY ENDPOINT (Keep for backward compatibility)
# ============================================

@app.route('/api/ml/predict', methods=['POST'])
def predict():
    """
    Legacy synchronous endpoint - redirects to async pattern
    """
    return jsonify({
        'error': 'This endpoint is deprecated. Please use /api/ml/submit for async processing',
        'message': 'Submit your video to /api/ml/submit, then poll /api/ml/status/<job_id>'
    }), 410  # 410 Gone


# ============================================
# RUN SERVER
# ============================================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🤖 ML Grading Service Started (ASYNC MODE)")
    print("="*50)
    print(f"📍 Running on: http://localhost:5001")
    print(f"🧠 Models: {list(MODELS.keys())}")
    print("="*50 + "\n")
    
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=False, host='0.0.0.0', port=port)


