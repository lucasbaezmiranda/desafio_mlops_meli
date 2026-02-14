import os
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mangum import Mangum

# 1. Definición de la App (Versión 2.1 - Simplificada)
app = FastAPI(title="Meli Price Predictor - Slim Version", version="2.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. CARGA DEL ARTEFACTO
# ---------------------------------------------------------
TASK_ROOT = os.environ.get('LAMBDA_TASK_ROOT', '.')
MODEL_PATH = os.path.join(TASK_ROOT, "model/linear_price_predictor_v2.joblib")

try:
    artifact = joblib.load(MODEL_PATH)
    model_pipeline = artifact["model"] 
    # Las 6 columnas reales: bathrooms, surface_total, l2_Capital Federal, 
    # bedrooms, l2_Buenos Aires Interior, surface_covered
    model_features = artifact["features"]
    print(f"✅ Pipeline cargado. Usando las {len(model_features)} variables ganadoras.")
except Exception as e:
    model_pipeline = None
    print(f"❌ Error crítico cargando el modelo: {e}")

# 3. ESQUEMA DE ENTRADA REFINADO
# Solo pedimos lo que el modelo realmente utiliza
class PropertyInput(BaseModel):
    l2: str             # Ubicación (CABA, Interior, etc.)
    bedrooms: int       # Dormitorios
    bathrooms: int      # Baños
    surface_total: float
    surface_covered: float

@app.get("/")
def health_check():
    return {"status": "ok", "variables_requeridas": ["l2", "bedrooms", "bathrooms", "surface_total", "surface_covered"]}

@app.post("/predict")
@app.post("/prod/predict")
def predict(data: PropertyInput):
    if not model_pipeline:
        raise HTTPException(status_code=500, detail="Modelo no disponible")

    try:
        # A. Crear DataFrame con las 5 entradas
        df = pd.DataFrame([data.dict()])

        # B. One-Hot Encoding (Convierte 'l2' en columnas l2_Capital Federal, etc.)
        df_encoded = pd.get_dummies(df)

        # C. ALINEACIÓN CON LAS 6 FEATURES DEL MODELO
        # Este paso es el que hace la magia: si 'l2' no es Capital Federal, 
        # la columna 'l2_Capital Federal' se llena con 0.
        input_df = df_encoded.reindex(columns=model_features, fill_value=0)

        # D. INFERENCIA
        # El pipeline aplica el StandardScaler y el Imputer automáticamente
        prediction_raw = model_pipeline.predict(input_df)[0]
        
        # Filtro de seguridad para el precio
        prediction = max(float(prediction_raw), 5000.0)
        
        return {
            "precio_predicho": round(prediction, 2),
            "moneda": "USD",
            "detalles": {
                "ubicacion": data.l2,
                "impacto_baños": "USD 108,239 por unidad",
                "variables_procesadas": model_features
            }
        }
    except Exception as e:
        print(f"❌ Error en predicción: {e}")
        raise HTTPException(status_code=500, detail=str(e))

handler = Mangum(app)