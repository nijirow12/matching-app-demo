import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client with the Clerk session token.
 * This client is authenticated as the logged-in user.
 * 
 * @param clerkToken - The JWT token from Clerk (use `getToken({ template: 'supabase' })`)
 */
export const createSupabaseClient = (clerkToken: string | null) => {
    const headers = clerkToken ? { Authorization: `Bearer ${clerkToken}` } : undefined;

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers,
            },
        }
    );
};
