import React from 'react';
import FormSection from './FormSection';

const ActaEntrega = () => {
  const handleSuccess = () => alert('Documento generado con éxito');

  const fields = [
    { name: 'fecha', label: 'Fecha', type: 'date', required: true },
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'cedula', label: 'Número de Cédula', required: true },
    { name: 'puesto', label: 'Puesto', required: true },
    { name: 'producto', label: 'Producto', required: true },
  ];

  const itemFields = [
    { name: 'equipo', label: 'Equipo (cantidad)', required: true },
    { name: 'descripcion', label: 'Descripción', required: false },
    { name: 'marca', label: 'Marca', required: true },
    { name: 'modelo', label: 'Modelo', required: false },
    { name: 'n_s', label: 'N° S', required: false },
  ];

  return (
    <div className="container">
      <h1>Generador de Documentos de Técnica</h1>
      <FormSection
        title="Acta de Entrega"
        fields={fields}
        allowMultipleItems={true}
        itemFields={itemFields}
        onSubmitSuccess={handleSuccess}
        maxItems={7} // Límite de 7 entradas
      />
    </div>
  );
};

export default ActaEntrega;