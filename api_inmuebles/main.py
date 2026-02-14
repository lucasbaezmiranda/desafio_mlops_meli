import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mangum import Mangum

# 1. Definir la App
app = FastAPI(title="Price Predictor API", version="1.1")

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
    if os.path.exists(MODEL_PATH):
        artifact = joblib.load(MODEL_PATH)
        model = artifact["model"]
        model_features = artifact["features"]
        print(f"✅ Modelo cargado. Features: {len(model_features)}")
    else:
        model = None
        print(f"❌ ERROR: No se encontró el modelo en {MODEL_PATH}")
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
        # Creamos un DataFrame con ceros respetando el orden de columnas del entrenamiento
        input_df = pd.DataFrame(0, index=[0], columns=model_features)

        # Asignamos variables numéricas (¡Ojo! Verificar si el modelo espera valores reales o transformados)
        input_df["lat"] = data.lat
        input_df["lon"] = data.lon
        input_df["rooms"] = data.rooms
        input_df["bedrooms"] = data.bedrooms
        input_df["bathrooms"] = data.bathrooms
        input_df["surface_total"] = data.surface_total
        input_df["surface_covered"] = data.surface_covered

        # One-Hot Encoding Manual
        col_l2 = f"l2_{data.l2}"
        col_type = f"property_type_{data.property_type}"

        if col_l2 in input_df.columns:
            input_df[col_l2] = 1
        if col_type in input_df.columns:
            input_df[col_type] = 1

        # DEBUG - Esto aparecerá en los logs de CloudWatch de la Lambda
        print(f"DEBUG - JSON recibido: {data.dict()}")
        # Mostramos solo las columnas que NO son cero para verificar el OHE
        active_features = input_df.columns[(input_df != 0).any()].tolist()
        print(f"DEBUG - Features activas en DataFrame: {input_df[active_features].to_dict()}")

        # Inferencia
        prediction = float(model.predict(input_df)[0])
        
        return {
            "precio_predicho": round(prediction, 2),
            "moneda": "USD",
            "propiedad": f"{data.property_type} en {data.l2}",
            "features_usadas": active_features
        }
    except Exception as e:
        print(f"❌ Error en la lógica de predicción: {e}")
        raise HTTPException(status_code=500, detail=f"Error en predicción: {str(e)}")

# Adaptador para AWS Lambda
handler = Mangum(app)