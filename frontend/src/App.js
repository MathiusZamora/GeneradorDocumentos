import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainMenu from './components/Mimenu';
import FormSection from './components/FormSection';
import ActaEntrega from './components/ActaEntrega';
import './App.css';

const App = () => {
  const solicitudFields = [
    { name: 'empresa', label: 'Empresa', required: true },
    { name: 'fecha', label: 'Fecha', type: 'date', required: true },
    { name: 'hora', label: 'Hora', type: 'time12h', required: true }, // Cambiado a time12h
    { name: 'solicitante', label: 'Solicitante', required: true },
    { name: 'area', label: 'Área', required: true },
  ];

  const horasExtrasFields = [
    { name: 'codigoMarcado', label: 'Código de Marcado', required: false },
    { name: 'area', label: 'Área', required: true },
    { name: 'empleado', label: 'Empleado', required: true },
  ];

  const horasExtrasItemFields = [
    { name: 'fecha', label: 'Fecha (día)', type: 'date', required: true },
    { name: 'motivo', label: 'Motivo', required: true },
    { name: 'inicio', label: 'Inicio (hora)', type: 'time', required: true },
    { name: 'finalizacion', label: 'Finalización (hora)', type: 'time', required: true },
    { name: 'tiempoTotal', label: 'Tiempo Total (horas)', type: 'text', readOnly: true },
  ];

  const handleSuccess = () => alert('Documento generado con éxito');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route
          path="/solicitud-abastecimiento"
          element={
            <div className="container">
              <h1>Generador de Documentos de Técnica</h1>
              <FormSection
                title="Solicitud de Abastecimiento Servicio/Reparación"
                fields={solicitudFields}
                allowMultipleItems={true}
                itemField={{ name: 'bienServicio', label: 'Bien y/o Servicio', required: true }}
                onSubmitSuccess={handleSuccess}
              />
            </div>
          }
        />
        <Route
          path="/control-horas-extras"
          element={
            <div className="container">
              <h1>Generador de Documentos de Técnica</h1>
              <FormSection
                title="Control de Horas Extras"
                fields={horasExtrasFields}
                allowMultipleItems={true}
                itemFields={horasExtrasItemFields}
                onSubmitSuccess={handleSuccess}
                maxItems={4}
              />
            </div>
          }
        />
        <Route
          path="/acta-entrega"
          element={<ActaEntrega />}
        />
      </Routes>
    </Router>
  );
};

export default App;