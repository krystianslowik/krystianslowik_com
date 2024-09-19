import React from "react";

const ProfilePicture = ({ imageUrl }) => {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`w-24 h-24 md:w-32 md:h-32 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full overflow-hidden p-1 shadow-lg`}
      >
        <img
          src={imageUrl}
          alt="Profile"
          className="object-cover object-center w-full h-full rounded-full"
        />
      </div>
    </div>
  );
};

export default ProfilePicture;
