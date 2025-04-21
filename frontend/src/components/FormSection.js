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
                  [field.name]:
                    field.name === 'inicio' || field.name === 'finalizacion'
                      ? field.required
                        ? Yup.string()
                            .required('Requerido')
                            .test('time-format', 'Formato inválido. Use e.g., 10:00 AM', (value) => {
                              if (!value) return false;
                              const regex = /^(1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$/;
                              return regex.test(value);
                            })
                        : Yup.string()
                      : field.required
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

  const parseTimeToMinutes = (time12h) => {
    if (!time12h) return 0;
    const regex = /^(1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$/;
    if (!regex.test(time12h)) return 0;
    const [time, modifier] = time12h.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (modifier === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    if (modifier === 'AM' && hours === 12) totalMinutes -= 12 * 60;
    return totalMinutes;
  };

  const calculateTiempoTotal = (inicio, finalizacion) => {
    if (!inicio || !finalizacion) return '';

    const inicioMinutes = parseTimeToMinutes(inicio);
    const finMinutes = parseTimeToMinutes(finalizacion);

    // Ya no verificamos si inicioMinutes o finMinutes son 0, porque 0 es un valor válido (e.g., "12:00 AM")
    let diffMinutes = finMinutes - inicioMinutes;
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Sumar 24 horas en minutos si cruza el día
    }

    const diffHrs = diffMinutes / 60;
    return diffHrs.toFixed(2);
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

  const handleTimeChange = (index, fieldName, { hours, minutes, ampm }) => {
    const newItems = [...items];
    const formattedTime = `${hours}:${minutes} ${ampm}`;
    newItems[index][fieldName] = formattedTime;

    if (title === 'Control de Horas Extras' && (fieldName === 'inicio' || fieldName === 'finalizacion')) {
      const { inicio, finalizacion } = newItems[index];
      newItems[index].tiempoTotal = calculateTiempoTotal(inicio, finalizacion);
    }

    setItems(newItems);
    formik.setFieldValue('horasExtras', newItems);
  };

  const parseTimeForSelect = (timeStr) => {
    if (!timeStr || !/^(1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$/.test(timeStr)) {
      return { hours: '1', minutes: '00', ampm: 'AM' };
    }
    const [time, ampm] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    return { hours, minutes, ampm };
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
                      {field.name === 'inicio' || field.name === 'finalizacion' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <select
                            value={parseTimeForSelect(item[field.name]).hours}
                            onChange={(e) =>
                              handleTimeChange(index, field.name, {
                                ...parseTimeForSelect(item[field.name]),
                                hours: e.target.value,
                              })
                            }
                            onBlur={() => formik.setFieldTouched('horasExtras')}
                          >
                            {[...Array(12)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                          :
                          <select
                            value={parseTimeForSelect(item[field.name]).minutes}
                            onChange={(e) =>
                              handleTimeChange(index, field.name, {
                                ...parseTimeForSelect(item[field.name]),
                                minutes: e.target.value,
                              })
                            }
                            onBlur={() => formik.setFieldTouched('horasExtras')}
                          >
                            {[...Array(60)].map((_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          <select
                            value={parseTimeForSelect(item[field.name]).ampm}
                            onChange={(e) =>
                              handleTimeChange(index, field.name, {
                                ...parseTimeForSelect(item[field.name]),
                                ampm: e.target.value,
                              })
                            }
                            onBlur={() => formik.setFieldTouched('horasExtras')}
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={item[field.name]}
                          onChange={(e) => handleItemChange(index, field.name, e.target.value)}
                          onBlur={() => formik.setFieldTouched('horasExtras')}
                          placeholder={field.label}
                          readOnly={field.readOnly || false}
                        />
                      )}
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