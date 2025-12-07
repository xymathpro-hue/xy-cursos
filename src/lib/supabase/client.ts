import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createClient = () => {
  return createClientComponentClient();
};

let client: ReturnType<typeof createClientComponentClient> | null = null;

export const getClient = () => {
  if (!client) {
    client = createClientComponentClient();
  }
  return client;
};
