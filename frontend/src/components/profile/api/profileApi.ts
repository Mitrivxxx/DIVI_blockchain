import { API_URL } from "../../../types/api";
import type { EditableField, ProfileData } from "../types";

const getFieldEndpoint = (field: EditableField) => {
  if (field === "name") return "name";
  if (field === "email") return "email";
  return "bio";
};

const getFieldBody = (field: EditableField, value: string) => {
  if (field === "name") return { name: value };
  if (field === "email") return { email: value };
  return { bio: value };
};

export const fetchProfileApi = async (token: string): Promise<ProfileData | null> => {
  const response = await fetch(`${API_URL}/api/GetProfile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as ProfileData;
};

export const patchProfileFieldApi = async (token: string, field: EditableField, value: string): Promise<boolean> => {
  const endpoint = getFieldEndpoint(field);
  const body = getFieldBody(field, value);

  const response = await fetch(`${API_URL}/api/GetProfile/${endpoint}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  return response.ok;
};

export const deleteProfileFieldApi = async (token: string, field: EditableField): Promise<boolean> => {
  const endpoint = getFieldEndpoint(field);

  const response = await fetch(`${API_URL}/api/GetProfile/${endpoint}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.ok;
};
