import { createSignal, Show } from "solid-js";
import { Button } from "../Button";

interface Props {
	getShareUrl: () => string;
}

type ShareState = "idle" | "copied" | "error";

export const ShareControl = (props: Props) => {
	const [shareState, setShareState] = createSignal<ShareState>("idle");

	async function copyText(text: string) {
		if (navigator.clipboard?.writeText) {
			try {
				await navigator.clipboard.writeText(text);
				return;
			} catch (err) {
				console.warn("Clipboard API failed, falling back to legacy", err);
			}
		}

		return new Promise<void>((resolve, reject) => {
			try {
				const textarea = document.createElement("textarea");
				textarea.value = text;
				textarea.style.position = "fixed";
				textarea.style.left = "-9999px";
				textarea.style.top = "0";
				textarea.setAttribute("readonly", "");
				document.body.appendChild(textarea);
				textarea.focus();
				textarea.select();

				const successful = document.execCommand("copy");
				document.body.removeChild(textarea);

				if (successful) {
					resolve();
				} else {
					reject(new Error("Clipboard copy failed"));
				}
			} catch (e) {
				reject(e);
			}
		});
	}

	async function handleShare() {
		try {
			const shareUrl = props.getShareUrl();

			window.history.replaceState(null, "", shareUrl);

			await copyText(shareUrl);
			setShareState("copied");
		} catch (e) {
			console.error("Share failed:", e);
			setShareState("error");
		}

		setTimeout(() => {
			setShareState("idle");
		}, 1500);
	}

	return (
		<Button
			onClick={handleShare}
			class="px-4 py-2 min-w-[72px] flex items-center justify-center gap-2"
			aria-label="Share settings"
		>
			<Show
				when={shareState() === "copied"}
				fallback={
					<Show
						when={shareState() === "error"}
						fallback={
							<>
								<i class="hn hn-link w-5 h-5" />
								<span class="text-sm font-medium">Share</span>
							</>
						}
					>
						<span class="text-sm font-medium text-red-200">Copy failed</span>
					</Show>
				}
			>
				<span class="text-sm font-medium text-emerald-200">Copied</span>
			</Show>
		</Button>
	);
};
