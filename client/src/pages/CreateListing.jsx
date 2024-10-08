import { useState } from "react";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
// Alerts
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/toastStyles.css";

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: "",
    description: "",
    address: "",
    type: "rent",
    parking: false,
    furnished: false,
    offer: false,
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 2000,
    discountPrice: 0,
    area: 0,
    yearBuilt: "",
    propertyType: "House",
    amenities: "",
  });
  const [uploading, setUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setloading] = useState(false);

  const handelChange = (e) => {
    const { id, value, type, checked } = e.target;
  
    if (id === "sale" || id === "rent") {
      setFormData({
        ...formData,
        type: id,
      });
    } else if (type === "checkbox") {
      setFormData({
        ...formData,
        [id]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [id]: value,
      });
    }
  };

  const handelSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.imageUrls.length < 1)
        return setError("Must upload at least one image");
      if (+formData.regularPrice < +formData.discountPrice)
        return setError("Discounted Price must be lower than regular price");

      setloading(true);
      setError(false);
      const res = await fetch("/api/listing/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
      });
      const data = await res.json();
      setloading(false);
      if (data.success === false) {
        setError(data.message);
      }

      toast.success("Listing created successfully!");
      navigate(`/listing/${data._id}`);
    } catch (error) {
      setError(error.message);
      setloading(false);
    }
  };

  const handleImageSubmit = () => {
    if (files.length === 0) {
      toast.error("Please select at least one image to upload.");
      return;
    }

    if (files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setImageUploadError(null);

      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(storeImage(files[i]));
      }

      Promise.all(promises)
        .then((urls) => {
          setFormData((prev) => ({
            ...prev,
            imageUrls: prev.imageUrls.concat(urls),
          }));
          toast.success("Images uploaded successfully!");
          setUploading(false);
        })
        .catch(() => {
          toast.error("Image upload failed. (2 MB max per image)");
          setImageUploadError("Image Upload Failed (2 MB max per image)");
          setUploading(false);
        });
    } else {
      toast.error("You can only upload up to 6 images per listing.");
      setImageUploadError("6 Images per listing");
      setUploading(false);
    }
  };

  const storeImage = (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileName = new Date().getTime() + file.name;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on("state_changed", null, reject, () => {
        getDownloadURL(uploadTask.snapshot.ref).then(resolve);
      });
    });
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  return (
    <main className="p-3 mx-auto max-w-4xl mb-12">
      <h1 className="text-center text-3xl font-semibold my-7">
        Create a listing
      </h1>
      <form onSubmit={handelSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col gap-4 flex-1">
          <input
            type="text"
            placeholder="Name"
            className="border p-3 rounded-lg"
            minLength={7}
            maxLength={60}
            required
            id="name"
            onChange={handelChange}
            value={formData.name}
          />
          <textarea
            type="text"
            placeholder="Description"
            className="border p-3 rounded-lg"
            id="description"
            onChange={handelChange}
            value={formData.description}
          />
          <input
            type="text"
            placeholder="Address"
            className="border p-3 rounded-lg"
            id="address"
            required
            onChange={handelChange}
            value={formData.address}
          />

          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-row items-center gap-2 mt-4">
              <label htmlFor="area">Area (sq ft)</label>
              <input
                type="number"
                placeholder="Area (sq ft)"
                className="border p-3 rounded-lg w-1/2"
                id="area"
                onChange={handelChange}
                value={formData.area}
                required
              />
              <label htmlFor="yearBuilt">Year Built</label>
              <input
                type="number"
                placeholder="Year Built"
                className="border p-3 rounded-lg  w-1/2"
                id="yearBuilt"
                onChange={handelChange}
                value={formData.yearBuilt}
              />
            </div>
            <div className="flex flex-row items-center gap-2 w-full my-4">
              <label htmlFor="propertyType">Property Type</label>
              <select
                id="propertyType"
                className="border p-3 rounded-lg w-full"
                onChange={handelChange} 
                value={formData.propertyType}
              >
                <option value="House">House</option>
                <option value="Apartment">Apartment</option>
                <option value="Condo">Condo</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          
          <div className="flex flex-row items-center gap-2">
            <label htmlFor="amenities">Amenities</label>
            <input
              type="text"
              placeholder="Amenities (comma separated)"
              className="border p-3 rounded-lg w-full"
              id="amenities"
              onChange={handelChange}
              value={formData.amenities}
              required
            />
          </div>

          <div className="flex gap-6 flex-wrap">
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="sale"
                className="w-5"
                onChange={handelChange}
                checked={formData.type === "sale"}
              />
              <span>Sell</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="rent"
                className="w-5"
                onChange={handelChange}
                checked={formData.type === "rent"}
              />
              <span>Rent</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="parking"
                className="w-5"
                onChange={handelChange}
                checked={formData.parking}
              />
              <span>Parking Spot</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="furnished"
                className="w-5"
                onChange={handelChange}
                checked={formData.furnished}
              />
              <span>Furnished</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="offer"
                className="w-5"
                onChange={handelChange}
                checked={formData.offer}
              />
              <span>Offer</span>
            </div>
          </div>
          <div className="flex gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                className="p-3 rounded-lg border-gray-300"
                type="number"
                id="bedrooms"
                min={1}
                max={10}
                required
                onChange={handelChange}
                value={formData.bedrooms}
              />
              <p>Bedrooms</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="p-3 rounded-lg border-gray-300"
                type="number"
                id="bathrooms"
                min={1}
                max={10}
                required
                onChange={handelChange}
                value={formData.bathrooms}
              />
              <p>Bathrooms</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="p-3 rounded-lg border-gray-300"
                type="number"
                id="regularPrice"
                min={2000}
                max={10000000}
                required
                onChange={handelChange}
                value={formData.regularPrice}
              />
              <div className="flex flex-col items-center">
                <p>Regular Price</p>
                {formData.type === "rent" && (
                  <span className="text-xs">(₹ / month)</span>
                )}
              </div>
            </div>

            {formData.offer && (
              <div className="flex items-center gap-2">
                <input
                  className="p-3 rounded-lg border-gray-300"
                  type="number"
                  id="discountPrice"
                  min={0}
                  max={10000000}
                  required
                  onChange={handelChange}
                  value={formData.discountPrice}
                />

                <div className="flex flex-col items-center">
                  <p>Discounted Price</p>
                  {formData.type === "rent" && (
                    <span className="text-xs">(₹ / month)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-4">
          <p className="font-bold">
            Images:
            <span className="font-normal text-gray-600 ml-2">
              First image will be the cover (max-6)
            </span>
          </p>
          <div className="flex gap-4">
            <input
              className="p-3 border border-gray-400 rounded w-full"
              type="file"
              id="images"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files))}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={handleImageSubmit}
              className="p-3 text-green-700 border border-green-700 rounded hover:shadow-lg disabled:opacity-80 uppercase"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          <p className="text-red-700 text-sm">{imageUploadError}</p>
          {formData.imageUrls.length > 0 &&
            formData.imageUrls.map((url, index) => (
              <div
                key={url}
                className="flex justify-between items-center p-3 border"
              >
                <div className="relative">
                  <img
                    src={url}
                    alt="Listing Images"
                    className="w-40 h-20 object-contain rounded-lg hover:scale-110 transition-transform duration-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="text-red-700 uppercase hover:opacity-95 p-3 rounded-lg"
                >
                  Delete
                </button>
              </div>
            ))}
          <button
            disabled={loading || uploading}
            className="p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
          >
            {loading ? "Creating..." : "Create Listing"}
          </button>
          {error && <p className="text-red-700 text-sm">{error}</p>}
        </div>
      </form>
      <ToastContainer
        position="top-right"
        draggable
        autoClose={3000}
        hideProgressBar={false}
        className="font-normal"
      />
    </main>
  );
}
