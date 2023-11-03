import React from 'react';
import { useState, useEffect } from 'react';
import CanvasJSReact from './canvasjs.react';

function StatGraph(props) {
	
	const [options,setOptions] = useState(0);
	var CanvasJS = CanvasJSReact.CanvasJS;
    var CanvasJSChart = CanvasJSReact.CanvasJSChart;
	
	
	useEffect(() => {
		var graphUrl = 'http://balldontlie.fr/index.php/graph/' + props.props[1] +'/' + props.props[0] ;

		const graphStats = fetch(graphUrl) //1
		.then((response) => response.json()) //2
		.then((graph) => {
			
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

		}, [props])
	
		
			
				
		return (
			<div> {options !== 0 && 
			<CanvasJSChart options = {options} 
				/* onRef = {ref => this.chart = ref} */
			/>}
			</div>
		);
		  
}

export default StatGraph;
