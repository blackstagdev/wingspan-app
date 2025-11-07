// src/routes/login/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import supabase from '$lib/supabaseServer.js';

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get('email');
    const password = formData.get('password');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error.message);
      return fail(400, { error: 'Invalid credentials' });
    }

    if (data?.user) {
      throw redirect(303, '/dashboard');
    }
  }
};
