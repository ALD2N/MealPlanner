import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAdminInvites } from '../useAdminInvites';
import api from '../../services/api';

vi.mock('../../services/api');

const mockApi = vi.mocked(api);

describe('useAdminInvites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches invite links on mount', async () => {
    const mockLinks = [
      { token: 'token1', url: 'http://localhost/invite/token1', expiresAt: new Date(), usedCount: 0 },
    ];
    mockApi.get.mockResolvedValueOnce({ data: { links: mockLinks } });

    const { result } = renderHook(() => useAdminInvites());

    await waitFor(() => {
      expect(result.current.links).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApi.get).toHaveBeenCalledWith('/admin/invite-links');
    expect(result.current.links).toEqual(mockLinks);
  });

  it('generates a new invite link', async () => {
    const mockLinks = [
      { token: 'token1', url: 'http://localhost/invite/token1', expiresAt: new Date(), usedCount: 0 },
    ];
    const newLink = { token: 'token2', url: 'http://localhost/invite/token2', expiresAt: new Date(), usedCount: 0 };
    const updatedLinks = [...mockLinks, newLink];

    mockApi.get.mockResolvedValueOnce({ data: { links: mockLinks } });
    mockApi.post.mockResolvedValueOnce({ data: { link: newLink } });
    mockApi.get.mockResolvedValueOnce({ data: { links: updatedLinks } });

    const { result } = renderHook(() => useAdminInvites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCount = result.current.links.length;

    await act(async () => {
      await result.current.generateLink();
    });

    await waitFor(() => {
      expect(result.current.links.length).toBeGreaterThan(initialCount);
    });

    expect(mockApi.post).toHaveBeenCalledWith('/admin/invite-links/generate');
  });

  it('revokes an invite link', async () => {
    const token1 = 'token1';
    const token2 = 'token2';
    const mockLinks = [
      { token: token1, url: 'http://localhost/invite/token1', expiresAt: new Date(), usedCount: 0 },
      { token: token2, url: 'http://localhost/invite/token2', expiresAt: new Date(), usedCount: 0 },
    ];
    const revokedLinks = [mockLinks[0]];

    mockApi.get.mockResolvedValueOnce({ data: { links: mockLinks } });
    mockApi.delete.mockResolvedValueOnce({ data: { success: true } });
    mockApi.get.mockResolvedValueOnce({ data: { links: revokedLinks } });

    const { result } = renderHook(() => useAdminInvites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const token = result.current.links[1]?.token;
    if (token) {
      await act(async () => {
        await result.current.revokeLink(token);
      });

      await waitFor(() => {
        expect(result.current.links.find(l => l.token === token)).toBeUndefined();
      });

      expect(mockApi.delete).toHaveBeenCalledWith(`/admin/invite-links/${token}`);
    }
  });
});
