import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { organizationsApi } from '../api/organizations.api';
import type { Organization } from '../api/organizations.api';

interface OrgState {
  organizations: Organization[];
  currentOrg: Organization | null;
  loading: boolean;
  fetchOrganizations: () => Promise<void>;
  setCurrentOrg: (org: Organization) => void;
  addOrganization: (org: Organization) => void;
  removeOrganization: (id: string) => void;
  reset: () => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      organizations: [],
      currentOrg: null,
      loading: false,

      fetchOrganizations: async () => {
        set({ loading: true });
        try {
          const orgs = await organizationsApi.list();
          const { currentOrg } = get();
          const stillMember =
            currentOrg && orgs.find((o) => o.id === currentOrg.id);
          set({
            organizations: orgs,
            currentOrg: stillMember ?? orgs[0] ?? null,
          });
        } finally {
          set({ loading: false });
        }
      },

      setCurrentOrg: (org: Organization) => set({ currentOrg: org }),

      addOrganization: (org: Organization) =>
        set((state) => ({
          organizations: [...state.organizations, org],
          currentOrg: state.currentOrg || org,
        })),

      removeOrganization: (id: string) =>
        set((state) => {
          const filtered = state.organizations.filter((o) => o.id !== id);
          return {
            organizations: filtered,
            currentOrg:
              state.currentOrg?.id === id ? filtered[0] || null : state.currentOrg,
          };
        }),

      reset: () => set({ organizations: [], currentOrg: null }),
    }),
    {
      name: 'org-storage',
      partialize: (state) => ({
        currentOrg: state.currentOrg,
        organizations: state.organizations,
      }),
    },
  ),
);
