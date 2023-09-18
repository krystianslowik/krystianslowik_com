import React from "react";
import packageJson from "../../package.json";

const InfoBox = () => {
  const currentYear = new Date().getFullYear();
  const { version } = packageJson;

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
        <b>Conversation is stored </b>for training purposes. <br />
        <div className="mt-3 text-gray-400/30">
          &copy;{` ${currentYear} v${version}`}
        </div>
      </span>
    </div>
  );
};

export default InfoBox;
