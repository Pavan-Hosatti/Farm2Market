from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import numpy as np
from ultralytics import YOLO
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Allow requests from Node.js backend

# ============================================
# CONFIGURATION
# ============================================
TEMP_FRAMES_FOLDER = 'temp_frames'
os.makedirs(TEMP_FRAMES_FOLDER, exist_ok=True)

# Model paths based on your training output
MODEL_PATHS = {
    'tomato': 'runs/classify/tomato_grading6/weights/best.pt',
    'carrot': 'runs/classify/carrot_grading_v1/weights/best.pt',
    'guava': 'runs/classify/guava_grading_v1/weights/best.pt',
    'apple': 'runs/classify/apple_grading_v1/weights/best.pt',
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

# Grade mapping (model outputs 0='A', 1='B', 2='C')
GRADE_MAPPING = {0: 'A', 1: 'B', 2: 'C'}

# ============================================
# HELPER FUNCTIONS
# ============================================

def extract_frames(video_path, sample_rate=30, max_frames=30):
    """
    Extract frames from video
    Args:
        video_path: Path to video file
        sample_rate: Extract every Nth frame
        max_frames: Maximum number of frames to extract
    Returns:
        List of frames (numpy arrays)
    """
    cap = cv2.VideoCapture(video_path)
    frames = []
    frame_count = 0
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Sample every Nth frame
        if frame_count % sample_rate == 0:
            frames.append(frame)
        
        frame_count += 1
        
        # Limit frames
        if len(frames) >= max_frames:
            break
    
    cap.release()
    print(f"📊 Extracted {len(frames)} frames from {total_frames} total frames")
    return frames


def predict_grade_from_frames(model, frames):
    """
    Predict grade for each frame and return the best (highest) grade
    Logic: Average the confidence scores for each grade across all frames,
           then select the highest grade (A > B > C priority)
    
    Args:
        model: Loaded YOLO model
        frames: List of frames (numpy arrays)
    
    Returns:
        dict with grade, confidence, and breakdown
    """
    # Accumulate scores for each grade
    grade_scores = {'A': [], 'B': [], 'C': []}
    
    print(f"🔍 Analyzing {len(frames)} frames...")
    
    for idx, frame in enumerate(frames):
        # Run prediction
        results = model(frame, verbose=False)
        
        if len(results) > 0:
            probs = results[0].probs
            
            # Get all class probabilities
            if probs is not None and hasattr(probs, 'data'):
                confidences = probs.data.cpu().numpy()
                
                # Store confidence for each grade
                for class_idx, confidence in enumerate(confidences):
                    grade = GRADE_MAPPING.get(class_idx, 'C')
                    grade_scores[grade].append(float(confidence) * 100)
    
    # Calculate average confidence for each grade
    avg_scores = {}
    for grade in ['A', 'B', 'C']:
        if grade_scores[grade]:
            avg_scores[grade] = sum(grade_scores[grade]) / len(grade_scores[grade])
        else:
            avg_scores[grade] = 0.0
    
    print(f"📈 Average scores: A={avg_scores['A']:.2f}%, B={avg_scores['B']:.2f}%, C={avg_scores['C']:.2f}%")
    
    # Determine final grade: Highest average wins
    # Priority: A > B > C (if A has highest avg, return A)
    final_grade = max(avg_scores, key=avg_scores.get)
    final_confidence = avg_scores[final_grade]
    
    # Overall confidence (max confidence across all predictions)
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


# ============================================
# API ENDPOINTS
# ============================================


@app.route('/api/ml/predict', methods=['POST'])
def predict():
    """
    ML Prediction Endpoint
    Expects: video file upload + crop type
    Returns: grade and confidence
    """
    try:
        # ✅ CHANGED: Accept file upload instead of path
        if 'video' not in request.files:
            return jsonify({'error': 'No video file uploaded'}), 400
        
        video_file = request.files['video']
        crop_type = request.form.get('cropType', 'tomato').lower()
        
        if video_file.filename == '':
            return jsonify({'error': 'No video file selected'}), 400
        
        if crop_type not in MODELS:
            return jsonify({'error': f'Model not available for crop: {crop_type}'}), 400
        
        # ✅ Save uploaded file temporarily
        temp_video_path = os.path.join(TEMP_FRAMES_FOLDER, f'temp_{datetime.now().timestamp()}_{video_file.filename}')
        video_file.save(temp_video_path)
        
        print(f"\n{'='*50}")
        print(f"🎬 Processing: {video_file.filename}")
        print(f"🌾 Crop Type: {crop_type.upper()}")
        print(f"📁 Temp path: {temp_video_path}")
        print(f"{'='*50}")
        
        # Extract frames
        frames = extract_frames(temp_video_path, sample_rate=30, max_frames=30)
        
        if len(frames) == 0:
            # Clean up temp file
            if os.path.exists(temp_video_path):
                os.remove(temp_video_path)
            return jsonify({'error': 'No frames could be extracted from video'}), 400
        
        # Get model and predict
        model = MODELS[crop_type]
        result = predict_grade_from_frames(model, frames)
        
        print(f"✅ Final Grade: {result['grade']} (Confidence: {result['confidence']}%)")
        print(f"{'='*50}\n")
        
        # ✅ Clean up temp file after processing
        try:
            if os.path.exists(temp_video_path):
                os.remove(temp_video_path)
                print(f"🗑️ Cleaned up temp file: {temp_video_path}")
        except Exception as cleanup_error:
            print(f"⚠️ Could not delete temp file: {cleanup_error}")
        
        return jsonify({
            'success': True,
            'grade': result['grade'],
            'confidence': result['confidence'],
            'overall_confidence': result['overall_confidence'],
            'grade_breakdown': result['grade_breakdown'],
            'frames_analyzed': result['frames_analyzed']
        }), 200
        
    except Exception as e:
        print(f"❌ Error in prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': list(MODELS.keys()),
        'total_models': len(MODELS)
    }), 200


# ============================================
# RUN SERVER
# ============================================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🤖 ML Grading Service Started")
    print("="*50)
    print(f"📍 Running on: http://localhost:5001")
    print(f"🧠 Models: {list(MODELS.keys())}")
    print("="*50 + "\n")
    
    port = int(os.environ.get('PORT', 5001))  # ← Gets PORT from Render, defaults to 5001 locally
    app.run(debug=False, host='0.0.0.0', port=port)  # ← Use the dynamic port