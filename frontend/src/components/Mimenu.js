import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const MainMenu = () => {
  const [isOverlayActive, setIsOverlayActive] = useState(false);

  const handleOverlayToggle = () => {
    setIsOverlayActive(!isOverlayActive);
  };

  return (
    <div>
      <div className={`overlay-navigation ${isOverlayActive ? 'overlay-active' : ''}`}>
        <nav role="navigation">
          <ul>
            <li className={isOverlayActive ? 'slide-in-nav-item' : 'slide-in-nav-item-reverse'}>
              <Link to="/solicitud-abastecimiento" data-content="Realzar Solicitud">
                Solicitud de Abastecimiento
              </Link>
            </li>
            <li className={isOverlayActive ? 'slide-in-nav-item-delay-1' : 'slide-in-nav-item-delay-1-reverse'}>
              <Link to="/control-horas-extras" data-content="Realizar gestion de Horas Extras">
                Control de Horas Extras
              </Link>
            </li>
            <li className={isOverlayActive ? 'slide-in-nav-item-delay-2' : 'slide-in-nav-item-delay-2-reverse'}>
              <Link to="/acta-entrega" data-content="Realizar Acta de Entrega">
                Acta de Entrega
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <section className="home">
        <div className="open-overlay" onClick={handleOverlayToggle}>
          <span className={`bar-top ${isOverlayActive ? 'animate-top-bar' : 'animate-out-top-bar'}`}></span>
          <span className={`bar-middle ${isOverlayActive ? 'animate-middle-bar' : 'animate-out-middle-bar'}`}></span>
          <span className={`bar-bottom ${isOverlayActive ? 'animate-bottom-bar' : 'animate-out-bottom-bar'}`}></span>
        </div>
      </section>
    </div>
  );
};

export default MainMenu;