import { useState, useCallback, useEffect } from 'react';
import { IInviteLinkResponse } from '@dndmeal/shared';
import api from '../services/api';

interface UseAdminInvitesReturn {
  links: IInviteLinkResponse[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  generateLink: () => Promise<void>;
  revokeLink: (token: string) => Promise<void>;
  refreshLinks: () => Promise<void>;
}

export function useAdminInvites(): UseAdminInvitesReturn {
  const [links, setLinks] = useState<IInviteLinkResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLinks = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/admin/invite-links');
      setLinks(res.data.links);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch links';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLinks();
  }, [refreshLinks]);

  const generateLink = useCallback(async () => {
    setIsGenerating(true);
    try {
      setError(null);
      await api.post('/admin/invite-links/generate');
      await refreshLinks();
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to generate link';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [refreshLinks]);

  const revokeLink = useCallback(async (token: string) => {
    try {
      setError(null);
      await api.delete(`/admin/invite-links/${token}`);
      await refreshLinks();
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to revoke link';
      setError(message);
    }
  }, [refreshLinks]);

  return {
    links,
    isLoading,
    isGenerating,
    error,
    generateLink,
    revokeLink,
    refreshLinks,
  };
}
