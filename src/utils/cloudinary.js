const uploadImageToCloudinary = async (file) => {
  const CLOUDINARY_UPLOAD_PRESET = "profile-pics";
  const CLOUDINARY_CLOUD_NAME = "dpndvovax";
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  data.append("cloud_name", CLOUDINARY_CLOUD_NAME);

  try {
    const res = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: data,
    });

    if (!res.ok) {
      console.error("Cloudinary HTTP error:", res.status, res.statusText);
      return null;
    }

    const uploaded = await res.json();

    if (uploaded.error) {
      console.error("Cloudinary API error:", uploaded.error.message);
      return null;
    }

    if (!uploaded.secure_url) {
      console.error("Cloudinary: no secure_url in response", uploaded);
      return null;
    }

    return uploaded.secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    return null;
  }
};

export default uploadImageToCloudinary;
