import React from "react";

const ChatResponse = () => {
  return (
    <div className="p-6 text-gray-300" style={{ maxWidth: "400px" }}>
      <a
        href="mailto:me@krystianslowik.com"
        class="inline-flex items-center justify-center p-5 text-base font-medium text-gray-500 rounded-lg bg-gray-50 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <svg
          fill="#d1d1d1"
          width="18px"
          height="18px"
          viewBox="0 0 32.00 32.00"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#d1d1d1"
          stroke-width="0.00032"
        >
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            {" "}
            <title>at</title>{" "}
            <path d="M0 16q0-3.232 1.28-6.208t3.392-5.12 5.12-3.392 6.208-1.28q3.264 0 6.24 1.28t5.088 3.392 3.392 5.12 1.28 6.208v6.016q0 2.496-1.76 4.224t-4.224 1.76q-2.272 0-3.936-1.472t-1.984-3.68q-1.952 1.152-4.096 1.152-2.176 0-4-1.056t-2.944-2.912-1.056-4.032q0-3.296 2.336-5.632t5.664-2.368 5.664 2.368 2.336 5.632v6.016q0 0.8 0.608 1.408t1.408 0.576q0.8 0 1.408-0.576t0.576-1.408v-6.016q0-3.264-1.6-6.016t-4.384-4.352-6.016-1.632-6.016 1.632-4.384 4.352-1.6 6.016 1.6 6.048 4.384 4.352 6.016 1.6h2.016q0.8 0 1.408 0.608t0.576 1.408-0.576 1.408-1.408 0.576h-2.016q-3.264 0-6.208-1.248t-5.12-3.424-3.392-5.12-1.28-6.208zM12 16q0 1.664 1.184 2.848t2.816 1.152 2.816-1.152 1.184-2.848-1.184-2.816-2.816-1.184-2.816 1.184-1.184 2.816z"></path>{" "}
          </g>
        </svg>
        <span class="w-full px-5">
          Chat isn't available yet. <br />
          <span className="font-bold">Try reach me via @ instead!</span>
        </span>
        <svg
          class="w-4 h-4 ml-2"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 14 10"
        >
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M1 5h12m0 0L9 1m4 4L9 9"
          />
        </svg>
      </a>
    </div>
  );
};

export default ChatResponse;
