import React from "react";

const InfoBox = () => {
  return (
    <div className="flex justify-center items-center text-gray-400/50 text-xs my-4 w-full">
      <span>
        Chat don't remember previous messages. <br />
        <b>Conversation is stored </b>for training purposes.
      </span>
    </div>
  );
};

export default InfoBox;
