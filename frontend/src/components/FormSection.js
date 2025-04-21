import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FormSection = ({ title, fields, allowMultipleItems = false, itemField, itemFields, onSubmitSuccess }) => {
  const navigate = useNavigate();
  const initialItem = itemFields
    ? itemFields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
    : { [itemField.name]: '' };
  const [items, setItems] = useState(allowMultipleItems ? [initialItem] : []);

  const formik = useFormik({
    initialValues: {
      ...fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}),
      ...(allowMultipleItems ? { horasExtras: items } : {}),
    },
    validationSchema: Yup.object({
      ...fields.reduce((acc, field) => ({
        ...acc,
        [field.name]: field.required ? Yup.string().required('Requerido') : Yup.string(),
      }), {}),
      ...(allowMultipleItems
        ? {
            horasExtras: Yup.array().of(
              Yup.object(
                (itemFields || [itemField]).reduce((acc, field) => ({
                  ...acc,
                  [field.name]: field.required
                    ? Yup.string().required('Requerido')
                    : Yup.string(),
                }), {})
              )
            ).min(1, 'Debe agregar al menos una entrada'),
          }
        : {}),
    }),
    onSubmit: async (values) => {
      try {
        const payload = allowMultipleItems
          ? {
              tipoFormulario: title,
              ...values,
              ...(title === 'Solicitud de Abastecimiento Servicio/Reparación'
                ? { bienServicios: values.horasExtras }
                : { horasExtras: values.horasExtras }),
            }
          : { tipoFormulario: title, ...values };
        console.log('Payload enviado al backend:', payload);
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

  const calculateTiempoTotal = (inicio, finalizacion) => {
    if (inicio && finalizacion) {
      const inicioDate = new Date(`1970-01-01T${inicio}:00`);
      const finDate = new Date(`1970-01-01T${finalizacion}:00`);
      const diffMs = finDate - inicioDate;
      const diffHrs = diffMs / (1000 * 60 * 60);
      return diffHrs >= 0 ? diffHrs.toFixed(2) : '0.00';
    }
    return '';
  };

  const handleAddItem = () => {
    const newItems = [...items, { ...initialItem }];
    setItems(newItems);
    formik.setFieldValue('horasExtras', newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    formik.setFieldValue('horasExtras', newItems);
  };

  const handleItemChange = (index, fieldName, value) => {
    const newItems = [...items];
    newItems[index][fieldName] = value;

    if (title === 'Control de Horas Extras' && (fieldName === 'inicio' || fieldName === 'finalizacion')) {
      const { inicio, finalizacion } = newItems[index];
      newItems[index].tiempoTotal = calculateTiempoTotal(inicio, finalizacion);
    }

    setItems(newItems);
    formik.setFieldValue('horasExtras', newItems);
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
              <h3>{itemFields ? 'Entradas de Horas Extras' : itemField.label + '(s)'}</h3>
              {items.map((item, index) => (
                <div key={index} className="item-group">
                  {(itemFields || [itemField]).map((field) => (
                    <div key={field.name} className="form-group">
                      <label>{field.label}</label>
                      <input
                        type={field.type || 'text'}
                        value={item[field.name]}
                        onChange={(e) => handleItemChange(index, field.name, e.target.value)}
                        onBlur={() => formik.setFieldTouched('horasExtras')}
                        placeholder={field.label}
                        readOnly={field.readOnly || false}
                      />
                      {formik.touched.horasExtras &&
                      formik.errors.horasExtras &&
                      formik.errors.horasExtras[index] &&
                      formik.errors.horasExtras[index][field.name] ? (
                        <p className="error">{formik.errors.horasExtras[index][field.name]}</p>
                      ) : null}
                    </div>
                  ))}
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="remove-item-btn"
                      onClick={() => handleRemoveItem(index)}
                    >
                      Eliminar Entrada
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="add-item-btn" onClick={handleAddItem}>
                Agregar Entrada
              </button>
              {formik.touched.horasExtras &&
              formik.errors.horasExtras &&
              typeof formik.errors.horasExtras === 'string' ? (
                <p className="error">{formik.errors.horasExtras}</p>
              ) : null}
            </div>
          )}
        </div>
        <div className="button-group">
          <button type="submit" className="submit-btn">
            Generar Word
          </button>
          <button type="button" className="back-btn" onClick={() => navigate('/')}>
            Volver al Menú
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormSection;