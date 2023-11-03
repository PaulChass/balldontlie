import React from 'react';

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

	const date = props.Time;
	
	return (
		<button className="card bg-dark" onClick={() => props.setGameNumber(props.id)} >
			<div className="list-group-item" >
				<img src={props.HomeLogoUrl} className="cardLogo" />
				<span>{props.awayScore}</span>
			</div>
			<div className="list-group-item" >
				<img src={props.AwayLogoUrl} className="cardLogo" />
				<span>{props.homeScore}</span>
			</div>
			<div className="list-group-item"><span className="mx_auto card-text" >
				{date}</span></div>
		
		</button>
	)
}

export default GameButton