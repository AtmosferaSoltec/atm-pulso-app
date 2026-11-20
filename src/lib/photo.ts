import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/** Long side of the photos the app keeps: sharp enough to read an operation number, ~150–250 KB as JPEG. */
const MAX_SIDE = 1280;

export interface LocalPhoto {
  uri: string;
  mimeType: string;
}

/** Shrinks a camera/gallery photo to a small JPEG before it is kept for upload (storage is paid per byte). */
export async function shrinkPhoto(photo: {
  uri: string;
  width?: number;
  height?: number;
}): Promise<LocalPhoto> {
  const context = ImageManipulator.manipulate(photo.uri);
  const width = photo.width ?? 0;
  const height = photo.height ?? 0;
  if (Math.max(width, height) > MAX_SIDE)
    context.resize(
      width >= height
        ? { width: MAX_SIDE, height: null }
        : { width: null, height: MAX_SIDE },
    );
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.6 });
  return { uri: saved.uri, mimeType: "image/jpeg" };
}
