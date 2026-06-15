export const loadImage = () => ({
  metadata: () => ({}),
  resize: () => ({}),
  format: () => ({}),
  toBuffer: () => Buffer.alloc(0),
});
export const createSharp = () => loadImage();
