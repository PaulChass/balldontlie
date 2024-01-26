import React from 'react';

import {useEffect } from 'react';
import { useState } from 'react'


/**function FrenchGameTime(usTime) {

	var time = []
	var text = ''
	usTime.substring(1, 2) === ":" ?
		time = [parseInt(usTime.substring(0)), usTime.substring(2, 4)] : time = [parseInt(usTime.substring(0, 2)), usTime.substring(3, 5)]

	time[0] < 6 ?
			text = (time[0] +6 ).toString() + ':' + time[1].toString() + ' PM '
			:
			text = (time[0] + 6 - 12).toString() + ':' + time[1].toString() + ' AM '
	return usTime;


}**/
function GameButton(props) {
	const [isNotSet, setIsNotSet] = useState(true);

	
	var teams = [
		"Atlanta Hawks",
		"Boston Celtics",
		"Cleveland Cavaliers",
		"New Orleans Pelicans",
		"Chicago Bulls",
		"Dallas Mavericks",
		"Denver Nuggets",
		"Golden State Warriors",
		"Houston Rockets",
		"LA Clippers",
		"Los Angeles Lakers",
		"Miami Heat",
		"Milwaukee Bucks",
		"Minnesota Timberwolves",
		"Brooklyn Nets",
		"New York Knicks",
		"Orlando Magic",
		"Indiana Pacers",
		"Philadelphia 76ers",
		"Phoenix Suns",
		"Portland Trail Blazers",
		"Sacramento Kings",
		"San Antonio Spurs",
		"Oklahoma City Thunder",
		"Toronto Raptors",
		"Utah Jazz",
		"Memphis Grizzlies",
		"Washington Wizards",
		"Detroit Pistons",
		"Charlotte Hornets"
	];
	const date = props.Time;

	useEffect(() => {
        if(props.gameNumber==0 && isNotSet){
			if(props.id==0){
				props.setGameId(props.gameId);
				props.setStartTime(props.Time);
			props.setStartDate(props.day);}
			setIsNotSet(false);
		}        
    });
	if(props.gameId == props.changeGameId){
		changeGame();
		props.setChangeGameId(0);
	}


	function changeGame(){
		props.setGameNumber(props.id);
		props.setGameId(props.gameId);
		props.setStartTime(props.Time);
		props.setStartDate(props.day);
		if(props.menuItem==0 || props.menuItem == 2){
			props.setMenuItem(3);
		}
		props.setHTeamName(teams[props.HomeTeamId - 1610612737]);
		props.setATeamName(teams[props.AwayTeamId - 1610612737]);
	}

	
	
	return (
		<button className="card bg-dark" onClick={() => changeGame()} >
			<div className="list-group-item" >
				<img src={props.HomeLogoUrl} className="cardLogo" />
			</div>
			<div className="list-group-item" >
				<img src={props.AwayLogoUrl} className="cardLogo" />
			</div>
			<div className="list-group-item"><span className="mx_auto card-text" >
				{props.status == 1 ? date : props.statusText}</span></div>
		
		</button>
	)
}

export default GameButton