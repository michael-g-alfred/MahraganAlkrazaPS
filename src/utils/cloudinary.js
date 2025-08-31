const uploadImageToCloudinary = async (file) => {
  const CLOUDINARY_UPLOAD_PRESET = "profile-pics";
  const CLOUDINARY_CLOUD_NAME = "dpndvovax";
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  data.append("cloud_name", CLOUDINARY_CLOUD_NAME);

  const res = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: data,
  });

  const uploaded = await res.json();
  return uploaded.secure_url;
};

export default uploadImageToCloudinary;
