interface Props {
	canvasRef: (el: HTMLCanvasElement) => void;
	width: number;
	height: number;
	onMouseDown: (event: MouseEvent) => void;
	onMouseMove: (event: MouseEvent) => void;
	onMouseUp: () => void;
	onWheel: (event: WheelEvent) => void;
}

export function Canvas(props: Props) {
	return (
		<canvas
			ref={props.canvasRef}
			width={props.width}
			height={props.height}
			class="absolute top-0 left-0 block touch-none"
			onMouseDown={props.onMouseDown}
			onMouseMove={props.onMouseMove}
			onMouseUp={props.onMouseUp}
			onMouseLeave={props.onMouseUp}
			onWheel={props.onWheel}
			onContextMenu={(e) => e.preventDefault()}
		/>
	);
}
