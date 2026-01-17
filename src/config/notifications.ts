export const serverNotificationsEnabled =
  import.meta.env.VITE_SERVER_NOTIFICATIONS !== 'false';

export const pushNotificationsEnabled =
  import.meta.env.VITE_PUSH_NOTIFICATIONS === 'true';
