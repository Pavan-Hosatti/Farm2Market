import os

MODEL_PATHS = {
    'tomato': 'runs/classify/tomato_grading6/weights/best.pt',
    'carrot': 'runs/classify/carrot_grading_v1/weights/best.pt',
    'guava': 'runs/classify/guava_grading_v1/weights/best.pt',
    'apple': 'runs/classify/apple_grading_v1/weights/best.pt',
}

print("\n" + "="*50)
print("🔍 CHECKING ML MODELS")
print("="*50)

for crop, path in MODEL_PATHS.items():
    exists = os.path.exists(path)
    status = "✅ EXISTS" if exists else "❌ MISSING"
    print(f"{status} | {crop}: {path}")
    
    if exists:
        size = os.path.getsize(path) / (1024 * 1024)
        print(f"         Size: {size:.2f} MB")

print("="*50 + "\n")