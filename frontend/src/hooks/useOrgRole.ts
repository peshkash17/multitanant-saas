import { useEffect, useState } from 'react';
import { useOrgStore } from '../stores/org.store';
import { useAuthStore } from '../stores/auth.store';
import { organizationsApi } from '../api/organizations.api';

export type OrgRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export function useOrgRole() {
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const currentUser = useAuthStore((s) => s.user);
  const [role, setRole] = useState<OrgRole | null>(
    (currentOrg?.role as OrgRole) ?? null,
  );

  useEffect(() => {
    if (!currentOrg || !currentUser) {
      setRole(null);
      return;
    }

    if (currentOrg.role) {
      setRole(currentOrg.role as OrgRole);
      return;
    }

    let cancelled = false;
    organizationsApi
      .getMembers(currentOrg.id)
      .then((members) => {
        if (cancelled) return;
        const mine = members.find(
          (m) => m.userId === currentUser.id || m.user?.id === currentUser.id,
        );
        setRole((mine?.role as OrgRole) ?? 'VIEWER');
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      });

    return () => {
      cancelled = true;
    };
  }, [currentOrg?.id, currentOrg?.role, currentUser?.id]);

  return {
    role,
    isAdmin: role === 'ADMIN',
    canEdit: role === 'ADMIN' || role === 'EDITOR',
    isViewer: role === 'VIEWER',
  };
}
