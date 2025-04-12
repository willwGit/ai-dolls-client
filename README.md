# AI Doll

An open source AI companion application built with Next.js. This project creates a modern, responsive AI chat interface with multilingual support.

## 🌟 Features

- Modern React-based UI with Tailwind CSS
- AI chat functionality
- Internationalization support
- Authentication integration
- Mobile-friendly responsive design

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- Yarn package manager
- SSL certificates for local development

### Setting up SSL for Local Development

1. Install `mkcert` for creating local trusted certificates:

   **On Windows**:

   ```
   # Install using Chocolatey
   choco install mkcert
   ```

   **On macOS**:

   ```
   # Install using Homebrew
   brew install mkcert
   ```

   **On Linux**:

   ```
   # Install mkcert appropriate for your distribution
   # Example for Ubuntu/Debian:
   apt install libnss3-tools
   # Then install the binary manually or via package manager
   ```

2. Generate certificates for localhost:

   ```
   mkcert localhost 127.0.0.1 ::1
   mkcert -install
   ```

3. Place the generated certificate files (`localhost+2.pem` and `localhost+2-key.pem`) in the `public` directory

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/willwGit/ai-dolls-client.git
   cd ai-dolls-client
   ```

2. Install dependencies:

   ```
   yarn install
   ```

3. Start the development server:
   ```
   yarn dev
   ```

The application will be available at https://127.0.0.1:3000

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Unlicense License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

Project Link: [https://github.com/willwGit/ai-dolls-client](https://github.com/willwGit/ai-dolls-client)
