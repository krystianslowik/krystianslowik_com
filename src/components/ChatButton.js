import React from "react";

const ChatButton = () => {
  return (
    <button
      type="submit"
      disabled
      className="cursor-not-allowed disabled py-3 px-4 inline-flex justify-center items-center gap-2 rounded-b-md bg-white/30 border border-transparent font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm sm:p-4"
    >
      Chat
      <svg
        className="w-3 h-3"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M5.27921 2L10.9257 7.64645C11.1209 7.84171 11.1209 8.15829 10.9257 8.35355L5.27921 14"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>
  );
};

export default ChatButton;
