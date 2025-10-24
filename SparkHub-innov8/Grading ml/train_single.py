# train_single.py (For Training One Crop at a Time)

from ultralytics import YOLO
from setup_structure import setup_dataset_structure_in_place
import sys

def train_single_model(crop_name):
    """
    Prepares the dataset and trains a YOLO classification model for a single crop.
    
    Args:
        crop_name (str): The name of the crop to train (e.g., 'apple').
    """
    
    # 1. Prepare the dataset structure
    dataset_path = setup_dataset_structure_in_place(crop_name)
    
    if dataset_path is None:
        print(f"\nSkipping training for {crop_name} due to dataset setup failure.")
        return

    print("\n" + "="*50)
    print(f"Starting YOLO Training for: {crop_name.upper()}")
    print("="*50 + "\n")

    # The training run name is unique for the crop, e.g., 'apple_grading_v1'
    run_name = f'{crop_name}_grading_v1'
    
    # Load a pretrained YOLO classification model
    model = YOLO('yolov8n-cls.pt')

    # Train the model
    results = model.train(
        data=dataset_path,
        epochs=50,       
        imgsz=224,      
        batch=16,
        name=run_name, 
        device='cpu',    
        workers=4,       
        verbose=False  # Set to True if you want more verbose output during training
    )

    print("\n" + "="*50)
    print(f"Training completed for {crop_name.upper()}!")
    # The key to your plan: the model path will be predictable
    print(f"Model saved to: runs/classify/{run_name}/weights/best.pt")
    print("="*50)
    return results

if __name__ == "__main__":
    if len(sys.argv) > 1:
        crop_to_train = sys.argv[1]
        train_single_model(crop_to_train)
    else:
        print("Usage: python train_single.py <crop_name>")
        print("Example: python train_single.py apple")