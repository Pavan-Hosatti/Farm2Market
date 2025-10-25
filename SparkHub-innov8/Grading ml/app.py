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
# 🔧 FIX: FLASK CONFIGURATIONS FOR LARGE FILES
# ============================================
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['UPLOAD_TIMEOUT'] = 300  # 5 minutes timeout
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

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
        try:
            MODELS[crop] = YOLO(path)
            print(f"✓ Loaded model for {crop}")
        except Exception as e:
            print(f"✗ Error loading model for {crop}: {str(e)}")
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

def extract_frames(video_path, sample_rate=60, max_frames=7):
    """Extract frames from video with error handling"""
    try:
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Cannot open video file: {video_path}")
        
        frames = []
        frame_count = 0
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        print(f"📊 Video info: {total_frames} frames, {fps:.2f} FPS")
        
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
        
        if len(frames) == 0:
            raise ValueError("No frames could be extracted from video")
        
        return frames
        
    except Exception as e:
        print(f"❌ Error extracting frames: {str(e)}")
        raise


def predict_grade_from_frames(model, frames):
    """Predict grade from extracted frames"""
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
    Background processing function with timeout
    """
    try:
        print(f"\n{'='*50}")
        print(f"🎬 Background Processing Job: {job_id}")
        print(f"🌾 Crop Type: {crop_type.upper()}")
        print(f"📁 Video Path: {video_path}")
        print(f"{'='*50}")
        
        jobs[job_id]['status'] = 'processing'
        
        # Verify file exists
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        file_size = os.path.getsize(video_path)
        print(f"📦 File size: {file_size / (1024*1024):.2f} MB")
        
        # Extract frames
        print("📹 Starting frame extraction...")
        frames = extract_frames(video_path, sample_rate=30, max_frames=30)
        print(f"📊 Extracted {len(frames)} frames")
        
        if len(frames) == 0:
            jobs[job_id]['status'] = 'failed'
            jobs[job_id]['error'] = 'No frames could be extracted from video'
            notify_backend(job_id, 'failed', error='No frames extracted')
            return
        
        # Get model and predict
        print(f"🧠 Loading model for {crop_type}...")
        model = MODELS.get(crop_type)
        
        if model is None:
            jobs[job_id]['status'] = 'failed'
            jobs[job_id]['error'] = f'Model not available for {crop_type}'
            notify_backend(job_id, 'failed', error=f'Model not available')
            return
        
        print("🔬 Starting grade prediction...")
        result = predict_grade_from_frames(model, frames)
        print(f"✅ Prediction complete!")
        
        print(f"✅ Final Grade: {result['grade']} (Confidence: {result['confidence']}%)")
        print(f"{'='*50}\n")
        
        # Update job with result
        jobs[job_id]['status'] = 'completed'
        jobs[job_id]['result'] = {
            'success': True,
            'grade': result['grade'],
            'confidence': result['confidence'],
            'overall_confidence': result['overall_confidence'],
            'grade_breakdown': result['grade_breakdown'],
            'frames_analyzed': result['frames_analyzed']
        }
        
        # Notify backend
        print("📤 Notifying backend...")
        notify_backend(job_id, 'completed', result=jobs[job_id]['result'])
        print("✅ Backend notification sent")
        
    except Exception as e:
        print(f"❌ Error in background processing: {str(e)}")
        import traceback
        traceback.print_exc()
        jobs[job_id]['status'] = 'failed'
        jobs[job_id]['error'] = str(e)
        notify_backend(job_id, 'failed', error=str(e))
    
    finally:
        # Clean up temp file
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
                print(f"🗑️ Cleaned up temp file: {video_path}")
        except Exception as cleanup_error:
            print(f"⚠️ Could not delete temp file: {cleanup_error}")


# ============================================
# API ENDPOINTS (ASYNC PATTERN)
# ============================================

@app.route('/api/ml/submit', methods=['POST'])
def submit_job():
    """
    Submit a video for processing
    Returns job_id immediately
    """
    try:
        print(f"\n{'='*50}")
        print(f"📥 RECEIVED JOB SUBMISSION REQUEST")
        print(f"{'='*50}")
        
        if 'video' not in request.files:
            print("❌ No video file in request")
            return jsonify({'error': 'No video file uploaded'}), 400
        
        video_file = request.files['video']
        crop_type = request.form.get('cropType', 'tomato').lower()
        
        print(f"📊 File details:")
        print(f"  - Filename: {video_file.filename}")
        print(f"  - Content Type: {video_file.content_type}")
        print(f"  - Crop Type: {crop_type}")
        
        if video_file.filename == '':
            return jsonify({'error': 'No video file selected'}), 400
        
        if crop_type not in MODELS:
            return jsonify({'error': f'Model not available for crop: {crop_type}'}), 400
        
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # 🔧 FIX: Sanitize filename and create safe path
        safe_filename = "".join(c for c in video_file.filename if c.isalnum() or c in ('_', '.', '-'))
        temp_video_path = os.path.join(
            TEMP_FRAMES_FOLDER, 
            f'temp_{job_id}_{safe_filename}'
        )
        
        print(f"💾 Saving to: {temp_video_path}")
        
        # 🔧 FIX: Save file with better error handling
        try:
            video_file.save(temp_video_path)
            
            # Verify file was saved
            if not os.path.exists(temp_video_path):
                raise IOError("File was not saved properly")
            
            file_size = os.path.getsize(temp_video_path)
            print(f"✅ File saved successfully: {file_size / (1024*1024):.2f} MB")
            
            if file_size == 0:
                raise ValueError("Saved file is empty (0 bytes)")
                
        except Exception as save_error:
            print(f"❌ Error saving file: {save_error}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Failed to save file: {str(save_error)}'}), 500
        
        # Initialize job
        jobs[job_id] = {
            'status': 'pending',
            'result': None,
            'error': None,
            'created_at': datetime.now().isoformat(),
            'file_path': temp_video_path,
            'crop_type': crop_type
        }
        
        # Start background processing
        print(f"🚀 Starting background thread for job {job_id}")
        thread = threading.Thread(
            target=process_video_async,
            args=(job_id, temp_video_path, crop_type),
            name=f"Job-{job_id[:8]}"
        )
        thread.daemon = True
        thread.start()
        
        print(f"✅ Job {job_id} submitted for processing")
        print(f"{'='*50}\n")
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'message': 'Video submitted for processing'
        }), 202  # 202 Accepted
        
    except Exception as e:
        print(f"❌ Error submitting job: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'type': type(e).__name__}), 500


@app.route('/api/ml/status/<job_id>', methods=['GET'])
def check_status(job_id):
    """
    Check the status of a job
    """
    print(f"🔍 Status check for job: {job_id}")
    
    if job_id not in jobs:
        print(f"❌ Job not found: {job_id}")
        return jsonify({'error': 'Job not found'}), 404
    
    job = jobs[job_id]
    
    response = {
        'job_id': job_id,
        'status': job['status'],
        'created_at': job.get('created_at')
    }
    
    # Include result if completed
    if job['status'] == 'completed':
        response['result'] = job['result']
        print(f"✅ Job {job_id} completed: Grade {job['result'].get('grade')}")
    
    # Include error if failed
    if job['status'] == 'failed':
        response['error'] = job['error']
        print(f"❌ Job {job_id} failed: {job['error']}")
    
    return jsonify(response), 200


@app.route('/api/ml/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    active_jobs = len([j for j in jobs.values() if j['status'] in ['pending', 'processing']])
    
    return jsonify({
        'status': 'healthy',
        'models_loaded': list(MODELS.keys()),
        'total_models': len(MODELS),
        'active_jobs': active_jobs,
        'total_jobs': len(jobs),
        'temp_folder': TEMP_FRAMES_FOLDER,
        'temp_folder_exists': os.path.exists(TEMP_FRAMES_FOLDER)
    }), 200


@app.route('/api/ml/jobs', methods=['GET'])
def list_jobs():
    """List all jobs (for debugging)"""
    return jsonify({
        'total_jobs': len(jobs),
        'jobs': [{
            'job_id': jid,
            'status': job['status'],
            'created_at': job.get('created_at'),
            'crop_type': job.get('crop_type')
        } for jid, job in jobs.items()]
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
# ERROR HANDLERS
# ============================================

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        'error': 'File too large',
        'message': 'Maximum file size is 100MB'
    }), 413


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': str(error)
    }), 500


# ============================================
# RUN SERVER
# ============================================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🤖 ML Grading Service Started (ASYNC MODE)")
    print("="*50)
    print(f"📍 Running on: http://localhost:5001")
    print(f"🧠 Models: {list(MODELS.keys())}")
    print(f"📁 Temp folder: {TEMP_FRAMES_FOLDER}")
    print(f"📦 Max file size: 100MB")
    print("="*50 + "\n")
    
    port = int(os.environ.get('PORT', 5001))
    
    # 🔧 For production, use gunicorn instead
    # Command: gunicorn app:app --bind 0.0.0.0:5001 --timeout 300 --workers 2
    
    app.run(
        debug=False,  # Set to False in production
        host='0.0.0.0',
        port=port,
        threaded=True  # Enable threading for concurrent requests
    )


