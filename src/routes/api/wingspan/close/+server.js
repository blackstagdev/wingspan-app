import { json } from '@sveltejs/kit';

export async function PATCH({ request }) {
	const body = await request.json();
	const { batchId } = body;

	if (!batchId) {
		return new Response(JSON.stringify({ error: 'Missing batchId' }), { status: 400 });
	}

	const url = `https://stagingapi.wingspan.app/payments/bulk/collaborator/batch/${batchId}`;

	try {
		const res = await fetch(url, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJtVmlWZjFPRkZtZWN2VkNMQXlLa21GIiwic2Vzc2lvbklkIjoiQmRmcnJHY2xIMVBDQjc4dURIcXZuViIsImlhdCI6MTc2MTYyMTY2N30.pSG6L6qalDpaDNe0kRB3bPGkwGgntfbXSv0eClAU2xA`,
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify({ status: 'Pending' })
		});

		const data = await res.json();

		if (!res.ok) {
			console.error('Wingspan API error (close batch):', data);
			return new Response(JSON.stringify({ error: data }), { status: res.status });
		}

		return json(data);
	} catch (err) {
		console.error('Error closing Wingspan batch:', err);
		return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
	}
}
