import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1>Generador de Documentos</h1>
      <div className="menu">
        <button
          className="menu-btn"
          onClick={() => navigate('/solicitud-abastecimiento')}
        >
          Solicitud de Abastecimiento Servicio/Reparación
        </button>
        <button
          className="menu-btn"
          onClick={() => navigate('/control-horas-extras')}
        >
          Control de Horas Extras
        </button>
      </div>
    </div>
  );
};

export default MainMenu;