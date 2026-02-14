#!/bin/bash

# Detener el script si hay errores
set -e

ECHO_PREFIX="[ML-SETUP]"
VENV_NAME=".venv"

echo "$ECHO_PREFIX 🚀 Iniciando configuración del entorno de Machine Learning..."

# 1. Verificar si Python 3 está instalado
if ! command -v python3 &> /dev/null; then
    echo "$ECHO_PREFIX ❌ Error: Python 3 no está instalado."
    exit 1
fi

# 2. Crear el entorno virtual si no existe
if [ ! -d "$VENV_NAME" ]; then
    echo "$ECHO_PREFIX 🔨 Creando entorno virtual '$VENV_NAME'..."
    python3 -m venv $VENV_NAME
else
    echo "$ECHO_PREFIX ⚠️  El entorno '$VENV_NAME' ya existe. Saltando creación."
fi

# 3. Activar el entorno (solo para el contexto de este script)
source $VENV_NAME/bin/activate

# 4. Actualizar pip
echo "$ECHO_PREFIX ⬆️  Actualizando pip..."
pip install --upgrade pip -q

# 5. Instalar librerías
echo "$ECHO_PREFIX 📦 Instalando librerías (scikit-learn, xgboost, pandas, jupyter)..."
# -q es para que no llene la pantalla de logs, quítalo si quieres ver todo
pip install numpy pandas scikit-learn xgboost matplotlib seaborn jupyterlab -q

# 6. Generar requirements.txt
echo "$ECHO_PREFIX 📝 Generando requirements.txt..."
pip freeze > requirements.txt

echo ""
echo "$ECHO_PREFIX 🎉 ¡Instalación completada con éxito!"
echo "----------------------------------------------------"
echo "Para activar tu entorno, ejecuta este comando ahora:"
echo ""
echo "    source $VENV_NAME/bin/activate"
echo ""
echo "Luego escribe 'jupyter lab' para empezar a programar."
echo "----------------------------------------------------"