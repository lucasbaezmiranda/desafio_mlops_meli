import os
import joblib
import pandas as pd
import numpy as np
import json
from fastapi import FastAPI, HTTPException, Request # Agregamos Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mangum import Mangum

# 1. Definición de la App
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
    model_features = artifact["features"]
    print(f"✅ Pipeline cargado. Usando las {len(model_features)} variables ganadoras.")
except Exception as e:
    model_pipeline = None
    print(f"❌ Error crítico cargando el modelo: {e}")

# 3. ESQUEMA DE ENTRADA
class PropertyInput(BaseModel):
    l2: str             
    bedrooms: int       
    bathrooms: int      
    surface_total: float
    surface_covered: float

@app.get("/")
def health_check():
    return {"status": "ok", "variables_requeridas": ["l2", "bedrooms", "bathrooms", "surface_total", "surface_covered"]}

@app.post("/predict")
@app.post("/prod/predict")
async def predict(data: PropertyInput, request: Request): # Agregamos request
    if not model_pipeline:
        raise HTTPException(status_code=500, detail="Modelo no disponible")

    # --- EXTRACCIÓN DE METADATOS ---
    # Capturamos la IP (vía API Gateway) y el navegador/herramienta que llama
    client_ip = request.client.host if request.client else "IP Desconocida"
    user_agent = request.headers.get("user-agent", "Desconocido")

    # --- LOGS DE AUDITORÍA ---
    # Log de acceso (IP y Agente)
    print(f"PRED_LOG_ACCESS | IP: {client_ip} | Agent: {user_agent}")
    # Log de entrada (JSON de la propiedad)
    print(f"PRED_LOG_INPUT: {data.json()}")

    try:
        # A. Crear DataFrame con las 5 entradas
        df = pd.DataFrame([data.dict()])

        # B. One-Hot Encoding
        df_encoded = pd.get_dummies(df)

        # C. ALINEACIÓN CON LAS FEATURES DEL MODELO
        input_df = df_encoded.reindex(columns=model_features, fill_value=0)

        # D. INFERENCIA
        prediction_raw = model_pipeline.predict(input_df)[0]
        
        # Filtro de seguridad para el precio
        prediction = max(float(prediction_raw), 5000.0)
        final_price = round(prediction, 2)

        # --- LOG DE SALIDA ---
        # Imprimimos el resultado final
        print(f"PRED_LOG_OUTPUT: {final_price}")
        
        return {
            "precio_predicho": final_price,
            "moneda": "USD",
            "detalles": {
                "ubicacion": data.l2,
                "impacto_baños": "USD 108,239 por unidad",
                "variables_procesadas": model_features
            },
            "info_peticion": {
                "ip_origen": client_ip
            }
        }
    except Exception as e:
        # Log de error mejorado
        print(f"❌ PRED_LOG_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

handler = Mangum(app)