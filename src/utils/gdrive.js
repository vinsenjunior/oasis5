export function convertDriveLink(url) {
  try {
    let id = null;

    // case: thumbnail?id=XYZ
    const thumbId = url.match(/[?&]id=([^&]+)/);
    if (thumbId) id = thumbId[1];

    // case: file/d/XYZ/
    const fileId = url.match(/\/d\/([^/]+)/);
    if (!id && fileId) id = fileId[1];

    if (id) {
      return `https://drive.google.com/uc?export=view&id=${id}`;
    }

    return null;
  } catch {
    return null;
  }
}
