import MonacoEditor from "@monaco-editor/react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { httpServerUrl, userId, wsServerUrl } from "@/utils/constants";

interface File {
  name: string;
  type: "file" | "folder";
  fullpath: string;
  children?: File[];
}

interface Project {

  containerName: string
  createdAt: string
  fileTree: File[]
  name: string
  projectId: string
  template: string
  userId: string
}

interface FolderStructureProps {
  folderStructure: File[];
  setSelectedFilename: (filename: string) => void;
}

const FolderTree = ({ folderStructure, setSelectedFilename }: FolderStructureProps) => {
  return (
    <div className="px-2">
      {folderStructure.map((folder) => (
        <div key={folder.fullpath} className="ml-4" onClick={() => folder.type === "file" && setSelectedFilename(folder.name)}>
          {folder.name}
          {folder.children && <FolderTree folderStructure={folder.children} setSelectedFilename={setSelectedFilename} />}
        </div>
      ))}
    </div>
  );
};

const Ide = () => {
  const { projectId } = useParams();

  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project>({
    containerName: "",
    createdAt: "",
    fileTree: [],
    name: "",
    projectId: "",
    template: "",
    userId: "",
  });
  const [files, setFiles] = useState<File[]>([]);

  const terminalRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);

  useEffect(() => {
    initializeTerminal();
    initializeWebSocket();
    if (projectId) {
      getProjectById(userId, projectId)
      getFiles(userId, projectId);
    }

    return () => {
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
      }

      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [projectId]);

  const getFileContent = useCallback(async (filepath: string) => {
    if (!filepath) return;
    try {
      const res = await axios.get(`${httpServerUrl}/file-content`, {
        params: {
          userId,
          projectId,
          filepath,
        },
      });

      setFileContent(res.data.fileContent);
    } catch (err) {
      console.log(err);
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedFilename) {
      getFileContent(selectedFilename)
    }
  }, [selectedFilename, getFileContent]);

  const getProjectById = async (userId: string, projectId: string) => {
    const res = await axios(`${httpServerUrl}/project?userId=${userId}&projectId=${projectId}`)
    setProject(res.data.project)
  }

  const initializeWebSocket = () => {
    wsRef.current = new WebSocket(wsServerUrl);
    wsRef.current.onopen = () => {
      setIsWebSocketConnected(true);
      terminalInstanceRef.current?.writeln("\r\n🔗 Connected to server...");
    };

    wsRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "terminal:output") {
          terminalInstanceRef.current?.write(msg.data);
        }

        if (msg.type === "error") {
          terminalInstanceRef.current?.writeln(
            `\r\n\x1b[31m[ERROR]\x1b[0m ${msg.message}`
          );
        }
      } catch (err) {
        console.error(err);
        terminalInstanceRef.current?.write(event.data);
      }
    };
    wsRef.current.onerror = (err) => {
      terminalInstanceRef.current?.writeln(
        "\r\n\x1b[31m[WebSocket Error]\x1b[0m Connection failed"
      );
      console.error(err);
    };

    wsRef.current.onclose = () => {
      setIsWebSocketConnected(false);
      terminalInstanceRef.current?.writeln(
        "\r\n\x1b[31m[Disconnected]\x1b[0m Lost connection to server"
      );
    };
  };

  function debounce(func: (...args: unknown[]) => void, delay: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: unknown[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  }

  const getFiles = async (userId: string, projectId: string) => {
    const res = await axios(`${httpServerUrl}/file-tree?userId=${userId}&projectId=${projectId}`)
    setFiles(res.data.fileTree);
  };



  // const saveFile = () => {};

  const initializeTerminal = () => {
    if (terminalRef.current) {
      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        theme: {
          background: "#1e1e1e",
          foreground: "#ffffff",
        },
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      terminal.open(terminalRef.current!);
      setTimeout(() => {
        fitAddon.fit();
      }, 0);

      terminal.writeln("Welcome to React + Xterm.js 🚀");

      terminal.onData((data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "terminal:input",
              input: data,
            })
          );
        }
      });

      terminalInstanceRef.current = terminal;

      const handleResize = () => {
        setTimeout(() => fitAddon.fit(), 100);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  };
  console.log(project)

  const sendFileUpdate = useMemo(
    () =>
      debounce((...args: unknown[]) => {
        const value = args[0] as string | undefined;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "file:update",
              userId,
              projectId,
              filePath: "main.js",
              content: value,
            })
          );
        }
      }, 2500),
    []
  );

  return (
    <main className="flex h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} className="max-w-[200px]">
          <FolderTree folderStructure={files} setSelectedFilename={setSelectedFilename} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50}>
              {
                selectedFilename ?
                  <MonacoEditor
                    height="100%"
                    language={project.template === "node" ? "javascript" : "python"}
                    onMount={(editor) => {
                      editor.focus();
                    }}
                    value={fileContent}
                    onChange={(value) => {
                      setFileContent(value || "");
                      sendFileUpdate(value || "");
                    }}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: "on",
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                    }}
                  /> :
                  <div className="h-full w-full flex items-center justify-center bg-black text-white">
                    <p className="text-2xl">Select a file to start coding</p>
                  </div>
              }
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel>
              {/* <div> */}

              <div
                id="terminal"
                ref={terminalRef}
                className="h-full w-full"
              ></div>
              {/* </div> */}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
};

export default Ide;
