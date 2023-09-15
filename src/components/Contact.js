import React from "react";
import ChatButton from "./ChatButton";
import ChatInput from "./ChatInput";
import ChatResponse from "./ChatResponse";
import AnimatedDescription from "./AnimatedDescription";
const Contact = () => {
  return (
    <>
      <main
        id="content"
        role="main"
        className="relative px-1 sm:px-6 lg:px-8 flex flex-col justify-center items-center w-full h-screen bg-gradient-to-tr from-gray-700 to-gray-900"
      >
        <div className="text-center py-8 px-4 sm:px-6 lg:px-8">
          <h2 className="mt-1 sm:mt-3 text-4xl font-bold text-white sm:text-6xl">
            <span className="bg-clip-text bg-gradient-to-tr from-blue-600 to-purple-300 text-transparent">
              Krystian Słowik
            </span>
          </h2>
          <AnimatedDescription />
          <form>
            <div className="mt-4 space-y-4 ">
              <div className="grid">
                <ChatResponse />
                <ChatInput />
                <ChatButton />
              </div>
            </div>
          </form>
        </div>
      </main>
      <footer className="absolute bottom-0 inset-x-0 text-center py-5">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-white/50">©2023 krystianslowik.com</p>
        </div>
      </footer>
    </>
  );
};

export default Contact;
