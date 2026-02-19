import React, { useState } from 'react';
import axios from 'axios';
import { Calculator, Loader2, Home, Info } from 'lucide-react';

const API_URL = "https://qgzm7dy75b.execute-api.us-east-1.amazonaws.com/prod/predict";

function App() {
  const [formData, setFormData] = useState({
    l2: "Capital Federal",
    bedrooms: 2,
    bathrooms: 1,
    surface_total: 80,
    surface_covered: 70
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    try {
      const res = await axios.post(API_URL, formData);
      setPrediction(res.data);
    } catch (err) {
      console.error(err);
      alert("Error al conectar con la API de AWS. Verifica el despliegue del backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "l2" ? value : parseFloat(value)
    });
  };

  return (
    <div className="app-root">
      <div className="container">
        <div className="card">
          <header className="header">
            <div className="header-icon">
              <Calculator size={28} strokeWidth={2.2} />
            </div>
            <h1>Tasador MLOps</h1>
            <p>Basado en ElasticNet (6 features clave)</p>
          </header>

          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label htmlFor="l2">Ubicación</label>
              <select
                id="l2"
                name="l2"
                value={formData.l2}
                onChange={handleChange}
                className="select"
              >
                <option value="Capital Federal">Capital Federal (CABA)</option>
                <option value="Buenos Aires Interior">Buenos Aires Interior</option>
                <option value="Bs.As. G.B.A. Zona Norte">G.B.A. Zona Norte</option>
                <option value="Bs.As. G.B.A. Zona Sur">G.B.A. Zona Sur</option>
                <option value="Bs.As. G.B.A. Zona Oeste">G.B.A. Zona Oeste</option>
                <option value="Córdoba">Córdoba</option>
                <option value="Santa Fe">Santa Fe</option>
              </select>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="bedrooms">Dormitorios</label>
                <input
                  id="bedrooms"
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  min="0"
                  className="input"
                />
              </div>
              <div className="field">
                <label htmlFor="bathrooms">Baños</label>
                <input
                  id="bathrooms"
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  min="1"
                  className="input"
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="surface_total">Superficie total (m²)</label>
                <input
                  id="surface_total"
                  type="number"
                  name="surface_total"
                  value={formData.surface_total}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div className="field">
                <label htmlFor="surface_covered">Superficie cubierta (m²)</label>
                <input
                  id="surface_covered"
                  type="number"
                  name="surface_covered"
                  value={formData.surface_covered}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn">
              {loading ? (
                <Loader2 size={20} className="spinner" />
              ) : (
                'Calcular tasación'
              )}
            </button>
          </form>

          {prediction && (
            <div className="result">
              <div className="result-label">
                <Home size={16} />
                Precio estimado
              </div>
              <h2 className="result-price">
                USD {prediction.precio_predicho.toLocaleString()}
              </h2>
              <div className="result-note">
                <Info size={16} className="result-note-icon" />
                <span>
                  <strong>Lógica del modelo:</strong> cada baño adicional incrementa el valor en aprox. <strong>USD 108k</strong>.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
