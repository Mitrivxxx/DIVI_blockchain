import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteProfileFieldApi, fetchProfileApi, patchProfileFieldApi } from "../api/profileApi";
import type { EditableField, ProfileData, ProfileTab } from "../types";

type UseProfileParams = {
  userRole?: string | null;
  walletAddress?: string | null;
  fallbackAvatar: string;
};

export const useProfile = ({ userRole, walletAddress, fallbackAvatar }: UseProfileParams) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpenFor, setMenuOpenFor] = useState<EditableField | null>(null);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const data = await fetchProfileApi(token);
        setProfile(data);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const role = profile?.role ?? userRole ?? null;
  const displayName = profile?.name?.trim() || null;
  const email = profile?.email?.trim() || null;
  const bio = profile?.bio?.trim() || null;
  const profileAddress = profile?.ethereumAddress || walletAddress || null;
  const avatar = profile?.avatarUrl?.trim() || fallbackAvatar;

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
    setEditingField(field);
    setEditingValue(value);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingField(null);
    setEditingValue("");
  }, []);

  const saveField = useCallback(
    async (field: EditableField) => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        setSaving(true);
        const isSaved = await patchProfileFieldApi(token, field, editingValue);

        if (!isSaved) {
          return;
        }

        setProfile(prev => {
          if (!prev) return prev;
          if (field === "name") return { ...prev, name: editingValue };
          if (field === "email") return { ...prev, email: editingValue };
          return { ...prev, bio: editingValue };
        });

        cancelEditing();
      } finally {
        setSaving(false);
      }
    },
    [cancelEditing, editingValue],
  );

  const deleteField = useCallback(
    async (field: EditableField) => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        setSaving(true);
        const isDeleted = await deleteProfileFieldApi(token, field);

        if (!isDeleted) {
          return;
        }

        setProfile(prev => {
          if (!prev) return prev;
          if (field === "name") return { ...prev, name: null };
          if (field === "email") return { ...prev, email: null };
          return { ...prev, bio: null };
        });

        if (editingField === field) {
          cancelEditing();
        }

        setMenuOpenFor(null);
      } finally {
        setSaving(false);
      }
    },
    [cancelEditing, editingField],
  );

  return {
    loading,
    saving,
    activeTab,
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
    setActiveTab,
    setMenuOpenFor,
    setEditingValue,
    startEditing,
    cancelEditing,
    saveField,
    deleteField,
  };
};
