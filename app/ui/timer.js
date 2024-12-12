'use client'
import React, { useEffect, useState, } from "react";


export function Timer(props) {

	const [time, setTime] = useState(props.initial)
	const [run, setRun] = useState(true)

	useEffect(()=>{
		if(!run || time === 0) return;

		const timer = setInterval(()=>
			setTime((tmp)=>{
				if(tmp <= 0) return 0
				return tmp-1
			}), 1000 )
		return ()=>clearInterval(timer)

	},[run])
	
	

function stopTimer(){
	setRun(false)
}

	return (
		<div className="mt-100 layout-column align-items-center justify-content-center">
			<div className="timer-value" data-testid="timer-value">{time}</div>
			<button className="large" data-testid="stop-button" onClick={()=>stopTimer()}>Stop Timer</button>
		</div>
	);

}