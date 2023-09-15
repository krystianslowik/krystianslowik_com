import React from "react";

const ChatResponse = () => {
  return (
    <>
      <div
        className="px-6 pb-2 pt-4 text-gray-300"
        style={{ width: "400px !important" }}
      >
        <a
          href="mailto:me@krystianslowik.com"
          class="inline-flex items-center justify-center p-5 text-base font-medium text-gray-500 rounded-lg bg-gray-50 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
        >
          <svg
            fill="#a8a8a8"
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
            <span className="font-bold">Reach me via e-mail</span>
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
      <div
        className="pt-0 p-6 text-gray-300"
        style={{ width: "400px !important" }}
      >
        <a
          href="https://linkedin.com/in/krystianslovik"
          class="inline-flex items-center justify-center p-5 text-base font-medium text-gray-500 rounded-lg bg-gray-50 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="24px"
            height="24px"
            viewBox="0,0,256,256"
          >
            <g
              fill="#a8a8a8"
              fill-rule="nonzero"
              stroke="none"
              stroke-width="1"
              stroke-linecap="butt"
              stroke-linejoin="miter"
              stroke-miterlimit="10"
              stroke-dasharray=""
              stroke-dashoffset="0"
              font-family="none"
              font-weight="none"
              font-size="none"
              text-anchor="none"
            >
              <g transform="scale(5.12,5.12)">
                <path d="M41,4h-32c-2.76,0 -5,2.24 -5,5v32c0,2.76 2.24,5 5,5h32c2.76,0 5,-2.24 5,-5v-32c0,-2.76 -2.24,-5 -5,-5zM17,20v19h-6v-19zM11,14.47c0,-1.4 1.2,-2.47 3,-2.47c1.8,0 2.93,1.07 3,2.47c0,1.4 -1.12,2.53 -3,2.53c-1.8,0 -3,-1.13 -3,-2.53zM39,39h-6c0,0 0,-9.26 0,-10c0,-2 -1,-4 -3.5,-4.04h-0.08c-2.42,0 -3.42,2.06 -3.42,4.04c0,0.91 0,10 0,10h-6v-19h6v2.56c0,0 1.93,-2.56 5.81,-2.56c3.97,0 7.19,2.73 7.19,8.26z"></path>
              </g>
            </g>
          </svg>
          <span class="w-full px-5  ">
            <span className="font-bold">Check my LinkedIn</span>
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
    </>
  );
};

export default ChatResponse;
