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
    const { tipoFormulario, ...datos } = req.body;
    console.log('Datos recibidos en el backend:', datos); // Depuración

    let plantillaPath;

    // Seleccionar la plantilla según el tipo de formulario
    if (tipoFormulario === 'Solicitud de Abastecimiento Servicio/Reparación') {
      plantillaPath = 'FormatoISOAbasBienServ.docx';
    } else if (tipoFormulario === 'Control de Horas Extras') {
      plantillaPath = 'ControlHorasExtras.docx';
    } else {
      throw new Error('Tipo de formulario no válido');
    }

    console.log('Intentando leer la plantilla:', plantillaPath); // Depuración
    const fullPath = path.resolve(__dirname, plantillaPath);
    console.log('Ruta completa de la plantilla:', fullPath); // Depuración

    // Verificar si el archivo existe
    if (!fs.existsSync(fullPath)) {
      throw new Error(`La plantilla ${plantillaPath} no se encuentra en el directorio`);
    }

    const contenido = fs.readFileSync(fullPath, 'binary');
    const zip = new PizZip(contenido);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    console.log('Datos enviados a Docxtemplater:', datos); // Depuración
    doc.setData(datos);
    doc.render();

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    res.setHeader('Content-Disposition', `attachment; filename=${tipoFormulario}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error('Error en el servidor:', error.message); // Mostrar el mensaje de error específico
    console.error('Stack trace:', error.stack); // Mostrar la traza completa para depuración
    res.status(500).send(`Error al generar el documento: ${error.message}`);
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));