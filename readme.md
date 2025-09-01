# Lisk Wallet MVP

This project is a simple web application that acts as a basic cryptocurrency wallet for a token called "LZAR" on the Lisk platform. It allows users to sign up, log in, and view their wallet balance and payment ID.

Think of it as a very early version (Minimum Viable Product) of a digital wallet.

## How It Works (Simple Overview)

The application is split into two main parts:

1.  **Frontend (What you see in the browser):** This is a single HTML page (`frontend/index.html`) built with plain HTML, CSS, and JavaScript. It provides the user interface for signing up, logging in, and viewing wallet information. It communicates with the backend to perform these actions.
2.  **Backend (The behind-the-scenes logic):** This is a server written in Node.js (`backend/server.js`). It handles user accounts (storing them securely in a database), manages user authentication (using tokens), and talks to another service (the "Rapyd API") to get wallet details like your balance.

## Key Features

*   **User Accounts:** Create a new account with an email and password, or log into an existing one.
*   **Wallet View:** Once logged in, see your current LZAR token balance and your unique Payment ID (used to receive money).
*   **Copy Payment ID:** Easily copy your Payment ID to share it with others.

## Technologies Used

*   **Frontend:** HTML, CSS, Vanilla JavaScript
*   **Backend:** Node.js, Express.js
*   **Database:** SQLite (a simple file-based database)
*   **Security:** bcrypt (for password hashing), jsonwebtoken (for login tokens)
*   **External API:** Rapyd API (for wallet functionalities)

## How to Run It (For Developers)

1.  **Prerequisites:** You need Node.js installed on your computer.
2.  **Setup:**
    *   Open your terminal or command prompt.
    *   Navigate to the `backend` folder.
    *   Run `npm install` to install all the necessary libraries.
3.  **Configuration:**
    *   In the `backend` folder, create a file named `.env`.
    *   Add your Rapyd API credentials and a secret key for tokens. It should look like this (replace the placeholder values with your actual ones):
        ```
        RAPYD_API_URL=https://your-rapyd-api-url.com/api/v1
        RAPYD_API_TOKEN=your_actual_rapyd_api_token_here
        JWT_SECRET=your_very_strong_secret_key_here
        ```
4.  **Start the Server:**
    *   In the `backend` folder, run `npm run dev` (for development with auto-restart) or `npm start` (for a standard start). The backend will typically run on `http://localhost:5000`.
5.  **Open the Frontend:**
    *   Open the `frontend/index.html` file directly in your web browser.
    *   Make sure the backend server is running!

## Important Security Note

The `.env` file contains very sensitive information (your API keys and secret tokens). It is correctly ignored by Git (`.gitignore`) to prevent accidental sharing. **Never commit this file or share its contents. Always use strong, unique secrets.**
