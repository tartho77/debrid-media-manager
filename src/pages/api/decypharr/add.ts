import type { NextApiRequest, NextApiResponse } from 'next';

type DecypharrTarget = 'radarr' | 'sonarr';

type ApiResponse = {
	ok?: boolean;
	error?: string;
};

const isValidTarget = (value: unknown): value is DecypharrTarget =>
	value === 'radarr' || value === 'sonarr';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method not allowed.' });
	}

	const decypharrUrl = process.env.DECYPHARR_URL?.trim().replace(/\/+$/, '');
	const decypharrToken = process.env.DECYPHARR_TOKEN?.trim();

	if (!decypharrUrl) {
		return res.status(500).json({ error: 'DECYPHARR_URL is not configured on the DMM server.' });
	}

	const { hash, category } = req.body ?? {};
	if (typeof hash !== 'string' || !hash.trim() || hash.length > 128) {
		return res.status(400).json({ error: 'Invalid torrent hash.' });
	}
	if (!isValidTarget(category)) {
		return res.status(400).json({ error: 'Category must be radarr or sonarr.' });
	}

	const magnet = `magnet:?xt=urn:btih:${encodeURIComponent(hash.trim())}`;
	const form = new FormData();
	form.set('urls', magnet);
	form.set('category', category);

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000);

	try {
		const response = await fetch(`${decypharrUrl}/api/v2/torrents/add`, {
			method: 'POST',
			headers: decypharrToken ? { Authorization: `Bearer ${decypharrToken}` } : undefined,
			body: form,
			signal: controller.signal,
		});

		if (!response.ok) {
			const details = (await response.text()).trim();
			console.error('Decypharr add failed:', response.status, details);
			return res.status(502).json({
				error: details
					? `Decypharr rejected the magnet (${response.status}): ${details.slice(0, 200)}`
					: `Decypharr rejected the magnet (HTTP ${response.status}).`,
			});
		}

		return res.status(200).json({ ok: true });
	} catch (error) {
		console.error('Decypharr request failed:', error);
		if (error instanceof Error && error.name === 'AbortError') {
			return res.status(504).json({ error: 'Decypharr request timed out.' });
		}
		return res.status(502).json({ error: 'Unable to reach Decypharr.' });
	} finally {
		clearTimeout(timeout);
	}
}
