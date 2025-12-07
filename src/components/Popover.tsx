import { createSignal, type JSX, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";

interface PopoverProps {
	trigger: (props: { isOpen: boolean; toggle: () => void }) => JSX.Element;
	children: (props: { close: () => void }) => JSX.Element;
}

export const Popover = (props: PopoverProps) => {
	const [isOpen, setIsOpen] = createSignal(false);
	const [position, setPosition] = createSignal({ top: 0, left: 0 });
	let containerRef: HTMLDivElement | undefined;
	let contentRef: HTMLDivElement | undefined;

	function updatePosition() {
		if (containerRef) {
			const rect = containerRef.getBoundingClientRect();
			setPosition({
				top: rect.top - 8, // 8px gap above trigger
				left: rect.left + rect.width / 2,
			});
		}
	}

	function toggle() {
		if (!isOpen()) {
			updatePosition();
		}
		setIsOpen(!isOpen());
	}

	function close() {
		setIsOpen(false);
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Node;
		const clickedTrigger = containerRef?.contains(target);
		const clickedContent = contentRef?.contains(target);

		if (!clickedTrigger && !clickedContent) {
			setIsOpen(false);
		}
	}

	function handleScrollOrResize() {
		if (isOpen()) {
			updatePosition();
		}
	}

	onMount(() => {
		document.addEventListener("mousedown", handleClickOutside);
		window.addEventListener("scroll", handleScrollOrResize, true);
		window.addEventListener("resize", handleScrollOrResize);

		onCleanup(() => {
			document.removeEventListener("mousedown", handleClickOutside);
			window.removeEventListener("scroll", handleScrollOrResize, true);
			window.removeEventListener("resize", handleScrollOrResize);
		});
	});

	return (
		<div class="relative" ref={containerRef}>
			{props.trigger({ isOpen: isOpen(), toggle })}
			<Show when={isOpen()}>
				<Portal>
					<div
						ref={contentRef}
						class="fixed z-[100] -translate-x-1/2 -translate-y-full min-w-max"
						style={{
							top: `${position().top}px`,
							left: `${position().left}px`,
						}}
					>
						<div class="glass-popover p-2.5 rounded-xl">
							{props.children({ close })}
						</div>
					</div>
				</Portal>
			</Show>
		</div>
	);
};
