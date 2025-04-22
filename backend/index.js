const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generar-word', (req, res) => {
  try {
    const { tipoFormulario, bienServicios, horasExtras, ...datos } = req.body;
    console.log('Datos recibidos en el backend:', { tipoFormulario, bienServicios, horasExtras, ...datos });

    let plantillaPath;

    if (tipoFormulario === 'Solicitud de Abastecimiento Servicio/Reparación') {
      plantillaPath = 'FormatoISOAbasBienServ.docx';
    } else if (tipoFormulario === 'Control de Horas Extras') {
      plantillaPath = 'ControlHorasExtras.docx';
    } else if (tipoFormulario === 'Acta de Entrega') {
      plantillaPath = 'ActadeEntrega.docx';
    } else {
      throw new Error('Tipo de formulario no válido');
    }

    const fullPath = path.resolve(__dirname, plantillaPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`La plantilla ${plantillaPath} no se encuentra en el directorio`);
    }

    const contenido = fs.readFileSync(fullPath, 'binary');
    const zip = new PizZip(contenido);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    const data = {
      ...datos,
      ...(tipoFormulario === 'Solicitud de Abastecimiento Servicio/Reparación'
        ? {
            bienServiciosList: bienServicios ? bienServicios.map(item => item.bienServicio).join('\n') : '',
            bienServicios: bienServicios || [],
          }
        : {}),
    };

    if (tipoFormulario === 'Control de Horas Extras') {
      const maxEntries = 5;
      const horasExtrasData = {};
      let totalHoras = 0;

      (horasExtras || []).slice(0, maxEntries).forEach((entry, index) => {
        const suffix = index === 0 ? '' : index + 1;
        horasExtrasData[`fecha${suffix}`] = entry.fecha || '';
        horasExtrasData[`motivo${suffix}`] = entry.motivo || '';
        horasExtrasData[`inicio${suffix}`] = entry.inicio || '';
        horasExtrasData[`finalizacion${suffix}`] = entry.finalizacion || '';
        horasExtrasData[`tiempoTotal${suffix}`] = entry.tiempoTotal || '0.00';
        totalHoras += parseFloat(entry.tiempoTotal || 0);
      });

      for (let i = (horasExtras || []).length; i < maxEntries; i++) {
        const suffix = i === 0 ? '' : i + 1;
        horasExtrasData[`fecha${suffix}`] = '';
        horasExtrasData[`motivo${suffix}`] = '';
        horasExtrasData[`inicio${suffix}`] = '';
        horasExtrasData[`finalizacion${suffix}`] = '';
        horasExtrasData[`tiempoTotal${suffix}`] = '';
      }

      data.horasExtras = horasExtras || [];
      data.totalHoras = totalHoras.toFixed(2);
      Object.assign(data, horasExtrasData);
    }

    if (tipoFormulario === 'Acta de Entrega') {
      const maxEntries = 7;
      const equiposData = {};

      (horasExtras || []).slice(0, maxEntries).forEach((entry, index) => {
        const idx = index + 1;
        equiposData[`equipo${idx}`] = entry.equipo || '';
        equiposData[`descripcion${idx}`] = entry.descripcion || '';
        equiposData[`marca${idx}`] = entry.marca || '';
        equiposData[`modelo${idx}`] = entry.modelo || '';
        equiposData[`n_s${idx}`] = entry.n_s || '';
      });

      for (let i = (horasExtras || []).length; i < maxEntries; i++) {
        const idx = i + 1;
        equiposData[`equipo${idx}`] = '';
        equiposData[`descripcion${idx}`] = '';
        equiposData[`marca${idx}`] = '';
        equiposData[`modelo${idx}`] = '';
        equiposData[`n_s${idx}`] = '';
      }

      data.horasExtras = horasExtras || [];
      Object.assign(data, equiposData);
    }

    console.log('Datos enviados a Docxtemplater:', data);
    doc.setData(data);
    doc.render();

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    res.setHeader('Content-Disposition', `attachment; filename=${tipoFormulario}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error('Error en el servidor:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).send(`Error al generar el documento: ${error.message}`);
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));