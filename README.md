# Project agenda

One Paragraph of project description goes here

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## Makefile Commands

A set of `make` commands are available to streamline common development tasks.

### General

-   **`make all`**: Builds the application and runs the test suite. This is a convenient way to check if everything is correct.

-   **`make build`**: Compiles the Go backend application.
    ```bash
    make build
    ```

-   **`make run`**: Starts the backend server and the frontend development server.
    ```bash
    make run
    ```

-   **`make test`**: Executes the Go test suite.
    ```bash
    make test
    ```

-   **`make clean`**: Removes the compiled binary.
    ```bash
    make clean
    ```

-   **`make watch`**: Starts the backend server with live reload using `air`. It will prompt for installation if `air` is not found.
    ```bash
    make watch
    ```

### Docker

-   **`make docker-build`**: Builds the production Docker image for the application.
    ```bash
    make docker-build
    ```

-   **`make docker-run`**: Starts the application in production mode using Docker Compose.
    ```bash
    make docker-run
    ```

-   **`make docker-dev`**: Starts the application in development mode using Docker Compose, with services configured for local development and live reloading.
    ```bash
    make docker-dev
    ```

-   **`make docker-down`**: Stops all running Docker containers associated with the project.
    ```bash
    make docker-down
    ```

-   **`make docker-logs`**: Tails the logs from the running Docker Compose services.
    ```bash
    make docker-logs
    ```

-   **`make docker-clean`**: Stops and removes all containers, volumes, and networks defined in the Docker Compose file, and prunes unused Docker resources.
    ```bash
    make docker-clean
    ```
