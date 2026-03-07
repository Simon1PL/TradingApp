import cv2
import numpy as np
import easyocr

# Load image
image_path = "preprocessed.png"
img = cv2.imread(image_path)

# Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Apply adaptive threshold to remove grid
thresh = cv2.adaptiveThreshold(
    gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
    cv2.THRESH_BINARY_INV, 11, 2
)

# Optional: remove small noise
kernel = np.ones((2,2), np.uint8)
clean = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

# Initialize EasyOCR
reader = easyocr.Reader(['en'])

# OCR
results = reader.readtext(clean)
for bbox, text, prob in results:
    print(f"{text} (confidence: {prob:.2f})")
