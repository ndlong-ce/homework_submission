// Chạy ở trình duyệt: thu nhỏ + nén ảnh thành JPEG base64 để lưu thẳng vào database.
const TARGET = 1_500_000; // ký tự base64

export async function compressImage(file, maxDim = 1600) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Không đọc được ảnh này'));
      i.src = url;
    });
    let scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    for (let attempt = 0; attempt < 5; attempt++) {
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const b64 = c.toDataURL('image/jpeg', attempt === 0 ? 0.85 : 0.7).split(',')[1];
      if (b64.length <= TARGET) return b64;
      scale *= 0.75;
    }
    throw new Error('Ảnh quá lớn, hãy chọn ảnh nhỏ hơn');
  } finally {
    URL.revokeObjectURL(url);
  }
}
