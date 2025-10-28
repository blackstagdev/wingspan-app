import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	// ✅ 1. Check the secret key in request headers
	const authHeader = request.headers.get('x-api-secret');
	if (authHeader !== 'blackstag_2025!@#') {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	// ✅ 2. Parse incoming JSON body
	const body = await request.json();
	const { batchId, collaborator } = body;

	if (!batchId || !collaborator) {
		return new Response(
			JSON.stringify({ error: 'Missing batchId or collaborator data' }),
			{ status: 400 }
		);
	}

	// ✅ 3. Send to Wingspan API
	const url = `https://stagingapi.wingspan.app/payments/bulk/collaborator/batch/${batchId}/item`;

	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJtVmlWZjFPRkZtZWN2VkNMQXlLa21GIiwic2Vzc2lvbklkIjoiQmRmcnJHY2xIMVBDQjc4dURIcXZuViIsImlhdCI6MTc2MTYyMTY2N30.pSG6L6qalDpaDNe0kRB3bPGkwGgntfbXSv0eClAU2xA`,
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify(collaborator)
		});

		const data = await res.json();

		if (!res.ok) {
			console.error('Wingspan error:', data);
			return new Response(JSON.stringify({ error: data }), { status: res.status });
		}

		return json({ success: true, wingspanResponse: data });
	} catch (err) {
		console.error('Error calling Wingspan:', err);
		return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
			status: 500
		});
	}
}
