import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FormSection = ({ title, fields, onSubmitSuccess }) => {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}),
    validationSchema: Yup.object(
      fields.reduce((acc, field) => ({
        ...acc,
        [field.name]: field.required ? Yup.string().required('Requerido') : Yup.string(),
      }), {})
    ),
    onSubmit: async (values) => {
      try {
        const response = await axios.post(
          'http://localhost:5000/api/generar-word',
          { tipoFormulario: title, ...values },
          { responseType: 'blob' }
        );
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${title}.docx`);
        document.body.appendChild(link);
        link.click();
        onSubmitSuccess();
      } catch (error) {
        console.error('Error al generar el documento:', error);
      }
    },
  });

  useEffect(() => {
    if (title === 'Control de Horas Extras') {
      const inicio = formik.values.inicio;
      const finalizacion = formik.values.finalizacion;

      if (inicio && finalizacion) {
        const inicioDate = new Date(`1970-01-01T${inicio}:00`);
        const finDate = new Date(`1970-01-01T${finalizacion}:00`);
        const diffMs = finDate - inicioDate;
        const diffHrs = diffMs / (1000 * 60 * 60);
        const tiempoTotal = diffHrs >= 0 ? diffHrs.toFixed(2) : '0.00';
        formik.setFieldValue('tiempoTotal', tiempoTotal);
      } else {
        formik.setFieldValue('tiempoTotal', '');
      }
    }
  }, [formik.values.inicio, formik.values.finalizacion]);

  return (
    <div className="form-section">
      <h2>{title}</h2>
      <form onSubmit={formik.handleSubmit}>
        <div className="form-grid">
          {fields.map((field) => (
            <div key={field.name} className="form-group">
              <label>{field.label}</label>
              <input
                type={field.type || 'text'}
                name={field.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values[field.name]}
                readOnly={field.readOnly || false}
              />
              {formik.touched[field.name] && formik.errors[field.name] ? (
                <p className="error">{formik.errors[field.name]}</p>
              ) : null}
            </div>
          ))}
        </div>
        <div className="button-group">
          <button type="submit" className="submit-btn">
            Generar Word
          </button>
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate('/')}
          >
            Volver al Menú
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormSection;