import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
import pickle
import os

def train_and_save_model():
    print("Starting model training...")
    
    # Load the dataset
    try:
        data_path = os.path.join(os.path.dirname(__file__), 'Cardiovascular_Disease_Dataset.csv')
        print(f"Loading data from {data_path}")
        heart_data = pd.read_csv(data_path)
    except Exception as e:
        print(f"Error loading data: {str(e)}")
        return
    
    try:
        # Prepare features and target
        X = heart_data.drop(columns=['target', 'patientid'], axis=1)
        Y = heart_data['target']
        
        print(f"Data shape: {X.shape}")
        
        # Split the data
        X_train, X_test, Y_train, Y_test = train_test_split(
            X, Y, test_size=0.3, stratify=Y, random_state=2
        )
        
        # Scale the features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train a standard LogisticRegression model
        model = LogisticRegression(max_iter=1000)
        model.fit(X_train_scaled, Y_train)
        
        # Evaluate the model
        train_prediction = model.predict(X_train_scaled)
        train_accuracy = accuracy_score(Y_train, train_prediction)
        print(f"Training accuracy: {train_accuracy:.4f}")
        
        test_prediction = model.predict(X_test_scaled)
        test_accuracy = accuracy_score(Y_test, test_prediction)
        print(f"Testing accuracy: {test_accuracy:.4f}")
        
        # Save the model with the scaler
        model_data = {
            'model': model,
            'scaler': scaler,
            'feature_names': X.columns.tolist()
        }
        
        model_path = os.path.join(os.path.dirname(__file__), 'heart_disease_model_sklearn.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
            
        print(f"Model saved to {model_path}")
        
        # Test loading the model
        with open(model_path, 'rb') as f:
            loaded_model_data = pickle.load(f)
            
        print("Model successfully loaded for testing.")
        test_sample = X_test.iloc[0].values.reshape(1, -1)
        test_sample_scaled = loaded_model_data['scaler'].transform(test_sample)
        prediction = loaded_model_data['model'].predict(test_sample_scaled)
        probability = loaded_model_data['model'].predict_proba(test_sample_scaled)[0][1]
        print(f"Test prediction: {prediction[0]}, probability: {probability:.4f}")
        
        return model_path
    
    except Exception as e:
        print(f"Error during model training: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return None

if __name__ == "__main__":
    trained_model_path = train_and_save_model()
    if trained_model_path:
        print(f"Successfully trained and saved model to {trained_model_path}")
    else:
        print("Model training failed")
