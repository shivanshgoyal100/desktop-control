import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle
import os

def run_retraining():
    print("--- Starting AI Core Training ---")
    csv_path = 'data/gesture_data.csv'
    model_dir = 'models'
    
    if not os.path.exists(csv_path):
        print(f"Error: No dataset found at {csv_path}")
        return

    # 1. Load the data
    df = pd.read_csv(csv_path)
    
    # Filter out any accidental header rows and ensure column names are correct
    if 'label' not in df.columns:
        num_cols = df.shape[1]
        col_names = [f'c{i}' for i in range(num_cols - 1)] + ['label']
        df.columns = col_names
    
    df = df[df['label'] != 'label'].copy()

    # 2. Extract Features and Labels
    X = df.iloc[:, :-1].values.astype('float32')
    y = df['label'].values

    # --- THE FIX: UNIT SCALING ---
    # Normalizes hand size so the AI focuses on shape, not distance from camera
    for i in range(len(X)):
        max_val = np.max(np.abs(X[i]))
        if max_val != 0:
            X[i] = X[i] / max_val

    # 3. Fresh Label Encoding
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)

    # SAVE ENCODER FIRST (to prevent "unseen labels" error in main.py)
    with open(os.path.join(model_dir, 'label_encoder.pkl'), 'wb') as f:
        pickle.dump(label_encoder, f)
        
    print(f"Syncing labels: {list(label_encoder.classes_)}")

    # 4. Split data (stratify ensures even distribution of all gestures)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.15, stratify=y_encoded, random_state=42
    )

    # 5. Build the Neural Network
    model = tf.keras.models.Sequential([
        tf.keras.layers.Input(shape=(63,)),
        tf.keras.layers.Dense(256, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dense(len(np.unique(y_encoded)), activation='softmax')
    ])

    model.compile(optimizer='adam', 
                  loss='sparse_categorical_crossentropy', 
                  metrics=['accuracy'])

    # 6. Train the model
    # 100 epochs helps catch subtle finger positions
    print("Training in progress... please wait.")
    model.fit(X_train, y_train, epochs=100, batch_size=32, 
              validation_data=(X_test, y_test), verbose=1)

    # 7. Save the model
    model.save(os.path.join(model_dir, 'gesture_model.h5'))
    print(f"\n--- Training Complete! ---")
    print(f"Model saved with {len(label_encoder.classes_)} classes.")

if __name__ == "__main__":
    run_retraining()