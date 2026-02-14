# Usamos la imagen oficial de AWS para Lambda (evita errores de Entrypoint)
FROM public.ecr.aws/lambda/python:3.9

# Copiamos el archivo de dependencias
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Instalamos las librerías necesarias
# Incluímos --no-cache-dir para que la imagen no pese de más
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos todo el contenido de la carpeta actual al directorio de la Lambda
COPY . ${LAMBDA_TASK_ROOT}

# El modelo debe estar en model/xgb_price_predictor_v1.joblib relativo a main.py
# La imagen base de Lambda ya define el ENTRYPOINT, solo le pasamos el CMD
CMD ["main.handler"]