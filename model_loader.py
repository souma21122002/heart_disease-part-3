import pickle
import numpy as np
import os
import logging

logger = logging.getLogger(__name__)

class CustomLogisticRegression:
    """Custom LogisticRegression class to match the pickled model structure."""
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
        if self.scaler:
            X = self.scaler.transform(X)
        z = np.dot(X, self.weights) + self.bias
        y_pred = 1 / (1 + np.exp(-z))
        return (y_pred > 0.5).astype(int)
    
    def predict_proba(self, X):
        X = np.asarray(X)
        if self.scaler:
            X = self.scaler.transform(X)
        z = np.dot(X, self.weights) + self.bias
        y_pred = 1 / (1 + np.exp(-z))
        return np.column_stack([1 - y_pred, y_pred])

def load_model(model_path=None):
    """
    Load a heart disease prediction model from the specified path.
    Handles both traditional scikit-learn models and custom models.
    
    Returns:
        Tuple of (model, scaler)
    """
    if model_path is None:
        # Try the new model first, then fall back to the original
        new_model_path = os.path.join(os.path.dirname(__file__), 'heart_disease_model_sklearn.pkl')
        if os.path.exists(new_model_path):
            model_path = new_model_path
            logger.info(f"Using new sklearn model at {model_path}")
        else:
            model_path = os.path.join(os.path.dirname(__file__), 'heart_disease_model4.pkl')
            logger.info(f"Using original model at {model_path}")
    
    try:
        # Register custom class
        import sys
        sys.modules['__main__'].LogisticRegression = CustomLogisticRegression
        
        with open(model_path, 'rb') as f:
            logger.info(f"Loading model from {model_path}")
            
            try:
                # Try loading as a dictionary with model and scaler
                model_data = pickle.load(f)
                if isinstance(model_data, dict) and 'model' in model_data and 'scaler' in model_data:
                    logger.info("Loaded model data dictionary")
                    return model_data['model'], model_data['scaler']
                else:
                    # Not a dictionary, might be just the model
                    logger.info(f"Loaded single model object: {type(model_data).__name__}")
                    return model_data, getattr(model_data, 'scaler', None)
            except Exception as e:
                logger.error(f"Error during model loading: {str(e)}")
                # Try again with original model approach
                f.seek(0)
                model = pickle.load(f)
                return model, getattr(model, 'scaler', None)
    
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        logger.error("Traceback:", exc_info=True)
        raise
