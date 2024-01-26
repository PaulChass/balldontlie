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

		const graphStats = fetch(graphUrl) //1
		.then((response) => response.json()) //2
		.then((graph) => {
			setIsLoaded(true);
			return graph
			
		});

		
		graphStats.then((a) => {
			setOptions({
				title: {
				text: a.data.stat + ' - ' + a.data.title
				},
				data: [{				
						type: "line",
						dataPoints: [
							{ label: a.data.label[0],  y: a.data.value[0] },
							{ label: a.data.label[1],  y: a.data.value[1] },							
							{ label: a.data.label[2],  y: a.data.value[2] },
							{ label: a.data.label[3],  y: a.data.value[3] },
							{ label: a.data.label[4],  y: a.data.value[4] }
						]
				}]
			})

			})
			document.getElementById('playerGraph').style.display = "block";			
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
