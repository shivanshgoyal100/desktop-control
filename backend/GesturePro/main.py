import numpy as np
import pandas as pd
import tensorflow as tf
import subprocess
import pickle
import pyautogui
import math
import time
import os
import csv
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "gesture_model.h5")
ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")
DATA_DIR = os.path.join(BASE_DIR, "data")
DATA_PATH = os.path.join(DATA_DIR, "gesture_data.csv")

# Fallback gestures so the Gestures Page is never empty
PRETRAINED_DEFAULTS = ["Swipe_Left", "Swipe_Right", "Palm_Open", "Fist", "Pointer", "Pinch"]

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

SMOOTHING = 8               
SCREEN_W, SCREEN_H = pyautogui.size()
CONFIDENCE_THRESHOLD = 0.70 
COOLDOWN_TIME = 0.5         
pyautogui.FAILSAFE = False 
pyautogui.PAUSE = 0

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

model = None
encoder = None
p_loc_x, p_loc_y = SCREEN_W // 2, SCREEN_H // 2
is_clicking = False
last_action_time = 0

def normalize_landmarks(landmarks):
    wrist = landmarks[0]
    row = []
    for lm in landmarks:
        row.extend([
            lm.get('x', 0) - wrist.get('x', 0),
            lm.get('y', 0) - wrist.get('y', 0),
            lm.get('z', 0) - wrist.get('z', 0)
        ])
    row = np.array(row)
    max_val = np.max(np.abs(row))
    if max_val != 0:
        row = row / max_val
    return row.tolist()

def load_ai():
    global model, encoder
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
            tf.keras.backend.clear_session()
            model = tf.keras.models.load_model(MODEL_PATH)
            with open(ENCODER_PATH, 'rb') as f:
                encoder = pickle.load(f)
            print(f"--- AI Core Online: {encoder.classes_} ---")
            return True
    except Exception as e:
        print(f"AI Load Failed: {e}")
    return False

load_ai()

# --- NEW: GEOMETRIC DISTANCE RESOLVER ---
def resolve_confusion(landmarks, ai_gesture):
    """Overrides AI prediction using finger distances."""
    # 4=Thumb Tip, 8=Index Tip, 12=Middle Tip, 0=Wrist
    def dist(p1, p2):
        return math.hypot(p1['x'] - p2['x'], p1['y'] - p2['y'])

    d_thumb_index = dist(landmarks[4], landmarks[8])
    d_index_wrist = dist(landmarks[8], landmarks[0])
    d_index_middle = dist(landmarks[8], landmarks[12])

    # 1. PINCH: Thumb and Index are touching
    if d_thumb_index < 0.045:
        return "Pinch"
    
    # 2. POINTER: Index is extended away from wrist AND middle finger
    if d_index_wrist > 0.25 and d_index_middle > 0.10:
        return "Pointer"
    
    # 3. FIST: Index is curled near the wrist
    if d_index_wrist < 0.18:
        return "Fist"

    return ai_gesture

@app.post("/process")
async def process_landmarks(request: Request):
    global p_loc_x, p_loc_y, is_clicking, last_action_time
    
    if model is None or encoder is None:
        return {"prediction": "Model Not Loaded"}

    data = await request.json()
    landmarks = data.get("landmarks")
    if not landmarks or len(landmarks) < 21: 
        return {"prediction": "No Hand"}

    # 1. MOUSE CONTROL
    idx = landmarks[8]
    target_x = np.interp(idx['x'], [0.2, 0.8], [SCREEN_W, 0])
    target_y = np.interp(idx['y'], [0.2, 0.8], [0, SCREEN_H])
    p_loc_x += (target_x - p_loc_x) / SMOOTHING
    p_loc_y += (target_y - p_loc_y) / SMOOTHING
    pyautogui.moveTo(int(p_loc_x), int(p_loc_y))

    # 2. GESTURE INFERENCE
    input_row = normalize_landmarks(landmarks)
    prediction = model.predict(np.array([input_row]), verbose=0)
    class_id = np.argmax(prediction)
    confidence = float(np.max(prediction))
    raw_gesture = str(encoder.inverse_transform([class_id])[0])

    # APPLY MATH OVERRIDE
    gesture = resolve_confusion(landmarks, raw_gesture)

    # 3. CLICK LOGIC (Based on verified Pinch)
    if gesture == "Pinch":
        if not is_clicking:
            pyautogui.click()
            is_clicking = True
    else: 
        is_clicking = False

    # 4. EXECUTION ENGINE
    if confidence > CONFIDENCE_THRESHOLD:
        now = time.time()
        if (now - last_action_time) > COOLDOWN_TIME:
            g_clean = gesture.lower().replace("_", "")
            
            if "fist" in g_clean:
                pyautogui.hotkey('win', 'd')
                last_action_time = now + 0.5
            elif "palm" in g_clean:
                pyautogui.press('playpause')
                last_action_time = now
            elif "thumbup" in g_clean:
                pyautogui.press('volumeup')
                last_action_time = now

    return {"prediction": gesture, "confidence": round(confidence, 2)}

@app.get("/gestures/list")
async def get_gestures():
    # gestures_in_csv represents your "Custom" or "Trained" data
    gestures_in_csv = []
    if os.path.exists(DATA_PATH):
        try:
            df = pd.read_csv(DATA_PATH)
            if 'label' in df.columns:
                gestures_in_csv = df['label'].unique().tolist()
        except Exception as e:
            print(f"Error reading CSV: {e}")

    # Return both so the frontend can compare
    return {
        "gestures": sorted(list(set(gestures_in_csv + PRETRAINED_DEFAULTS))),
        "custom_gestures": gestures_in_csv
    }

@app.post("/gestures/collect_frame")
async def collect_frame(request: Request):
    try:
        data = await request.json()
        landmarks, label = data.get("landmarks"), data.get("label")
        if landmarks and label:
            row = normalize_landmarks(landmarks)
            row.append(label)
            file_exists = os.path.isfile(DATA_PATH)
            with open(DATA_PATH, 'a', newline='') as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow([f'c{i}' for i in range(63)] + ['label'])
                writer.writerow(row)
            return {"status": "recorded", "frame": label}
    except Exception as e:
        print(f"Collection Error: {e}")
    return {"status": "error"}

@app.post("/gestures/train_now")
async def start_training(background_tasks: BackgroundTasks):
    def run_training():
        try:
            TRAIN_SCRIPT = os.path.join(BASE_DIR, "training.py")
            subprocess.run(['python', TRAIN_SCRIPT], check=True)
            load_ai()
        except Exception as e:
            print(f"Training Failed: {e}")
    background_tasks.add_task(run_training)
    return {"status": "success"}

@app.delete("/gestures/delete/{name}")
async def delete_gesture(name: str):
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
        df = df[df['label'] != name]
        df.to_csv(DATA_PATH, index=False)
        return {"status": "success"}
    return {"status": "not_found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, workers=1)