# SER515-Group1-Frontend-Repo

# Agile Dashboard - Frontend

This repository contains the frontend codebase for the Agile Dashboard. The application is built with React and Vite, using ShadCN UI for the component library and Tailwind CSS for styling.

---

## ✨ Features till now (In Progress)

- **User Authentication:** Secure login and registration pages.
- **Kanban-style Dashboard:** Visualize and manage user stories across different stages (Proposed, In Refinement, etc.).
- **Story Management:** Create, view, and filter user stories.
- **Toast Notifications:** User-friendly feedback for API actions.
- **Vercel:** For Deployment.

---

## 🛠️ Technology Stack

- **Framework:** [React](https://reactjs.org/) v19.1.1
- **Build Tool:** [Vite](https://vitejs.dev/)
- **UI Library:** [ShadCN UI](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Routing:** [React Router DOM](https://reactrouter.com/)
- **API Client:** [Axios](https://axios-http.com/)
- **Node.js Version:** v20.19.4

---

## 🚀 Deployment URL
**URL:** https://515-group1.vercel.app
- First Sign-up with new user then test out our agile requirement tool.

---

## 📚 Getting Started

This project is designed to be run via Docker Compose alongside its backend counterpart. The following instructions will guide you through the complete setup process for the full-stack application.

### Prerequisites

1.  **Git:** You must have Git installed to clone the repositories.
2.  **Docker & Docker Compose:** You must have Docker Desktop (or Docker Engine with the Compose plugin) installed and running.
    - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Installation and Setup

1.  **Clone both repositories** into a single parent directory.

    ```bash
    # Make sure you are in your main development folder
    git clone git@github.com:SER-515-Group1-Repo/SER515-Group1-Frontend-Repo.git
    git clone git@github.com:SER-515-Group1-Repo/SER515-Group1-Backend-Repo.git
    ```

    Your folder structure should look like this:

    ```
    - Your-Project-Folder/
      ├── SER515-Group1-Backend-Repo/
      └── SER515-Group1-Frontend-Repo/
    ```

2.  **Navigate into the backend directory**, as it contains the main `docker-compose.yml` file that orchestrates the entire application.

    ```bash
    cd SER515-Group1-Backend-Repo
    ```

3.  **Create the backend environment file.** Copy the example file to create your local `.env` file. This file contains the necessary secrets and configuration for the backend and database.

    *   **On macOS / Linux:**
        ```bash
        cp .env.example .env
        ```
    *   **On Windows (Command Prompt):**
        ```bash
        copy .env.example .env
        ```

    _(No customization is needed for a standard local setup.)_

4.  **Create the frontend environment file.** This command creates the `.env` file inside the frontend directory, which the Docker build process will use.
    
    *   **On macOS / Linux:**
        ```bash
        cp ../SER515-Group1-Frontend-Repo/.env.example ../SER515-Group1-Frontend-Repo/.env
        ```
    *   **On Windows (Command Prompt):**
        ```bash
        copy ..\SER515-Group1-Frontend-Repo\.env.example ..\SER515-Group1-Frontend-Repo\.env
        ```

### Running the Full-Stack Application

From the root of the **`SER515-Group1-Backend-Repo`** directory, run the following command:

```bash
docker-compose up --build
```

---

## 🌐 Accessing the Application

Once the Docker containers are running, you can access the services at the following URLs:

- **Frontend Application:** [**http://localhost:5173**](http://localhost:5173)
- **Backend API Base URL:** [**http://localhost:8000**](http://localhost:8000)
- **Backend Interactive API Docs:** [**http://localhost:8000/docs**](http://localhost:8000/docs)
