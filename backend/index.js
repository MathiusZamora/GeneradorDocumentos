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
    const { tipoFormulario, bienServicios, ...datos } = req.body;
    console.log('Datos recibidos en el backend:', { tipoFormulario, bienServicios, ...datos });

    let plantillaPath;

    if (tipoFormulario === 'Solicitud de Abastecimiento Servicio/Reparación') {
      plantillaPath = 'FormatoISOAbasBienServ.docx';
    } else if (tipoFormulario === 'Control de Horas Extras') {
      plantillaPath = 'ControlHorasExtras.docx';
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
      bienServiciosList: bienServicios ? bienServicios.map(item => item.bienServicio).join('\n') : '',
      bienServicios: bienServicios || [], // Mantener para compatibilidad
    };
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