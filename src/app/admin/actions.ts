'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

export async function loginAction(formData: FormData) {
  const username = formData.get('username');
  const password = formData.get('password');

  if (!username || !password) {
    return { error: 'Username and password are required.' };
  }

  try {
    await signIn('credentials', {
      username,
      password,
      redirectTo: '/admin',
    });
    return { success: true };
  } catch (error: any) {
    // NextAuth handles redirects by throwing a special redirect error.
    // We must rethrow this error to let Next.js handle the redirection.
    if (
      error &&
      (error.message === 'NEXT_REDIRECT' ||
        error.message?.includes('NEXT_REDIRECT') ||
        error.name === 'RedirectError' ||
        error.digest?.startsWith('NEXT_REDIRECT'))
    ) {
      throw error;
    }

    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid username or password.' };
        default:
          return { error: 'Authentication failed. Please try again.' };
      }
    }

    console.error('Server login action error:', error);
    return { error: 'Invalid username or password.' };
  }
}
