from ultralytics import YOLO

# Try loading just the .pt file
model = YOLO('runs/classify/tomato_grading6/weights/best.pt')
print("Model loaded successfully!")
print("Classes:", model.names)  # Should show your grade classes