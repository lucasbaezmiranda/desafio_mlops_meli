import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mangum import Mangum

# 1. Definir la App
app = FastAPI(title="Price Predictor API", version="1.2")

# 2. CONFIGURACIÓN DE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. CARGA DEL MODELO
TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT', '.')
MODEL_PATH = os.path.join(TASK_ROOT, "model/xgb_price_predictor_v1.joblib")

try:
    artifact = joblib.load(MODEL_PATH)
    model = artifact["model"]
    model_features = artifact["features"]
    print(f"✅ Modelo cargado. Features: {len(model_features)}")
except Exception as e:
    model = None
    print(f"❌ Error cargando el modelo: {e}")

# 4. Esquema de datos
class PropertyInput(BaseModel):
    lat: float
    lon: float
    l2: str
    property_type: str
    rooms: int
    bedrooms: int
    bathrooms: int
    surface_total: float
    surface_covered: float

@app.get("/")
def health_check():
    return {"status": "ok", "model_loaded": model is not None}

@app.post("/predict")
@app.post("/prod/predict")
def predict(data: PropertyInput):
    if not model:
        raise HTTPException(status_code=500, detail="Modelo no disponible")

    try:
        # A. Convertimos el input directo a DataFrame (Lógica Celda 45 del notebook)
        df = pd.DataFrame([data.dict()])

        # B. Aplicamos One-Hot Encoding (Igual que en entrenamiento)
        df_encoded = pd.get_dummies(df)

        # C. ALINEACIÓN CRÍTICA: Reindexamos usando la lista de features guardada
        # Esto pone 1 en la categoría elegida, 0 en las demás, y mantiene solo las top features.
        input_df = df_encoded.reindex(columns=model_features, fill_value=0)

        # DEBUG - Para ver qué está recibiendo el modelo realmente
        active_features = input_df.columns[(input_df != 0).any()].tolist()
        print(f"DEBUG - Features activas para predicción: {input_df[active_features].to_dict()}")

        # Inferencia
        prediction = float(model.predict(input_df)[0])
        
        return {
            "precio_predicho": round(prediction, 2),
            "moneda": "USD",
            "propiedad": f"{data.property_type} en {data.l2}",
            "debug_info": {
                "features_usadas": active_features,
                "superficie_cubierta": float(data.surface_covered)
            }
        }
    except Exception as e:
        print(f"❌ Error en la lógica de predicción: {e}")
        raise HTTPException(status_code=500, detail=f"Error en predicción: {str(e)}")

# Adaptador para AWS Lambda
handler = Mangum(app)