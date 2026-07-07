# Shhh

## Overview

Shhh is a real-time messaging application built to facilitate quick and secure communication between users. It's designed for individuals who need an easy, reliable way to send messages instantly without any fuss.

[![GitHub stars](https://img.shields.io/github/stars/lokesh-makam/Shhh?style=social)](https://github.com/lokesh-makam/Shhh/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/lokesh-makam/Shhh?style=social)](https://github.com/lokesh-makam/Shhh/network/members)

## Features

- **Real-Time Messaging**: Send messages instantly with zero delay.
- **Secure Communication**: Messages are encrypted to ensure privacy and security.
- **User-Friendly Interface**: A clean, intuitive interface for easy use.

## Tech Stack

### Frontend
- **TypeScript**: For type safety and better code quality.
- **React**: The primary UI library for building the frontend.
- **Vite**: Fast development server with hot module replacement (HMR).
- **React Router**: For handling routing in a single-page application.

### Backend
- **TypeScript**: Ensures robustness and maintainability of the backend logic.
- **Express.js**: A minimal and flexible Node.js web application framework.
- **WebSocket**: Enables real-time communication between clients and server.

## Project Structure

The project is organized into two workspaces: `backend` and `frontend`.

### Backend
Located in the `backend` directory, this workspace contains all the server-side logic. It uses Express.js to handle HTTP requests and WebSocket for real-time messaging.

### Frontend
Found in the `frontend` directory, this workspace includes the user interface built with React and Vite. It handles routing and provides a seamless user experience.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

### Install
Navigate to the project root and run:

```sh
npm install
```

### Environment Setup
Create a `.env` file in each workspace with the necessary environment variables. For example, in the `frontend/.env` file, you might have:

```plaintext
VITE_WS_URL=ws://localhost:3001
```

### Run
Start the development servers for both frontend and backend:

**Backend:**

```sh
cd backend
npm run dev
```

**Frontend:**

```sh
cd frontend
npm run dev
```

## Environment Variables

| Category      | Name          | Required | Sensitive | Description                 |
|---------------|---------------|----------|-----------|-----------------------------|
| **API Keys**  | VITE_WS_URL   | Yes      | No        | WebSocket server URL for the frontend to connect. |

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/AmazingFeature`).
3. Make your changes and commit them (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a pull request.

By following these steps, you can help improve Shhh for everyone!