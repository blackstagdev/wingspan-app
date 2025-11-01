import { json } from '@sveltejs/kit';

// const WINGSPAN_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJtVmlWZjFPRkZtZWN2VkNMQXlLa21GIiwic2Vzc2lvbklkIjoiQmRmcnJHY2xIMVBDQjc4dURIcXZuViIsImlhdCI6MTc2MTYyMTY2N30.pSG6L6qalDpaDNe0kRB3bPGkwGgntfbXSv0eClAU2xA';
const WINGSPAN_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjaEVNWFRwc0ZnMWF6YXhKWThOeHVGIiwic2Vzc2lvbklkIjoiZ09ka1B5cUtHZkx1dzJqa1B6NDlPViIsImlhdCI6MTc2MTk2Njg1Mn0.gEMaYMh49eZtK8ueK0zfYfqliYkPbFq4VVGlfhMWXQQ';
export async function POST({ request }) {
	// ✅ 1. Check secret
	const authHeader = request.headers.get('x-api-secret');
	if (authHeader !== 'blackstag_2025!@#') {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	// ✅ 2. Get collaborator data
	const body = await request.json();
	const { collaborator } = body;

	if (!collaborator) {
		return new Response(JSON.stringify({ error: 'Missing collaborator data' }), {
			status: 400
		});
	}

	try {
		// ✅ 3. Step 1 — Create Batch
		const createBatchRes = await fetch(
			'https://api.wingspan.app/payments/bulk/collaborator/batch',
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${WINGSPAN_API_KEY}`,
					'Content-Type': 'application/json',
					Accept: 'application/json'
				}
			}
		);

		const createBatchData = await createBatchRes.json();
		if (!createBatchRes.ok) {
			console.error('Error creating batch:', createBatchData);
			return new Response(JSON.stringify({ error: createBatchData }), {
				status: createBatchRes.status
			});
		}

		const batchId = createBatchData.bulkCollaboratorBatchId;
		console.log('Batch created:', batchId, createBatchData);

		// ✅ 4. Step 2 — Add Collaborator to Batch
		const addCollaboratorRes = await fetch(
			`https://api.wingspan.app/payments/bulk/collaborator/batch/${batchId}/item`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${WINGSPAN_API_KEY}`,
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify(collaborator)
			}
		);

		const addCollaboratorData = await addCollaboratorRes.json();
		if (!addCollaboratorRes.ok) {
			console.error('Error adding collaborator:', addCollaboratorData);
			return new Response(JSON.stringify({ error: addCollaboratorData }), {
				status: addCollaboratorRes.status
			});
		}

		// ✅ 5. Step 3 — Close the Batch
		const closeBatchRes = await fetch(
			`https://api.wingspan.app/payments/bulk/collaborator/batch/${batchId}`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${WINGSPAN_API_KEY}`,
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({ status: 'Pending' })
			}
		);

		const closeBatchData = await closeBatchRes.json();
		if (!closeBatchRes.ok) {
			console.error('Error closing batch:', closeBatchData);
			return new Response(JSON.stringify({ error: closeBatchData }), {
				status: closeBatchRes.status
			});
		}

		// ✅ 6. Return the full response summary
		return json({
			success: true,
			batchId,
			createBatch: createBatchData,
			addCollaborator: addCollaboratorData,
			closeBatch: closeBatchData
		});
	} catch (err) {
		console.error('Error in Wingspan API flow:', err);
		return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
			status: 500
		});
	}
}
