# HTTP Request Tool

## Overview
The HTTP Request Tool is a userscript designed to facilitate HTTP requests directly from the browser. It features URL auto - detection, cookie management, and a beautiful user interface. This tool is open - source and available on [GitHub](https://github.com/heikeson/http-request-tool).

### Features
- **URL Auto - Detection**: Automatically detects the current page URL, saving you time when making requests.
- **Cookie Management**: Manages cookies to ensure seamless communication with servers.
- **Beautiful UI**: Provides an intuitive and visually appealing interface for easy interaction.

## Installation

### Prerequisites
- A browser with support for userscripts. Recommended browsers include Google Chrome, Mozilla Firefox, and Safari.
- A userscript manager such as Tampermonkey (for Chrome and Firefox) or Greasemonkey (for Firefox).

### Steps
1. Install a userscript manager extension in your browser. For example, if you are using Chrome, you can install Tampermonkey from the [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo).
2. Open the userscript manager and click on the "Create a new script" option.
3. Copy and paste the entire content of the `main.js` file into the script editor.
4. Save the script. The HTTP Request Tool will now be available on all pages that match the `@match` pattern specified in the script metadata.

## Usage

### Opening the Tool
Click on the "HTTP Request Tool" button that appears at the bottom - right corner of the browser window. A floating window will pop up, allowing you to configure and send HTTP requests.

### Configuring the Request
- **URL**: The tool automatically populates the URL field with the current page URL. You can modify it if you want to send a request to a different endpoint.
- **Method**: Select the HTTP method (GET, POST, PUT, DELETE, etc.) by clicking on the corresponding button.
- **Headers**: Add or remove custom headers using the "Add" and "Remove" buttons. Each header consists of a key - value pair.
- **Body**: If your request requires a body, you can enter it in the "Body" section. The tool supports JSON formatting.

### Sending the Request
Once you have configured the request, click the "Send" button. The tool will display the response status code and the response body in the result section.

## Contribution

### How to Contribute
We welcome contributions from the open - source community. Here's how you can contribute:

1. **Fork the Repository**: Click the "Fork" button on the GitHub repository page to create your own copy of the project.
2. **Clone the Repository**: Clone your forked repository to your local machine using `git clone <repository - url>`.
3. **Create a New Branch**: Create a new branch for your feature or bug fix using `git checkout -b <branch - name>`.
4. **Make Changes**: Make your changes to the codebase.
5. **Test Your Changes**: Ensure that your changes do not break the existing functionality.
6. **Commit Your Changes**: Commit your changes using `git commit -m "<commit - message>"`.
7. **Push Your Changes**: Push your changes to your forked repository using `git push origin <branch - name>`.
8. **Create a Pull Request**: Go to the original repository on GitHub and click the "New Pull Request" button. Select your branch and submit the pull request.

### Code Style
Please follow the existing code style in the project. This includes using consistent indentation, naming conventions, and commenting.

### Bug Reports and Feature Requests
If you encounter a bug or have a feature request, please open an issue on the GitHub repository. Provide as much detail as possible, including steps to reproduce the bug or a clear description of the feature.

