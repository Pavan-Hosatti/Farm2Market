from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import cv2
import numpy as np
from ultralytics import YOLO
from datetime import datetime
import uuid
import asyncio
from typing import Dict, Optional

app = FastAPI(title="Farm2Market ML API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# CONFIGURATION
# ============================================
TEMP_FRAMES_FOLDER = 'temp_frames'
os.makedirs(TEMP_FRAMES_FOLDER, exist_ok=True)

MODEL_PATHS = {
    'tomato': 'runs/classify/tomato_grading6/weights/best.pt',
}

# Load models at startup
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

# Job storage
jobs: Dict[str, dict] = {}

# ============================================
# HELPER FUNCTIONS
# ============================================

def extract_frames(video_path, sample_rate=30, max_frames=30):
    """Extract frames from video"""
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
        print(f"📊 Extracted {len(frames)} frames")
        
        if len(frames) == 0:
            raise ValueError("No frames could be extracted from video")
        
        return frames
        
    except Exception as e:
        print(f"❌ Error extracting frames: {str(e)}")
        raise


def predict_grade_from_frames(model, frames):
    """Predict grade from frames"""
    grade_scores = {'A': [], 'B': [], 'C': []}
    
    print(f"🔍 Analyzing {len(frames)} frames...")
    
    for idx, frame in enumerate(frames):
        try:
            results = model(frame, verbose=False)
            
            if len(results) > 0:
                probs = results[0].probs
                
                if probs is not None and hasattr(probs, 'data'):
                    confidences = probs.data.cpu().numpy()
                    
                    for class_idx, confidence in enumerate(confidences):
                        grade = GRADE_MAPPING.get(class_idx, 'C')
                        grade_scores[grade].append(float(confidence) * 100)
                    
                    print(f"  ✅ Frame {idx+1}: Processed")
                    
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


async def process_video_async(job_id: str, video_path: str, crop_type: str):
    """Background video processing"""
    try:
        print(f"\n{'='*50}")
        print(f"🎬 Processing Job: {job_id}")
        print(f"🌾 Crop: {crop_type}")
        print(f"{'='*50}")
        
        jobs[job_id]['status'] = 'processing'
        
        # Extract frames
        frames = extract_frames(video_path, sample_rate=30, max_frames=30)
        
        if len(frames) == 0:
            jobs[job_id]['status'] = 'failed'
            jobs[job_id]['error'] = 'No frames extracted'
            return
        
        # Get model
        model = MODELS.get(crop_type)
        
        if model is None:
            jobs[job_id]['status'] = 'failed'
            jobs[job_id]['error'] = f'Model not available for {crop_type}'
            return
        
        # Predict
        result = predict_grade_from_frames(model, frames)
        print(f"✅ Grade: {result['grade']} ({result['confidence']}%)")
        
        # Update job
        jobs[job_id]['status'] = 'completed'
        jobs[job_id]['result'] = {
            'success': True,
            'grade': result['grade'],
            'confidence': result['confidence'],
            'overall_confidence': result['overall_confidence'],
            'grade_breakdown': result['grade_breakdown'],
            'frames_analyzed': result['frames_analyzed']
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        jobs[job_id]['status'] = 'failed'
        jobs[job_id]['error'] = str(e)
    
    finally:
        # Cleanup
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
                print(f"🗑️ Cleaned up: {video_path}")
        except Exception as cleanup_error:
            print(f"⚠️ Cleanup failed: {cleanup_error}")


# ============================================
# API ENDPOINTS
# ============================================

@app.get("/")
def home():
    return {
        "message": "Farm2Market ML API",
        "status": "running",
        "models": list(MODELS.keys()),
        "version": "1.0"
    }


@app.post("/api/ml/submit")
async def submit_job(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    cropType: str = "tomato"
):
    """Submit video for grading"""
    try:
        print(f"\n{'='*50}")
        print(f"📥 NEW JOB SUBMISSION")
        print(f"{'='*50}")
        
        crop_type = cropType.lower()
        
        if crop_type not in MODELS:
            raise HTTPException(400, f"Model not available for: {crop_type}")
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Save video
        safe_filename = "".join(c for c in video.filename if c.isalnum() or c in ('_', '.', '-'))
        temp_video_path = os.path.join(TEMP_FRAMES_FOLDER, f'temp_{job_id}_{safe_filename}')
        
        contents = await video.read()
        with open(temp_video_path, 'wb') as f:
            f.write(contents)
        
        file_size = os.path.getsize(temp_video_path)
        print(f"💾 Saved: {file_size / (1024*1024):.2f} MB")
        
        # Initialize job
        jobs[job_id] = {
            'status': 'pending',
            'result': None,
            'error': None,
            'created_at': datetime.now().isoformat(),
            'crop_type': crop_type
        }
        
        # Start background processing
        background_tasks.add_task(process_video_async, job_id, temp_video_path, crop_type)
        
        print(f"✅ Job {job_id} submitted")
        print(f"{'='*50}\n")
        
        return {
            "success": True,
            "job_id": job_id,
            "message": "Video submitted for processing"
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(500, str(e))


@app.get("/api/ml/status/{job_id}")
def check_status(job_id: str):
    """Check job status"""
    print(f"🔍 Status check: {job_id}")
    
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    
    job = jobs[job_id]
    
    response = {
        'job_id': job_id,
        'status': job['status'],
        'created_at': job.get('created_at')
    }
    
    if job['status'] == 'completed':
        response['result'] = job['result']
        print(f"✅ Completed: Grade {job['result'].get('grade')}")
    
    if job['status'] == 'failed':
        response['error'] = job['error']
        print(f"❌ Failed: {job['error']}")
    
    return response


@app.get("/api/ml/health")
def health_check():
    """Health check"""
    active_jobs = len([j for j in jobs.values() if j['status'] in ['pending', 'processing']])
    
    return {
        'status': 'healthy',
        'models_loaded': list(MODELS.keys()),
        'total_models': len(MODELS),
        'active_jobs': active_jobs,
        'total_jobs': len(jobs)
    }


@app.get("/api/ml/jobs")
def list_jobs():
    """List all jobs"""
    return {
        'total_jobs': len(jobs),
        'jobs': [{
            'job_id': jid,
            'status': job['status'],
            'created_at': job.get('created_at'),
            'crop_type': job.get('crop_type')
        } for jid, job in jobs.items()]
    }


# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🤖 Farm2Market ML Service (HF Space)")
    print("="*50)
    print(f"🧠 Models: {list(MODELS.keys())}")
    print("="*50 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=7860)