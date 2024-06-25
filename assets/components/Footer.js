import React from 'react';

/** si offre d'affiliation : 
<p class="col-12 p-3" style={{fontSize:"0.8rem",fontStyle:"oblique"}}>      <img class="footer18" loading="lazy" src="moins18.png" width="120" style={{float:'left'}}/>
Les jeux d'argent et de hasard sont interdits aux mineurs. Ne misez pas des sommes d'argent supérieures à ce que vous pourriez perdre. Jouer comporte des risques:endettement, dépendance, isolement. Appelez le 09 74 75 13 13 (appel non surtaxé)</p>
**/
const Footer = () => {
  return (
    <footer style={footerStyle} className='col-10 m-auto bg-dark text-white '>
      <div className="d-flex justify-content-around">
      <p onClick={() => scrollTo({top: 100,behavior: "smooth"})}>Revenir en haut de page</p>
      <p><a href="https://paulchasseuil.fr" style={{color:'white'}}> Balldontlie </a></p>
      </div>
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