import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { Alert, Linking } from "react-native";

export type PickedFile = {
  base64: string;
  mime: string;
  filename: string;
  kind: "image" | "file";
};

async function ensurePhotoPermission(): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  let status = current.status;
  if (status !== "granted" && current.canAskAgain) {
    const asked = await ImagePicker.requestMediaLibraryPermissionsAsync();
    status = asked.status;
  }
  if (status !== "granted") {
    Alert.alert(
      "Zugriff auf Fotos nötig",
      "Erlaube den Zugriff auf deine Fotos, um ein Bild auszuwählen.",
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Einstellungen öffnen", onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }
  return true;
}

export async function pickImageFile(): Promise<PickedFile | null> {
  if (!(await ensurePhotoPermission())) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.6,
    base64: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  let base64 = a.base64 ?? "";
  if (!base64) {
    base64 = await new File(a.uri).base64();
  }
  const mime = a.mimeType || "image/jpeg";
  const filename = a.fileName || `foto_${Date.now()}.jpg`;
  return { base64, mime, filename, kind: "image" };
}

export async function pickDocumentFile(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  const base64 = await new File(a.uri).base64();
  const mime = a.mimeType || "application/octet-stream";
  const filename = a.name || `datei_${Date.now()}`;
  const kind: "image" | "file" = mime.startsWith("image/") ? "image" : "file";
  return { base64, mime, filename, kind };
}
