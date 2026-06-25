import { useOrgRole } from './useOrgRole';

export function useOrgAdmin() {
  const { isAdmin } = useOrgRole();
  return isAdmin;
}
