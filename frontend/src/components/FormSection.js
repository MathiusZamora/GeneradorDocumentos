import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FormSection = ({ title, fields, allowMultipleItems = false, itemField, onSubmitSuccess }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState(allowMultipleItems ? [{ [itemField.name]: '' }] : []);

  const formik = useFormik({
    initialValues: {
      ...fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}),
      ...(allowMultipleItems ? { [itemField.name + 's']: items } : {}),
    },
    validationSchema: Yup.object({
      ...fields.reduce((acc, field) => ({
        ...acc,
        [field.name]: field.required ? Yup.string().required('Requerido') : Yup.string(),
      }), {}),
      ...(allowMultipleItems
        ? {
            [itemField.name + 's']: Yup.array().of(
              Yup.object({
                [itemField.name]: itemField.required
                  ? Yup.string().required('Requerido')
                  : Yup.string(),
              })
            ).min(1, 'Debe agregar al menos un elemento'),
          }
        : {}),
    }),
    onSubmit: async (values) => {
      try {
        const payload = allowMultipleItems
          ? { tipoFormulario: title, ...values, bienServicios: values.bienServicios }
          : { tipoFormulario: title, ...values };
        console.log('Payload enviado al backend:', payload); // Depuración
        const response = await axios.post(
          'http://localhost:5000/api/generar-word',
          payload,
          { responseType: 'blob' }
        );
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${title}.docx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
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

  const handleAddItem = () => {
    const newItems = [...items, { [itemField.name]: '' }];
    setItems(newItems);
    formik.setFieldValue(itemField.name + 's', newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    formik.setFieldValue(itemField.name + 's', newItems);
  };

  const handleItemChange = (index, value) => {
    const newItems = [...items];
    newItems[index][itemField.name] = value;
    setItems(newItems);
    formik.setFieldValue(itemField.name + 's', newItems);
  };

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
          {allowMultipleItems && (
            <div className="items-section">
              <h3>{itemField.label}(s)</h3>
              {items.map((item, index) => (
                <div key={index} className="item-group">
                  <input
                    type="text"
                    value={item[itemField.name]}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    onBlur={() => formik.setFieldTouched(itemField.name + 's')}
                    placeholder={itemField.label}
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="remove-item-btn"
                      onClick={() => handleRemoveItem(index)}
                    >
                      Eliminar
                    </button>
                  )}
                  {formik.touched[itemField.name + 's'] &&
                  formik.errors[itemField.name + 's'] &&
                  formik.errors[itemField.name + 's'][index] ? (
                    <p className="error">
                      {formik.errors[itemField.name + 's'][index][itemField.name]}
                    </p>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                className="add-item-btn"
                onClick={handleAddItem}
              >
                Agregar {itemField.label}
              </button>
              {formik.touched[itemField.name + 's'] &&
              formik.errors[itemField.name + 's'] &&
              typeof formik.errors[itemField.name + 's'] === 'string' ? (
                <p className="error">{formik.errors[itemField.name + 's']}</p>
              ) : null}
            </div>
          )}
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