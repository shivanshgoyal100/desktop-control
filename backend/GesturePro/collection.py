

import cv2
import mediapipe as mp
import csv
import time
import os

# 1. Configuration: 10 gestures for 10 functions
gestures = [
    "Palm_Open", "Fist", "Thumb_Up", "Thumb_Down", 
    "Point", "Pinch", "Peace", "Three_Fingers", 
    "Swipe_L", "Swipe_R"
]
samples_per_gesture = 400 

# 2. Setup MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False, 
    max_num_hands=1, 
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)
cap = cv2.VideoCapture(0)

# Ensure the data directory exists
if not os.path.exists('data'):
    os.makedirs('data')

print("--- GesturePro: Starting Data Collection ---")

# 3. Data Collection Loop
# We open in 'w' mode to start fresh or 'a' to add to existing data
with open('data/gesture_data.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    
    for gesture in gestures:
        # Provide a 3-second preparation countdown for the user
        print(f"\nUP NEXT: {gesture}")
        for i in range(3, 0, -1):
            print(f"Starting in {i}...")
            time.sleep(1)
        
        count = 0
        while count < samples_per_gesture:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Mirror the frame for better user experience
            frame = cv2.flip(frame, 1)
            img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(img_rgb)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    # Extract 21 landmarks (63 values total)
                    landmarks = []
                    for lm in hand_landmarks.landmark:
                        landmarks.extend([lm.x, lm.y, lm.z])
                    
                    # Write landmarks and the label to CSV
                    writer.writerow(landmarks + [gesture])
                    count += 1
            
            # Visual feedback on system state
            cv2.putText(frame, f"Recording: {gesture}", (10, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame, f"Progress: {count}/{samples_per_gesture}", (10, 90), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            cv2.imshow('GesturePro Collector', frame)
            
            # Press 'q' to skip a gesture or quit early
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    print("\nData collection finished!")

cap.release()
cv2.destroyAllWindows()
