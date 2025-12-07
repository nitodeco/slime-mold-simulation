interface LockButtonProps {
	locked: boolean;
	onToggle: () => void;
	class?: string;
}

export const LockButton = (props: LockButtonProps) => {
	return (
		<button
			type="button"
			onClick={(event) => {
				event.stopPropagation();
				props.onToggle();
			}}
			class={`w-4 h-4 flex items-center justify-center text-[10px] transition-colors cursor-pointer rounded-sm ${
				props.locked
					? "text-amber-400 hover:text-amber-300"
					: "text-gray-600 hover:text-gray-400"
			} ${props.class ?? ""}`}
			aria-label={props.locked ? "Unlock setting" : "Lock setting"}
			title={
				props.locked
					? "Unlock (will be randomized)"
					: "Lock (won't be randomized)"
			}
		>
			{props.locked ? (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="w-3 h-3"
					aria-hidden="true"
				>
					<path
						fill-rule="evenodd"
						d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
						clip-rule="evenodd"
					/>
				</svg>
			) : (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="w-3 h-3"
					aria-hidden="true"
				>
					<path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 01-1.5 0V6.75a3.75 3.75 0 10-7.5 0v3a3 3 0 013 3v6.75a3 3 0 01-3 3H3.75a3 3 0 01-3-3v-6.75a3 3 0 013-3h9v-3c0-2.9 2.35-5.25 5.25-5.25z" />
				</svg>
			)}
		</button>
	);
};
