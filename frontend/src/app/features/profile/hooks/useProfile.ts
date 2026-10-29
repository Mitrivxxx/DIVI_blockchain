import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteProfileAvatarApi,
  deleteProfileFieldApi,
  fetchMyActivityApi,
  fetchMyCredentialsApi,
  fetchProfileApi,
  patchProfileFieldApi,
  resolveAvatarSrc,
  updateCredentialVisibilityApi,
  uploadProfileAvatarApi,
} from "../api/profileApi";
import type {
  CredentialSection,
  CredentialVisibility,
  DocumentActivityItem,
  EditableField,
  ProfileData,
} from "../types";
import { DOCUMENT_TYPE_SECTIONS } from "@/types/documents";
import { useWeb3Auth } from "@/service/web3/useWeb3Auth";

const emptyCredentialSections = (): CredentialSection[] =>
  DOCUMENT_TYPE_SECTIONS.map(section => ({
    documentType: section.id,
    label: section.label,
    items: [],
  }));

type UseProfileParams = {
  userRole?: string | null;
  walletAddress?: string | null;
  fallbackAvatar: string;
};

export const useProfile = ({ userRole, walletAddress, fallbackAvatar }: UseProfileParams) => {
  const { jwt } = useWeb3Auth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpenFor, setMenuOpenFor] = useState<EditableField | null>(null);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [credentialSections, setCredentialSections] = useState<CredentialSection[]>(emptyCredentialSections);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const [visibilityUpdatingHash, setVisibilityUpdatingHash] = useState<string | null>(null);
  const [activity, setActivity] = useState<DocumentActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  /** Local UI toggle: public = full page; private = Profil + Instytucja card only. */
  const [isPublicProfile, setIsPublicProfile] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await fetchProfileApi(jwt ?? "");
        if (!cancelled) {
          setProfile(data);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [jwt]);

  const role = profile?.role ?? userRole ?? null;
  const displayName = profile?.name?.trim() || null;
  const email = profile?.email?.trim() || null;
  const bio = profile?.bio?.trim() || null;
  const profileAddress = profile?.ethereumAddress || walletAddress || null;
  const hasCustomAvatar = Boolean(profile?.avatarUrl?.trim());
  const avatar = resolveAvatarSrc(profile?.avatarUrl, fallbackAvatar);

  const shortAddress = useMemo(() => {
    if (!profileAddress || profileAddress.length < 13) return profileAddress;
    return `${profileAddress.slice(0, 8)}...${profileAddress.slice(-5)}`;
  }, [profileAddress]);

  const joinedAt = useMemo(() => {
    const rawValue = profile?.createdAt;
    if (!rawValue) return null;

    const date = new Date(rawValue);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [profile?.createdAt]);

  const startEditing = useCallback((field: EditableField, value: string) => {
    setMenuOpenFor(null);
    setProfileError(null);
    setEditingField(field);
    setEditingValue(value);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingField(null);
    setEditingValue("");
  }, []);

  const saveField = useCallback(
    async (field: EditableField) => {
      try {
        setSaving(true);
        setProfileError(null);
        await patchProfileFieldApi("", field, editingValue);

        setProfile(prev => {
          if (!prev) return prev;
          if (field === "name") return { ...prev, name: editingValue };
          if (field === "email") return { ...prev, email: editingValue };
          return { ...prev, bio: editingValue };
        });

        cancelEditing();
      } catch (error) {
        setProfileError(error instanceof Error ? error.message : "Nie udało się zapisać.");
      } finally {
        setSaving(false);
      }
    },
    [cancelEditing, editingValue],
  );

  const deleteField = useCallback(
    async (field: EditableField) => {
      try {
        setSaving(true);
        setProfileError(null);
        await deleteProfileFieldApi("", field);

        setProfile(prev => {
          if (!prev) return prev;
          if (field === "name") return { ...prev, name: null, firstName: null, lastName: null };
          if (field === "email") return { ...prev, email: null };
          return { ...prev, bio: null };
        });

        if (editingField === field) {
          cancelEditing();
        }

        setMenuOpenFor(null);
      } catch (error) {
        setProfileError(error instanceof Error ? error.message : "Nie udało się usunąć.");
      } finally {
        setSaving(false);
      }
    },
    [cancelEditing, editingField],
  );

  const uploadAvatar = useCallback(async (file: File) => {
    try {
      setAvatarUploading(true);
      setProfileError(null);
      const avatarUrl = await uploadProfileAvatarApi(file);
      setProfile(prev => (prev ? { ...prev, avatarUrl: `${avatarUrl}?v=${Date.now()}` } : prev));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Nie udało się wgrać zdjęcia.");
    } finally {
      setAvatarUploading(false);
    }
  }, []);

  const deleteAvatar = useCallback(async () => {
    try {
      setAvatarUploading(true);
      setProfileError(null);
      await deleteProfileAvatarApi();
      setProfile(prev => (prev ? { ...prev, avatarUrl: null } : prev));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Nie udało się usunąć zdjęcia.");
    } finally {
      setAvatarUploading(false);
    }
  }, []);

  const loadCredentials = useCallback(async () => {
    try {
      setCredentialsLoading(true);
      setCredentialsError(null);
      const wallet = await fetchMyCredentialsApi();
      setCredentialSections(
        wallet.sections?.length ? wallet.sections : emptyCredentialSections(),
      );
    } catch (error) {
      setCredentialSections(emptyCredentialSections());
      setCredentialsError(error instanceof Error ? error.message : "Nie udało się pobrać credentials.");
    } finally {
      setCredentialsLoading(false);
    }
  }, []);

  const updateCredentialVisibility = useCallback(async (hash: string, visibility: CredentialVisibility) => {
    try {
      setVisibilityUpdatingHash(hash);
      setCredentialsError(null);
      const updated = await updateCredentialVisibilityApi(hash, visibility);
      setCredentialSections(prev =>
        prev.map(section => ({
          ...section,
          items: section.items.map(item => (item.hash === hash ? updated : item)),
        })),
      );
    } catch (error) {
      setCredentialsError(error instanceof Error ? error.message : "Nie udało się zmienić widoczności.");
    } finally {
      setVisibilityUpdatingHash(null);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    try {
      setActivityLoading(true);
      setActivityError(null);
      const items = await fetchMyActivityApi();
      setActivity(items);
    } catch (error) {
      setActivity([]);
      setActivityError(error instanceof Error ? error.message : "Nie udało się pobrać historii transakcji.");
    } finally {
      setActivityLoading(false);
    }
  }, []);

  return {
    loading,
    saving,
    profileError,
    avatarUploading,
    hasCustomAvatar,
    credentialSections,
    credentialsLoading,
    credentialsError,
    visibilityUpdatingHash,
    activity,
    activityLoading,
    activityError,
    menuOpenFor,
    editingField,
    editingValue,
    role,
    displayName,
    email,
    bio,
    profileAddress,
    shortAddress,
    joinedAt,
    avatar,
    setMenuOpenFor,
    setEditingValue,
    startEditing,
    cancelEditing,
    saveField,
    deleteField,
    uploadAvatar,
    deleteAvatar,
    loadCredentials,
    updateCredentialVisibility,
    loadActivity,
    isPublicProfile,
    setIsPublicProfile,
  };
};
