import React from "react";
const Contact = () => {
  return (
    <>
      <main
        id="content"
        role="main"
        class="relative px-1 sm:px-6 lg:px-8 flex flex-col justify-center items-center w-full h-screen bg-gray-900"
      >
        <div class="text-center py-8 px-4 sm:px-6 lg:px-8">
          <h2 class="mt-1 sm:mt-3 text-4xl font-bold text-white sm:text-6xl">
            <span class="bg-clip-text bg-gradient-to-tr from-blue-600 to-purple-400 text-transparent">
              Krystian Słowik
            </span>
          </h2>

          <form>
            <div class="mt-8 space-y-4">
              <div>
                <label for="hs-cover-with-gradient-form-name-1" class="sr-only">
                  Your name
                </label>
                <div class="relative">
                  <input
                    type="text"
                    id="hs-cover-with-gradient-form-name-1"
                    class="py-3 ps-11 pe-4 block w-full bg-white/[.03] border-white/20 text-white placeholder:text-white rounded-md text-sm focus:border-white/30 focus:ring-white/30 sm:p-4 sm:ps-11"
                    placeholder="Your name"
                  />
                  <div class="absolute inset-y-0 left-0 flex items-center pointer-events-none z-20 ps-4">
                    <svg
                      class="h-4 w-4 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label
                  for="hs-cover-with-gradient-form-email-1"
                  class="sr-only"
                >
                  Email address
                </label>
                <div class="relative">
                  <input
                    type="email"
                    id="hs-cover-with-gradient-form-email-1"
                    class="py-3 ps-11 pe-4 block w-full bg-white/[.03] border-white/20 text-white placeholder:text-white rounded-md text-sm focus:border-white/30 focus:ring-white/30 sm:p-4 sm:ps-11"
                    placeholder="Email address"
                  />
                  <div class="absolute inset-y-0 left-0 flex items-center pointer-events-none z-20 ps-4">
                    <svg
                      class="h-4 w-4 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div class="grid">
                <button
                  type="submit"
                  class="py-3 px-4 inline-flex justify-center items-center gap-2 rounded-md bg-white/10 border border-transparent font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm sm:p-4"
                >
                  Contact me
                  <svg
                    class="w-3 h-3"
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
              </div>
            </div>
          </form>
        </div>
      </main>
      <footer class="absolute bottom-0 inset-x-0 text-center py-5">
        <div class="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <p class="text-sm text-white/50">©2023 krystianslowik.com</p>
        </div>
      </footer>
    </>
  );
};

export default Contact;
