import pickle
import numpy as np
import os
import sys

# Define the same LogisticRegression class as in main.py
class LogisticRegression:
    def __init__(self, learning_rate=0.01, max_iter=1000, lambda_=0.01, verbose=False, scaler=None):
        self.learning_rate = learning_rate
        self.max_iter = max_iter
        self.lambda_ = lambda_
        self.verbose = verbose
        self.scaler = scaler
        self.weights = None
        self.bias = None
    
    def predict(self, X):
        X = np.asarray(X)
        if hasattr(self, 'scaler') and self.scaler is not None:
            X = self.scaler.transform(X)
        z = np.dot(X, self.weights) + self.bias
        y_pred = 1 / (1 + np.exp(-z))
        return (y_pred > 0.5).astype(int)
    
    def predict_proba(self, X):
        X = np.asarray(X)
        if hasattr(self, 'scaler') and self.scaler is not None:
            X = self.scaler.transform(X)
        z = np.dot(X, self.weights) + self.bias
        y_pred = 1 / (1 + np.exp(-z))
        return np.column_stack([1 - y_pred, y_pred])

def debug_model():
    """Debug and test the model loading and prediction"""
    # Register the LogisticRegression class
    sys.modules['__main__'].LogisticRegression = LogisticRegression
    
    model_path = os.path.join(os.path.dirname(__file__), 'heart_disease_model4.pkl')
    print(f"Attempting to load model from: {model_path}")
    
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        print(f"Model loaded successfully: {type(model).__name__}")
        print(f"Model attributes: {dir(model)}")
        print(f"Has weights: {hasattr(model, 'weights')}")
        print(f"Has bias: {hasattr(model, 'bias')}")
        
        if hasattr(model, 'weights'):
            print(f"Weights shape: {model.weights.shape}")
            print(f"Weights sample: {model.weights[:3]}")
        
        if hasattr(model, 'bias'):
            print(f"Bias: {model.bias}")
        
        # Test prediction with a sample
        test_input = np.array([[58, 1, 2, 140, 300, 0, 0, 140, 0, 1.5, 2, 0]])
        print(f"Test input shape: {test_input.shape}")
        
        # Manual prediction calculation
        z = np.dot(test_input, model.weights) + model.bias
        print(f"Manual z calculation: {z}")
        prob = 1 / (1 + np.exp(-z))
        print(f"Manual probability: {prob}")
        pred = (prob > 0.5).astype(int)
        print(f"Manual prediction: {pred}")
        
        # Using model methods
        prediction = model.predict(test_input)
        probabilities = model.predict_proba(test_input)
        print(f"Model prediction: {prediction}")
        print(f"Model probabilities: {probabilities}")
        
        return True
    
    except Exception as e:
        print(f"Error loading or using model: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = debug_model()
    print(f"Debug completed {'successfully' if success else 'with errors'}")
