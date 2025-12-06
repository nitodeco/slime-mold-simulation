import { createSignal, Show } from "solid-js";
import { Button } from "./Button";

interface Props {
	isMobile: () => boolean;
}

export const MobileWarningDialog = (props: Props) => {
	const [isDismissed, setIsDismissed] = createSignal(false);

	const handleDismiss = () => {
		setIsDismissed(true);
	};

	return (
		<Show when={props.isMobile() && !isDismissed()}>
			<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
				<div class="bg-gray-800 border-2 border-gray-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] p-6 max-w-sm mx-4">
					<p class="text-gray-200 mb-4 text-sm leading-relaxed">
						This page is intended for a desktop experience
					</p>
					<div class="flex justify-end">
						<Button onClick={handleDismiss}>OK</Button>
					</div>
				</div>
			</div>
		</Show>
	);
};
