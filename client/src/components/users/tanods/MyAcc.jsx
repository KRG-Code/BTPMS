import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Navigate  } from "react-router-dom";
import { FaEdit, FaEye, FaEyeSlash } from "react-icons/fa";
import { compressImage } from "../../../utils/ImageCompression";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase";
import Loading from "../../../utils/Loading";
import { UserContext } from '../../../contexts/useContext'; // Import UserContext
import axios from 'axios';

const MyAcc = () => {
  const { refetchUserProfile } = useContext(UserContext);
  const navigate = useNavigate();
  const [accountState, setAccountState] = useState({
    firstName: "",
    lastName: "",
    address: "",
    contactNumber: "",
    birthday: "",
    gender: "",
    profilePicture: null,
    _id: "", // Add this to store user ID
  });
  const [localProfilePicture, setLocalProfilePicture] = useState(null);
  const [age, setAge] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true); // New loading state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userProfile, setUserProfile] = useState(null); // Define userProfile

  const calculateAge = (birthday) => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setLoadingUserData(true); // Start loading user data

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (response.ok) {
          setAccountState({
            firstName: data.firstName,
            lastName: data.lastName,
            address: data.address,
            contactNumber: data.contactNumber,
            birthday: data.birthday
              ? new Date(data.birthday).toISOString().split("T")[0]
              : "",
            gender: data.gender || "",
            profilePicture: data.profilePicture || null,
            _id: data._id, // Store the user ID
          });
          setAge(calculateAge(data.birthday));
        } else {
          toast.error(data.message || "Failed to load user data");
        }
      } catch (error) {
        toast.error("An error occurred while fetching user data.");
      } finally {
        setLoadingUserData(false); // End loading user data
      }
    };

    fetchData();
  }, [navigate]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setAccountState((prevState) => ({ ...prevState, [id]: value }));
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedFile = await compressImage(file);
        const imageUrl = URL.createObjectURL(compressedFile);
        setLocalProfilePicture(imageUrl);
        setAccountState((prevState) => ({
          ...prevState,
          profilePicture: compressedFile,
        }));
        toast.success("Profile picture selected!");
      } catch (error) {
        toast.error("Error processing profile picture. Please try again.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      let updatedProfilePictureURL = accountState.profilePicture;
      
      // Only upload new image if it's a File object
      if (accountState.profilePicture instanceof File) {
        const storageRef = ref(
          storage,
          `userprofiles/${Date.now()}_${accountState.profilePicture.name}`
        );
        const snapshot = await uploadBytes(storageRef, accountState.profilePicture);
        updatedProfilePictureURL = await getDownloadURL(snapshot.ref);
      }

      const updateData = {
        address: accountState.address,
        contactNumber: accountState.contactNumber,
        birthday: accountState.birthday,
        gender: accountState.gender,
        profilePicture: updatedProfilePictureURL,
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/update`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await response.json();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setLocalProfilePicture(null);
      await refetchUserProfile();
    } catch (error) {
      console.error("Update Error:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmNewPassword) {
      toast.error("All password fields are required.");
      return;
    }
    
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/change-password`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      toast.success("Password changed successfully! Redirecting to login...");
      
      // Clear form
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
      
      // Clear all auth data and redirect after a short delay
      setTimeout(() => {
        localStorage.clear();
        navigate("/tanod-login");
      }, 2000);

    } catch (error) {
      console.error("Password Change Error:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (userProfile) {
      setAccountState({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        address: userProfile.address,
        contactNumber: userProfile.contactNumber,
        birthday: userProfile.birthday
          ? new Date(userProfile.birthday).toISOString().split("T")[0]
          : "",
        gender: userProfile.gender || "",
        profilePicture: userProfile.profilePicture || null,
      });
    }
  };

  return (
    <div className="container mx-auto mt-8 space-y-6 ">
      <ToastContainer />
      <div className="flex ml-3">
        <div className="w-1/3">
          <div className="relative">
            {loadingUserData ? (
              <div className="flex justify-center items-center h-32">
                <Loading type="spinner" /> {/* Display loading indicator */}
              </div>
            ) : (
              <img
                src={
                  localProfilePicture ||
                  accountState.profilePicture ||
                  "/default-user-icon.png"
                }
                alt="Profile"
                className="rounded-full w-32 h-32 object-cover border-2 border-gray-200"
              />
            )}
            {isEditing && (
              <label
                htmlFor="profilePicture"
                className="absolute bottom-0 left-24 bg-white text-black border border-gray-300 p-1 rounded-full cursor-pointer"
              >
                <FaEdit />
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                />
              </label>
            )}
          </div>

          <div className="mt-6">
            <span className="text-lg font-semibold">Age: </span>
            <span>{age || "N/A"}</span>
          </div>

          <div className="mt-4">
            <span className="text-lg font-semibold">Gender: </span>
            {isEditing ? (
              <select
                id="gender"
                value={accountState.gender}
                onChange={handleChange}
                className="border px-2 py-1 text-black"
              >
                <option value="None">❌ None</option>
                <option value="Male">♂ Male</option>
                <option value="Female">♀ Female</option>
                <option value="Others">⚧ Others</option>
              </select>
            ) : (
              <span>{accountState.gender || "Not Specified"}</span>
            )}
          </div>

          {!isEditing && !isChangingPassword && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-6 mr-6 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Edit Profile
            </button>
          )}

          {!isEditing && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="mt-6 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Change Password
            </button>
          )}
        </div>

        <div className="w-2/3 ml-5">
          <h1 className="text-3xl font-bold">My Profile</h1>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="text-lg">
              <span className="font-semibold">Full Name: </span>
              {isEditing ? (
                <span>{`${accountState.firstName} ${accountState.lastName}`}</span>
              ) : (
                <span>{`${accountState.firstName} ${accountState.lastName}`}</span>
              )}
            </div>

            <div className="text-lg">
              <span className="font-semibold">Address: </span>
              {isEditing ? (
                <input
                  type="text"
                  id="address"
                  value={accountState.address}
                  onChange={handleChange}
                  className="border px-2 py-1 text-black"
                />
              ) : (
                <span>{accountState.address}</span>
              )}
            </div>

            <div className="text-lg">
              <span className="font-semibold">Contact Number: </span>
              {isEditing ? (
                <input
                  type="text"
                  id="contactNumber"
                  value={accountState.contactNumber}
                  onChange={handleChange}
                  className="border px-2 py-1 text-black"
                />
              ) : (
                <span>{accountState.contactNumber}</span>
              )}
            </div>

            <div className="text-lg">
              <span className="font-semibold">Birthday: </span>
              {isEditing ? (
                <input
                  type="date"
                  id="birthday"
                  value={accountState.birthday}
                  onChange={handleChange}
                  className="border px-2 py-1 text-black"
                />
              ) : (
                <span>{accountState.birthday}</span>
              )}
            </div>

            {loading && <p>Loading...</p>}

            {isEditing && (
              <>
                <button
                  type="submit"
                  className="mt-6 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="mt-6 ml-6 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            )}
          </form>

          {isChangingPassword && (
             <form className="mt-8 space-y-6" onSubmit={handlePasswordChange}>
             <div className="text-lg">
               <label htmlFor="currentPassword" className="font-semibold">
                 Current Password:{" "}
               </label>
               <div className="relative">
                 <input
                   type={showCurrentPassword ? "text" : "password"}
                   id="currentPassword"
                   value={passwords.currentPassword}
                   onChange={(e) =>
                     setPasswords({
                       ...passwords,
                       currentPassword: e.target.value,
                     })
                   }
                   className="border px-2 py-1 text-black w-full pr-10"
                 />
                 <button
                   type="button"
                   onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                   className="absolute right-2 top-1/2 transform -translate-y-1/2 focus:outline-none text-black"
                 >
                   {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                 </button>
               </div>
             </div>
       
             <div className="text-lg">
               <label htmlFor="newPassword" className="font-semibold">
                 New Password:{" "}
               </label>
               <div className="relative">
                 <input
                   type={showNewPassword ? "text" : "password"}
                   id="newPassword"
                   value={passwords.newPassword}
                   onChange={(e) =>
                     setPasswords({ ...passwords, newPassword: e.target.value })
                   }
                   className="border px-2 py-1 text-black w-full pr-10"
                 />
                 <button
                   type="button"
                   onClick={() => setShowNewPassword(!showNewPassword)}
                   className="absolute right-2 top-1/2 transform -translate-y-1/2 focus:outline-none text-black"
                 >
                   {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                 </button>
               </div>
             </div>
       
             <div className="text-lg">
               <label htmlFor="confirmNewPassword" className="font-semibold">
                 Confirm New Password:{" "}
               </label>
               <div className="relative">
                 <input
                   type={showConfirmPassword ? "text" : "password"}
                   id="confirmNewPassword"
                   value={passwords.confirmNewPassword}
                   onChange={(e) =>
                     setPasswords({
                       ...passwords,
                       confirmNewPassword: e.target.value,
                     })
                   }
                   className="border px-2 py-1 text-black w-full pr-10"
                 />
                 <button
                   type="button"
                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                   className="absolute right-2 top-1/2 transform -translate-y-1/2 focus:outline-none text-black"
                 >
                   {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                 </button>
               </div>
             </div>
       
             <button
               type="submit"
               className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
             >
               Change Password
             </button>
             <button
               type="button"
               onClick={() => setIsChangingPassword(false)}
               className="mt-6 ml-6 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
             >
               Cancel
             </button>
           </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAcc;
