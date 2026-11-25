import React from 'react';
import { useState, useEffect } from 'react';
import CanvasJSReact from './canvasjs.react';

function StatGraph(props) {
	
	const [options,setOptions] = useState(0);
	const [isLoaded,setIsLoaded] = useState(false);
	var CanvasJS = CanvasJSReact.CanvasJS;
    var CanvasJSChart = CanvasJSReact.CanvasJSChart;
	
	
	useEffect(() => {

		var graphUrl = 'https://balldontlie.fr/index.php/graph/' + props.graphParam[1] +'/' + props.graphParam[0] ;

		// Le graphe est secondaire : en cas d'échec de l'API on ne plante pas et on
		// ne laisse pas de données partielles — on log simplement et on n'affiche rien.
		fetch(graphUrl)
			.then((response) => {
				if (!response.ok) throw new Error('HTTP ' + response.status);
				return response.json();
			})
			.then((a) => {
				if (!a || !a.data || !Array.isArray(a.data.label) || !Array.isArray(a.data.value)) {
					throw new Error('données de graphe invalides');
				}
				setOptions({
					title: {
						text: a.data.stat + ' - ' + a.data.title
					},
					data: [{
						type: "line",
						dataPoints: a.data.label.map((label, i) => ({ label, y: a.data.value[i] })),
					}]
				});
				setIsLoaded(true);
				const el = document.getElementById('playerGraph');
				if (el) el.style.display = "block";
			})
			.catch((error) => console.error('Error fetching graph:', error));
	}, [props])
		
		function hide()
		{
			document.getElementById('playerGraph').style.display = "none";			
		}


		const delay = ms => new Promise(
			resolve => setTimeout(resolve, ms)
		  );
				
		return (
			<div id="playerGraph" style={{opacity:"0.8",borderRadius:"1rem"}}> 
			{isLoaded && <i className="fa fa-window-close" aria-hidden="true" style={{position:"relative",left:"94%",top:"3rem",zIndex:"1",fontSize:"3rem"}} 
			onClick={()=>hide()}></i>} 
			{options !== 0 && 
			<CanvasJSChart options = {options} 
				/* onRef = {ref => this.chart = ref} */
			/>}
			</div>
		);
		  
}

export default StatGraph;
