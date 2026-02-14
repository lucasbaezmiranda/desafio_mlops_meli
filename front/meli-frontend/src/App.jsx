import React, { useState } from 'react';
import axios from 'axios';
import { Calculator, Loader2, Home, Info } from 'lucide-react';

// URL de tu API en AWS
const API_URL = "https://qgzm7dy75b.execute-api.us-east-1.amazonaws.com/prod/predict";

function App() {
  // Estado simplificado: Solo las 5 variables maestras del modelo ElasticNet
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
      // Enviamos solo los datos requeridos por el nuevo PropertyInput del main.py
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
      // Solo 'l2' es string, el resto deben ser números para el modelo
      [name]: name === "l2" ? value : parseFloat(value)
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '40px', fontFamily: 'system-ui, -apple-system' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', background: '#e3f2fd', borderRadius: '12px', marginBottom: '15px' }}>
            <Calculator size={32} color="#3483fa" />
          </div>
          <h1 style={{ margin: 0, color: '#1d1d1f', fontSize: '24px' }}>Tasador MLOps</h1>
          <p style={{ color: '#86868b', fontSize: '14px', marginTop: '5px' }}>Basado en ElasticNet (6 features clave)</p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#444' }}>Ubicación</label>
            <select name="l2" value={formData.l2} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '16px' }}>
              <option value="Capital Federal">Capital Federal (CABA)</option>
              <option value="Buenos Aires Interior">Buenos Aires Interior</option>
              <option value="Bs.As. G.B.A. Zona Norte">G.B.A. Zona Norte</option>
              <option value="Bs.As. G.B.A. Zona Sur">G.B.A. Zona Sur</option>
              <option value="Bs.As. G.B.A. Zona Oeste">G.B.A. Zona Oeste</option>
              <option value="Córdoba">Córdoba</option>
              <option value="Santa Fe">Santa Fe</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#444' }}>Dormitorios</label>
              <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} min="0" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d2d2d7', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#444' }}>Baños</label>
              <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} min="1" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d2d2d7', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#444' }}>Superficie Total (m²)</label>
              <input type="number" name="surface_total" value={formData.surface_total} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d2d2d7', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#444' }}>Superficie Cubierta (m²)</label>
              <input type="number" name="surface_covered" value={formData.surface_covered} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d2d2d7', boxSizing: 'border-box' }} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: '10px', padding: '16px', backgroundColor: '#3483fa', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: 'background 0.2s' }}>
            {loading ? <Loader2 style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} /> : "Calcular Tasación"}
          </button>
        </form>

        {prediction && (
          <div style={{ marginTop: '30px', padding: '25px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e1e4e8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3483fa', marginBottom: '10px' }}>
              <Home size={18} />
              <span style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Precio Estimado</span>
            </div>
            <h2 style={{ margin: '0 0 15px 0', color: '#1d1d1f', fontSize: '32px' }}>
              USD {prediction.precio_predicho.toLocaleString()}
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #eee' }}>
              <Info size={16} color="#666" style={{ marginTop: '2px' }} />
              <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                <strong>Lógica del modelo:</strong> Cada baño adicional incrementa el valor en aprox. <strong>USD 108k</strong>.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;