// import { redirect } from '@sveltejs/kit';
// import  supabase from '$lib/supabaseServer';

// export async function load() {
//   const { data, error } = await supabase.auth.getSession();

//   if (error || !data?.session) {
//     throw redirect(303, '/login');
//   }

//   return { user: data.session.user };
// }
