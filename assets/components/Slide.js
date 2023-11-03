import React from 'react';
import GameButton from './GameButton'



function Slide(props) {
    return (
            <div className={"carousel-item "+(props.alt == 'First slide' ? 'active':'')}>
                    <ul className="row d-flex d-block w-100 justify-content-around" alt={props.alt}>
                        
                        {typeof props.games !== 'undefined' && props.games.map(({ GameId, HomeLogoUrl, AwayLogoUrl, homeScore, awayScore, Time , id}) => (
                            
                            <li key={id} className="col-md-2 col-sm-4"><GameButton GameId={GameId} HomeLogoUrl={HomeLogoUrl} AwayLogoUrl={AwayLogoUrl} homeScore={homeScore} awayScore={awayScore} Time={Time} gameNumber={props.gameNumber} setGameNumber = {props.setGameNumber} id={id}/></li>
                        ))}
                    </ul>
                
                    {props.count>5 && ( <ol className="carousel-indicators">
                    <li data-target="#carouselExampleIndicators" data-slide-to="0" className={props.alt == 'First slide' ? 'active':''}></li>   
                    <li data-target="#carouselExampleIndicators" data-slide-to="1" className={props.alt == 'Second slide' ?'active':''}></li>      
                    {props.count>10 && (<li data-target="#carouselExampleIndicators" data-slide-to="2" className={props.alt == 'Third slide' ?'active':''}></li>)}  
                </ol>)}      

            </div>   
        )
}

export default Slide