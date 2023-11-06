import { array } from 'prop-types';
import React from 'react';
import '../styles/Banner.css'
import Slide from './Slide'
import { useState } from 'react'



function Banner(props) {
	
	if(props.games.data ) {
		var tonightGames=props.games.data;
		var numberOfGames=tonightGames.length;
		
		for (let key = 0; key < numberOfGames; key++) {
			tonightGames[key]['id'] = key;
		}

		var slide1=tonightGames.slice(0,5);
		var slide2=tonightGames.slice(5,10);
		var slide3=tonightGames.slice(10);

		

	}
	
		const date = new Date()
		const options = { weekday: 'long', day: 'numeric' , month: 'long'}
		var tonight = date.toLocaleDateString("fr",options)	
	
	//{typeof tonight !== 'undefined' && tonight}
	return (<div className="mx-auto">   
				<h1 className="d-flex justify-content-center whitetitle"> Matchs à venir</h1>
				<div id="carouselExampleIndicators" className="carousel slide" data-ride="carousel">
					<div className="carousel-inner">
            		{ typeof slide1 !== 'undefined'  && (
						<Slide  games={slide1}  alt='First slide' count={numberOfGames} gameNumber={props.gameNumber} setGameNumber={props.setGameNumber} setGameId={props.setGameId}/>)}
					{ typeof slide2 !== 'undefined'&& numberOfGames>5 && (
						<Slide games={slide2} count={numberOfGames}  alt='Second slide'  gameNumber={props.gameNumber} setGameNumber={props.setGameNumber} setGameId={props.setGameId}/>)}
						{ typeof slide2 !== 'undefined' && numberOfGames>10 && (
						<Slide games={slide3} count={numberOfGames}  alt='Third slide'  gameNumber={props.gameNumber} setGameNumber={props.setGameNumber} setGameId={props.setGameId}/>)}
					</div>	
				</div>
			</div>
			)
}

export default Banner
