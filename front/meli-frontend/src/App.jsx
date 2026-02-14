import React, { useState } from 'react';
import axios from 'axios';
import { Calculator, Loader2 } from 'lucide-react';

const API_URL = "https://qgzm7dy75b.execute-api.us-east-1.amazonaws.com/prod/predict";

function App() {
  const [formData, setFormData] = useState({
    lat: -34.6037, lon: -58.3816, l2: "Capital Federal",
    property_type: "Departamento", rooms: 3, bedrooms: 2,
    bathrooms: 1, surface_total: 80, surface_covered: 70
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
      alert("Error al conectar con la API de AWS.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ["l2", "property_type"].includes(name) ? value : parseFloat(value)
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '40px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#333' }}>
          <Calculator color="#3483fa" /> Tasador de Propiedades
        </h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Barrio (l2)</label>
            <select name="l2" value={formData.l2} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
              <option value="Capital Federal">Capital Federal</option>
              <option value="Bs.As. G.B.A. Zona Norte">Zona Norte</option>
              <option value="Bs.As. G.B.A. Zona Sur">Zona Sur</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Tipo de Propiedad</label>
            <select name="property_type" value={formData.property_type} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
              <option value="Departamento">Departamento</option>
              <option value="Casa">Casa</option>
              <option value="PH">PH</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '14px' }}>Sup. Total (m²)</label>
            <input type="number" name="surface_total" value={formData.surface_total} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '14px' }}>Sup. Cubierta (m²)</label>
            <input type="number" name="surface_covered" value={formData.surface_covered} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '14px' }}>Ambientes</label>
            <input type="number" name="rooms" value={formData.rooms} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '14px' }}>Dormitorios</label>
            <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '14px' }}>Baños</label>
            <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
          </div>

          <button type="submit" disabled={loading} style={{ gridColumn: 'span 2', padding: '14px', backgroundColor: '#3483fa', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            {loading ? <Loader2 style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} /> : "CALCULAR PRECIO ESTIMADO"}
          </button>
        </form>

        {prediction && (
          <div style={{ marginTop: '25px', padding: '20px', background: '#e3f2fd', borderRadius: '8px', borderLeft: '6px solid #3483fa' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Resultado:</p>
            <h2 style={{ margin: '5px 0', color: '#1976d2' }}>USD {prediction.precio_predicho.toLocaleString()}</h2>
            <small style={{ color: '#555' }}>{prediction.propiedad}</small>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;