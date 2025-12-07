import { createSignal, type JSX, onCleanup, onMount, Show } from "solid-js";

interface PopoverProps {
	trigger: (props: { isOpen: boolean; toggle: () => void }) => JSX.Element;
	children: (props: { close: () => void }) => JSX.Element;
}

export const Popover = (props: PopoverProps) => {
	const [isOpen, setIsOpen] = createSignal(false);
	let containerRef: HTMLDivElement | undefined;

	function toggle() {
		setIsOpen(!isOpen());
	}

	function close() {
		setIsOpen(false);
	}

	function handleClickOutside(event: MouseEvent) {
		if (containerRef && !containerRef.contains(event.target as Node)) {
			setIsOpen(false);
		}
	}

	onMount(() => {
		document.addEventListener("mousedown", handleClickOutside);
		onCleanup(() => {
			document.removeEventListener("mousedown", handleClickOutside);
		});
	});

	return (
		<div class="relative" ref={containerRef}>
			{props.trigger({ isOpen: isOpen(), toggle })}
			<Show when={isOpen()}>
				<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 min-w-max">
					<div class="glass-panel p-2.5 rounded-xl">
						{props.children({ close })}
					</div>
				</div>
			</Show>
		</div>
	);
};
