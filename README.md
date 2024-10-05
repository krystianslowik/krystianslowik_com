
# Krystian Słowik - Personal Website
[![Build and Deploy to krystianslowik.com](https://github.com/krystianslowik/krystianslowik_com/actions/workflows/deploy.yml/badge.svg)](https://github.com/krystianslowik/krystianslowik_com/actions/workflows/deploy.yml)
This repository contains the source code for my personal website, a single-page React application that showcases my work and provides a platform for interactive communication using a chat feature powered by the OpenAI API.

![krystianslowik.com](https://i.imgur.com/9rPmBKA.png)

## Technology Stack

- **Frontend:** React.js
- **Styling:** Tailwind CSS with HeadlessUI and Heroicons for UI components
- **Testing:** Jest and React Testing Library
- **API Integration:** OpenAI for chatbot functionality
- **Analytics:** Google Analytics with React-GA
- **Audio:** Custom audio notifications

## Project Structure

- `src/`: The main directory for React components.
  - `API/`: Contains OpenAI API configuration.
  - `assets/`: Includes images, audio files, and SVG components.
  - `components/`: React components for various UI elements.
- `public/`: Static files for the web application.

## Setup and Installation

To get the project up and running on your local machine, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/krystianslowik/krystianslowik.git
   ```
2. Navigate to the project directory:
   ```
   cd krystianslowik
   ```
3. Create a `.env` file in the root of the project and add your OpenAI API key:
   ```
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   ```
   Replace `your_openai_api_key_here` with the actual API key you obtained from OpenAI.
4. Install the dependencies:
   ```
   npm install
   ```
5. Start the development server:
   ```
   npm start
   ```

## Available Scripts

In the project directory, you can run:

- `npm start`: Runs the app in development mode.
- `npm test`: Launches the test runner.
- `npm run build`: Builds the app for production.
- `npm run eject`: Removes the single build dependency.

## CI/CD Pipeline

The project is configured with a GitHub Actions workflow that automatically builds and deploys the application to the production server upon any push to the `main` branch. The OpenAI API key is injected into the build process as an environment variable from GitHub Secrets.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or create an issue for any bugs or feature suggestions.

## License

This project is open source and available under the [MIT License](https://opensource.org/license/mit/).
