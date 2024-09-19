// Contact.js
import React from "react";
import AnimatedDescription from "./AnimatedDescription";
import Chat from "./Chat";
import ProfilePicture from "./ProfilePicture";

const Contact = () => {
    const imageUrl = "profile.png";

    return (
        <>
            <main
                id="content"
                role="main"
                className="flex flex-col justify-center items-center min-h-screen from-blue-100 to-purple-50 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20width=\'40\'%20height=\'40\'%20viewBox=\'0%200%2040%2040\'%3E%3Cline%20x1=\'0\'%20y1=\'40\'%20x2=\'40\'%20y2=\'0\'%20stroke=\'%23E5E7EB40\'%20stroke-width=\'1\'/%3E%3C/svg%3E')]
 bg-repeat text-gray-800"
            >
                <div className="text-center py-8 px-4 sm:px-6 lg:px-8 bg-white bg-opacity-30 rounded-lg backdrop-filter backdrop-blur-md">
                    <ProfilePicture imageUrl={imageUrl} />

                    <h1 className="mt-6 text-4xl font-extrabold sm:text-5xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
              Krystian Słowik
            </span>
                    </h1>

                    <p className="mt-4  max-w-2xl mx-auto text-gray-600">
                        fullstack developer &amp; tech enthusiast
                    </p>

                    <div className="mt-6">
                        <AnimatedDescription />
                    </div>

                    <div className="mt-10 w-full max-w-lg mx-auto">
                        <Chat />
                    </div>
                </div>
            </main>
        </>
    );
};

export default Contact;
