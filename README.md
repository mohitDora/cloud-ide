# Cloud IDE

A full-stack cloud-based integrated development environment (IDE) that allows users to create, edit, and run code projects in isolated Docker containers. Built with React, Node.js, and WebSocket technology for real-time collaboration.

## 🚀 Features

- **Multi-language Support**: Create projects with Python or Node.js templates
- **Real-time Code Editor**: Monaco Editor with syntax highlighting and IntelliSense
- **Integrated Terminal**: Full terminal access within Docker containers
- **File Management**: Create, edit, delete, and rename files and folders
- **Docker Isolation**: Each project runs in its own isolated container
- **WebSocket Communication**: Real-time file updates and terminal interaction
- **Responsive UI**: Modern, dark-themed interface with resizable panels

## 🏗️ Architecture

The application follows a microservices architecture with three main components:

### Frontend (React + TypeScript)
- **Dashboard**: Project management interface
- **IDE**: Code editor with file tree and terminal
- **Monaco Editor**: Code editing with syntax highlighting
- **XTerm.js**: Terminal emulator for command execution

### Backend Services

#### HTTP Service (Port 3000)
- RESTful API for project management
- File operations (CRUD)
- Project creation and listing
- File tree management

#### Runner Service (Port 4000)
- WebSocket server for real-time communication
- Docker container management
- Terminal session handling
- File synchronization

#### Orchestrator Service
- Yet to configure for K8s

## 📁 Project Structure

```
cloud-ide/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Main application pages
│   │   └── utils/           # Utility functions and constants
│   └── package.json
├── backend/
│   ├── services/
│   │   ├── http/            # HTTP API service
│   │   ├── orchestrator/    # Service orchestration
│   │   └── runner/          # WebSocket and Docker service
│   └── package.json
├── s3/
│   ├── base/               # Project templates
│   │   ├── python/         # Python template
│   │   └── node/           # Node.js template
│   └── code/               # User project storage
├── db/
│   └── db.json             # Project metadata database
└── docker-compose.yml      # Container orchestration
```

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editor
- **XTerm.js** - Terminal emulator
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **WebSocket** - Real-time communication
- **Docker** - Containerization
- **node-pty** - Pseudo-terminal interface

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Docker
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cloud-ide
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend/services/http
   npm install
   
   cd ../runner
   npm install
   ```

4. **Build Docker base image**
   ```bash
   cd backend/services/runner
   docker build -f Dockerfile.base -t {YOUR_USERNAME}/sandbox:latest .
   ```

### Running the Application

1. **Start the HTTP service**
   ```bash
   cd backend/services/http
   npm start
   ```

2. **Start the Runner service**
   ```bash
   cd backend/services/runner
   npm start
   ```

3. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - HTTP API: http://localhost:3000
   - WebSocket: ws://localhost:4000

## 📖 Usage

### Creating a Project
1. Navigate to the dashboard
2. Click "Create App"
3. Enter project name and select template (Python or Node.js)
4. Click "Create"

### Working with Code
1. Select a project from the dashboard
2. Use the file tree to navigate and manage files
3. Edit code in the Monaco editor
4. Use the integrated terminal to run commands
5. Files are automatically saved and synchronized

### File Operations
- **Create**: Click the + button next to folders
- **Rename**: Click the edit icon and type new name
- **Delete**: Click the trash icon (with confirmation)
- **Edit**: Click on any file to open in the editor

## 🔧 Configuration

### Environment Variables
- `PORT` - Service port (default: 3000 for HTTP, 4000 for Runner)
- `BASE_IMAGE` - Docker base image (default: {YOUR_USERNAME}/sandbox:latest)

### User Configuration
Update `frontend/src/utils/constants.ts` to change:
- `userId` - Your user identifier
- `httpServerUrl` - HTTP API endpoint
- `wsServerUrl` - WebSocket endpoint

## 🐳 Docker Integration

The application uses Docker containers to isolate each project:

- **Base Image**: `{YOUR_USERNAME}/sandbox:latest`
- **Resources**: 256MB memory, 0.5 CPU cores
- **Volume Mounting**: Project files mounted to `/app`
- **Auto-cleanup**: Containers removed on disconnect

## 🔒 Security Considerations

- Each project runs in an isolated Docker container
- Resource limits prevent resource exhaustion
- File operations are scoped to user projects
- WebSocket connections are project-specific

## 🚧 Development Status

This project is currently in development with the following status:
- ✅ Core IDE functionality
- ✅ File management
- ✅ Terminal integration
- ✅ Docker containerization
- 🔄 Multi-user support (currently single user)
- 🔄 Authentication system
- 🔄 Project sharing features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request


## 🐛 Known Issues

- Single user configuration (hardcoded userId)
- No authentication system
- Limited error handling in some areas
- Container cleanup could be improved

## 🔮 Future Enhancements

- Multi-user authentication
- Project sharing and collaboration
- Additional language templates
- Git integration
- Plugin system
- Cloud deployment options
- Performance monitoring
- Resource usage analytics