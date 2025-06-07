import { Turnstile } from "@marsidev/react-turnstile";
import { useCallback, useEffect, useState } from "react";
import { LuInbox, LuTriangleAlert } from "react-icons/lu";

interface TurnstileManagerProps {
	onTokenGenerated: () => void;
}

export default function TurnstileManager({
	onTokenGenerated,
}: TurnstileManagerProps) {
	const [apiTokenSet, setApiTokenSet] = useState(false);
	const [turnstileError, setTurnstileError] = useState<string | null>(null);
	const [dots, setDots] = useState(".");

	const siteKey = import.meta.env.VITE_TURNSTILE_SITEKEY;

	useEffect(() => {
		// is the cookie already set?
		const existingToken = document.cookie.includes("api_token");
		if (existingToken) {
			console.log(
				"TurnstileManager: Cookie already set, skipping verification",
			);
			setApiTokenSet(true);
			onTokenGenerated();
			setTurnstileError(null);
		} else {
			console.log("TurnstileManager: Cookie not set, starting verification");
			console.time("turnstile");
		}
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			setDots(dots.length < 3 ? `${dots}.` : "");
		}, 500);
		return () => clearInterval(interval);
	}, [dots]);

	const verifyTurnstile = useCallback(
		async (token: string) => {
			console.log(
				"TurnstileManager: Starting verification with token:",
				`${token.substring(0, 10)}...`,
			);

			try {
				const response = await fetch(
					`${import.meta.env.VITE_API_ENDPOINT}/verify-turnstile`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						credentials: "include",
						body: JSON.stringify({ token }),
					},
				);

				if (response.ok) {
					await response.json();
					console.log("TurnstileManager: Verification successful, cookie set");
					setApiTokenSet(true);
					onTokenGenerated();
					setTurnstileError(null);
					console.timeEnd("turnstile");
				} else {
					console.log(
						"TurnstileManager: Verification failed with status:",
						response.status,
					);
					throw new Error("Verification failed");
				}
			} catch (error) {
				console.log("TurnstileManager: Verification error:", error);
				setTurnstileError("Verification failed. Please try again.");
				setApiTokenSet(false);
			} finally {
				console.timeEnd("turnstile");
			}
		},
		[onTokenGenerated],
	);

	const handleTurnstileSuccess = useCallback(
		(token: string) => {
			console.log("TurnstileManager: Turnstile success callback triggered");
			verifyTurnstile(token);
		},
		[verifyTurnstile],
	);

	const handleTurnstileError = useCallback(() => {
		console.log("TurnstileManager: Turnstile error callback triggered");
		setTurnstileError("Unable to verify. Please check your connection.");
		setApiTokenSet(false);
	}, []);

	const handleTurnstileExpire = useCallback(() => {
		console.log("TurnstileManager: Turnstile expire callback triggered");
		setApiTokenSet(false);
		setTurnstileError(null);
	}, []);

	if (!siteKey) {
		return <NoEmailsFound dots={dots} />;
	}

	if (turnstileError) {
		return (
			<div className="flex justify-center items-center gap-4 border border-yellow-500 bg-yellow-500/20 px-4 py-6 rounded w-full md:w-1/2 mx-auto">
				<LuTriangleAlert
					size={64}
					strokeWidth={1.25}
					className="w-1/4 md:w-1/5 min-w-1/4 text-yellow-500"
				/>
				<div className="flex flex-col gap-0.5 w-3/4 md:w-4/5 min-w-3/4">
					<h2 className="text-xl font-medium text-yellow-500">
						Verification Error
					</h2>
					<p className="text-base text-text/80">{turnstileError}</p>
				</div>
			</div>
		);
	}

	if (apiTokenSet) {
		return <NoEmailsFound dots={dots} />;
	}

	return (
		<div className="flex flex-col justify-center items-center gap-4 border border-surface0 bg-surface0/30 px-4 py-6 rounded w-full md:w-1/2 mx-auto">
			<div className="flex flex-col items-center gap-2 w-full">
				<h2 className="text-xl font-medium text-center">
					Loading your mailbox...
				</h2>
				<p className="text-base text-text/80 text-center">
					Please wait a couple seconds{dots}
					<br />
					<i>(you can use this email whilst you wait!)</i>
				</p>
			</div>
			<Turnstile
				siteKey={siteKey}
				onSuccess={handleTurnstileSuccess}
				onError={handleTurnstileError}
				onExpire={handleTurnstileExpire}
				options={{
					theme: "dark",
					size: "normal",
				}}
			/>
		</div>
	);
}

function NoEmailsFound({ dots }: { dots: string }) {
	return (
		<div className="flex justify-center items-center gap-4 border border-surface0 bg-surface0/30 px-4 py-6 rounded w-full md:w-1/2 mx-auto">
			<LuInbox
				size={64}
				strokeWidth={1.25}
				className="w-1/4 md:w-1/5 min-w-1/4 animate-pulse"
			/>
			<div className="flex flex-col gap-0.5 w-3/4 md:w-4/5 min-w-3/4">
				<h2 className="text-xl font-medium flex items-end space-x-2">
					<span>Waiting for emails{dots}</span>
				</h2>
				<p className="text-base text-text/80">
					Copy your email address and start using it to receive messages
				</p>
			</div>
		</div>
	);
}
