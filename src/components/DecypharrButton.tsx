import { Send, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

type DecypharrTarget = 'radarr' | 'sonarr';

type DecypharrButtonProps = {
	hash: string;
	defaultCategory: DecypharrTarget;
};

type DecypharrApiResponse = {
	ok?: boolean;
	error?: string;
};

export default function DecypharrButton({ hash, defaultCategory }: DecypharrButtonProps) {
	const [showDialog, setShowDialog] = useState(false);
	const [sendingTo, setSendingTo] = useState<DecypharrTarget | null>(null);

	const sendToDecypharr = async (category: DecypharrTarget) => {
		if (sendingTo) return;

		setSendingTo(category);
		try {
			const response = await fetch('/api/decypharr/add', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ hash, category }),
			});

			const data = (await response.json().catch(() => ({}))) as DecypharrApiResponse;
			if (!response.ok) {
				throw new Error(data.error || `Decypharr returned HTTP ${response.status}`);
			}

			toast.success(`Sent to Decypharr as ${category === 'radarr' ? 'Radarr' : 'Sonarr'}.`);
			setShowDialog(false);
		} catch (error) {
			console.error('Decypharr error:', error);
			toast.error(error instanceof Error ? error.message : 'Unable to send to Decypharr.');
		} finally {
			setSendingTo(null);
		}
	};

	const targets: DecypharrTarget[] =
		defaultCategory === 'radarr' ? ['radarr', 'sonarr'] : ['sonarr', 'radarr'];

	const dialog =
		showDialog && typeof document !== 'undefined'
			? createPortal(
					<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
						<button
							type="button"
							aria-label="Close Decypharr dialog"
							className="absolute inset-0 bg-black/60"
							onClick={() => !sendingTo && setShowDialog(false)}
						/>
						<div className="relative z-[101] w-full max-w-xs rounded-lg border border-cyan-700 bg-gray-900 p-4 shadow-2xl">
							<div className="mb-4 flex items-center justify-between gap-3">
								<div>
									<h3 className="font-semibold text-gray-100">Send to Decypharr</h3>
									<p className="mt-1 text-xs text-gray-400">Choose the destination category.</p>
								</div>
								<button
									type="button"
									className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-100 disabled:opacity-50"
									disabled={Boolean(sendingTo)}
									onClick={() => setShowDialog(false)}
								>
									<X className="h-4 w-4" />
								</button>
							</div>

							<div className="space-y-2">
								{targets.map((target) => (
									<button
										key={target}
										type="button"
										disabled={Boolean(sendingTo)}
										onClick={() => sendToDecypharr(target)}
										className="haptic-sm flex w-full items-center justify-between rounded border-2 border-cyan-600 bg-cyan-950/40 px-4 py-2 text-sm text-cyan-100 transition-colors hover:bg-cyan-900/60 disabled:cursor-wait disabled:opacity-60"
									>
										<span>{target === 'radarr' ? 'Radarr' : 'Sonarr'}</span>
										<span className="text-xs text-cyan-300">
											{sendingTo === target ? 'Sending…' : target === defaultCategory ? 'Recommended' : ''}
										</span>
									</button>
								))}
							</div>
						</div>
					</div>,
					document.body
				)
			: null;

	return (
		<>
			<button
				type="button"
				onClick={() => setShowDialog(true)}
				className="haptic-sm inline rounded border-2 border-cyan-600 bg-cyan-950/30 px-1 text-xs text-cyan-100 transition-colors hover:bg-cyan-900/50"
				title="Send magnet to Decypharr"
			>
				<Send className="mr-1 inline-block h-3 w-3 text-cyan-400" />
				Decypharr
			</button>
			{dialog}
		</>
	);
}
