import { toByteArray } from "base64-js";
import * as ImageManipulator from "expo-image-manipulator";
import { decode } from "jpeg-js";

const RESIZE_SHORT_SIDE = 256;
const CROP_SIZE = 224;
const CHANNEL_SIZE = CROP_SIZE * CROP_SIZE;
const NORMALIZATION_MEAN = [0.485, 0.456, 0.406];
const NORMALIZATION_STD = [0.229, 0.224, 0.225];

export type TfliteInputLayout = "NCHW" | "NHWC";

export const preprocessLeafImage = async (
  imageUri: string,
  inputLayout: TfliteInputLayout
): Promise<Float32Array> => {
  const source = await ImageManipulator.manipulateAsync(imageUri, [], {
    compress: 1,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  const scale = RESIZE_SHORT_SIDE / Math.min(source.width, source.height);
  const resizedWidth =
    source.width <= source.height
      ? RESIZE_SHORT_SIDE
      : Math.floor(source.width * scale);
  const resizedHeight =
    source.height <= source.width
      ? RESIZE_SHORT_SIDE
      : Math.floor(source.height * scale);

  if (resizedWidth < CROP_SIZE || resizedHeight < CROP_SIZE) {
    throw new Error("Selected image is too small to preprocess for the model.");
  }

  const originX = Math.round((resizedWidth - CROP_SIZE) / 2);
  const originY = Math.round((resizedHeight - CROP_SIZE) / 2);
  const cropped = await ImageManipulator.manipulateAsync(
    source.uri,
    [
      { resize: { width: resizedWidth, height: resizedHeight } },
      {
        crop: {
          originX,
          originY,
          width: CROP_SIZE,
          height: CROP_SIZE,
        },
      },
    ],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  if (!cropped.base64) {
    throw new Error("Image preprocessing did not produce encoded pixel data.");
  }

  const jpegBytes = toByteArray(cropped.base64);
  const pixels = decode(jpegBytes, { useTArray: true });
  if (pixels.width !== CROP_SIZE || pixels.height !== CROP_SIZE) {
    throw new Error(
      `Unexpected preprocessed image size ${pixels.width}x${pixels.height}.`
    );
  }

  const input = new Float32Array(CHANNEL_SIZE * 3);
  for (let pixelIndex = 0; pixelIndex < CHANNEL_SIZE; pixelIndex += 1) {
    const sourceIndex = pixelIndex * 4;
    const red =
      (pixels.data[sourceIndex] / 255 - NORMALIZATION_MEAN[0]) /
      NORMALIZATION_STD[0];
    const green =
      (pixels.data[sourceIndex + 1] / 255 - NORMALIZATION_MEAN[1]) /
      NORMALIZATION_STD[1];
    const blue =
      (pixels.data[sourceIndex + 2] / 255 - NORMALIZATION_MEAN[2]) /
      NORMALIZATION_STD[2];
    if (inputLayout === "NCHW") {
      input[pixelIndex] = red;
      input[CHANNEL_SIZE + pixelIndex] = green;
      input[CHANNEL_SIZE * 2 + pixelIndex] = blue;
    } else {
      const destinationIndex = pixelIndex * 3;
      input[destinationIndex] = red;
      input[destinationIndex + 1] = green;
      input[destinationIndex + 2] = blue;
    }
  }

  return input;
};
