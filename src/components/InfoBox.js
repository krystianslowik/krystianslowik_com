import React from "react";

const InfoBox = () => {
  return (
    <div className="flex justify-center items-center text-gray-400/50 text-xs my-4 w-full">
      <span>
        By clicking "Send" you accept{" "}
        <a
          href="/Privacy_Policy.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Privacy Policy
        </a>
        . <br />
        <b>Conversation is stored </b>for training purposes.
      </span>
    </div>
  );
};

export default InfoBox;
