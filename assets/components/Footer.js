import React from 'react';

const Footer = () => {
  return (
    <footer style={footerStyle} className='col-10 m-auto bg-dark text-white d-flex justify-content-around'>
      <p onClick={() => scrollTo({top: 100,behavior: "smooth"})}>Revenir en haut de page</p>
      <p>&copy; balldontlie.fr</p>
      <p>Designed by <a href="https://paulchasseuil.fr">PaulChasseuil</a></p>
    </footer>
  );
};

const footerStyle = {
  textAlign: 'center',
  padding: '10px',
  marginTop: '4rem !important',
  paddingTop:'30px',
  opacity: '0.8',
  borderRadius: '10px'
};

export default Footer;