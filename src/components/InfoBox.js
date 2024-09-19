import React from "react";
import packageJson from "../../package.json";

const InfoBox = () => {
  const currentYear = new Date().getFullYear();
  const { version } = packageJson;

  return (
      <div className="p-4 bg-gray-50 text-center text-gray-500 text-xs border-t border-gray-200">
    <span>
      By clicking "<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400 font-bold">➔</span>" you accept our{" "}
      <a
          href="/Privacy_Policy.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-r from-blue-500 to-teal-400 font-bold"
      >
        Privacy Policy
      </a>
      .<br />
      <strong>Conversation is stored</strong> for training purposes.
      <div className="mt-2 text-gray-400">
        &copy; {` ${new Date().getFullYear()} v${version}`}
      </div>
    </span>
      </div>
  );

};

export default InfoBox;
