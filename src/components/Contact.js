import React from "react";
import ChatInput from "./ChatInput";
import ChatResponse from "./ChatResponse";
import AnimatedDescription from "./AnimatedDescription";
import packageJson from "../../package.json";
import Chat from "./Chat";

const Contact = () => {
  const currentYear = new Date().getFullYear();
  const { version } = packageJson;

  return (
    <>
      <main
        id="content"
        role="main"
        className="relative px-1 sm:px-6 lg:px-8 flex flex-col justify-center items-center w-full h-screen bg-gradient-to-tr from-gray-700 to-gray-900"
      >
        <div className="text-center py-8 px-4 sm:px-6 lg:px-8">
          <h2 className="mt-1 sm:mt-3 text-4xl font-bold text-white sm:text-6xl">
            <span className="bg-clip-text bg-gradient-to-tr from-blue-400 to-purple-600 text-transparent">
              Krystian Słowik
            </span>
          </h2>
          <AnimatedDescription />
          <Chat />
        </div>
      </main>
      <footer className="absolute bottom-0 inset-x-0 text-center py-5">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-white/50">
            &copy;{currentYear} krystianslowik.com{" "}
            <span className="text-gray-400/40 ">(v{version})</span>
          </p>
        </div>
      </footer>
    </>
  );
};

export default Contact;
